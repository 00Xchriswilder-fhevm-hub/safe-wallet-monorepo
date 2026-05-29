/** Zama user-decrypt: prepare → EIP-712 sign → complete. */
import type { Eip1193Provider } from 'ethers'
import { createWalletClient, custom, getAddress, type Address, type Chain } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { getRelayerBaseUrlForChainId, MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID } from './relayerConstants'
import { relayerUserDecryptComplete, relayerUserDecryptPrepare } from './relayer'

const decryptCache = new Map<string, bigint>()

function cacheKey(chainId: number, handle: string, contract: string) {
  return `${chainId}:${contract.toLowerCase()}:${handle.toLowerCase()}`
}

function chainFromId(chainId: number): Chain {
  if (chainId === MAINNET_CHAIN_ID) return mainnet
  if (chainId === SEPOLIA_CHAIN_ID) return sepolia
  throw new Error(`Confidential user-decrypt is not supported on chain ${chainId}`)
}

function chainLabel(chainId: number): string {
  if (chainId === SEPOLIA_CHAIN_ID) return 'Sepolia'
  if (chainId === MAINNET_CHAIN_ID) return 'Ethereum mainnet'
  return `chain ${chainId}`
}

/** Active chain reported by the wallet RPC (`eth_chainId`). */
export async function getWalletProviderChainId(provider: Eip1193Provider): Promise<number> {
  const hex = (await provider.request({ method: 'eth_chainId' })) as string
  return Number(hex)
}

export function assertWalletMatchesAppChain(appChainId: number, walletChainId: number): void {
  if (appChainId === walletChainId) return
  throw new Error(
    `Network mismatch: this Safe is on ${chainLabel(appChainId)} (${appChainId}) but your wallet is on ${chainLabel(walletChainId)} (${walletChainId}). ` +
      `Switch your wallet to ${chainLabel(appChainId)}, then reconnect or refresh and try decrypt again.`,
  )
}

export function toTypedDataV4Params(eip712: Record<string, unknown>) {
  const { domain, types, message, primaryType } = eip712
  const domainObj = (domain ?? {}) as Record<string, unknown>
  const chainId = domainObj.chainId
  const domainNormalized =
    chainId !== undefined
      ? { ...domainObj, chainId: typeof chainId === 'string' ? parseInt(chainId, 10) : Number(chainId) }
      : domainObj
  const msg = (message ?? {}) as Record<string, unknown>
  const messageNormalized = { ...msg }
  if (typeof messageNormalized.startTimestamp === 'string')
    messageNormalized.startTimestamp = parseInt(messageNormalized.startTimestamp as string, 10)
  if (typeof messageNormalized.durationDays === 'string')
    messageNormalized.durationDays = parseInt(messageNormalized.durationDays as string, 10)
  return {
    domain: domainNormalized,
    types: (types as Record<string, unknown>) ?? {},
    message: messageNormalized,
    primaryType: (primaryType as string) ?? 'UserDecryptRequestVerification',
  }
}

function pickDecryptedValue(result: Record<string, unknown>, handle: string): unknown {
  const lower = handle.toLowerCase()

  const fromFlat = (obj: Record<string, unknown>): unknown => {
    if (obj[handle] !== undefined && obj[handle] !== null) return obj[handle]
    for (const [k, v] of Object.entries(obj)) {
      if (k.toLowerCase() === lower) return v
    }
    return undefined
  }

  const direct = fromFlat(result)
  if (direct !== undefined && direct !== null) return direct

  for (const nestedKey of ['decrypted', 'values', 'data', 'result'] as const) {
    const nested = result[nestedKey]
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const inner = fromFlat(nested as Record<string, unknown>)
      if (inner !== undefined && inner !== null) return inner
    }
  }

  return undefined
}

function toBigIntValue(value: unknown): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(Math.floor(value))
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) throw new Error('Decrypt returned an empty amount.')
    return BigInt(trimmed)
  }
  throw new Error(`Unexpected decrypt value type: ${typeof value}`)
}

export function toDecryptErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes('must match the active chainId')) {
      return (
        'Wallet network does not match this Safe. The app is on Sepolia but your wallet RPC is on mainnet (or the reverse). ' +
        'Switch the network in your wallet to match the Safe URL, disconnect/reconnect the wallet, then try again.'
      )
    }
    return err.message
  }
  if (typeof err === 'object' && err !== null) {
    const o = err as Record<string, unknown>
    if (typeof o.shortMessage === 'string') return o.shortMessage
    if (typeof o.message === 'string') return o.message
    if (typeof o.details === 'string') return o.details
    if (o.code === 4001) return 'Signature rejected in wallet.'
  }
  if (typeof err === 'string' && err.trim()) return err
  return 'Decrypt failed. Check wallet network, relayer URL, and that ACL was granted for this balance handle.'
}

async function signUserDecryptEip712(
  userAddress: string,
  walletChainId: number,
  provider: Eip1193Provider,
  eip712: Record<string, unknown>,
): Promise<string> {
  const typedData = toTypedDataV4Params(eip712)
  const account = getAddress(userAddress) as Address
  const walletClient = createWalletClient({
    account,
    chain: chainFromId(walletChainId),
    transport: custom(provider),
  })

  return walletClient.signTypedData({
    account,
    domain: typedData.domain as Record<string, unknown>,
    types: typedData.types as Record<string, Array<{ name: string; type: string }>>,
    primaryType: typedData.primaryType,
    message: typedData.message as Record<string, unknown>,
  })
}

/**
 * Decrypt one handle for a confidential token contract (wallet must sign EIP-712 from relayer).
 */
export async function userDecryptHandleWithWallet(params: {
  /** Safe / app chain (from URL). Drives relayer + contract addresses. */
  chainId: number
  userAddress: string
  handle: string
  contractAddress: string
  provider: Eip1193Provider
  /** Onboard-reported chain; verified against `eth_chainId` before signing. */
  walletChainIdHint?: number
}): Promise<bigint> {
  const { chainId, userAddress, handle, contractAddress, provider, walletChainIdHint } = params
  const normalizedHandle = handle.startsWith('0x') ? handle : `0x${handle}`
  const normalizedContract = getAddress(contractAddress)

  const providerChainId = await getWalletProviderChainId(provider)
  const walletChainId =
    walletChainIdHint != null && walletChainIdHint > 0 && walletChainIdHint === providerChainId
      ? walletChainIdHint
      : providerChainId

  assertWalletMatchesAppChain(chainId, walletChainId)

  const key = cacheKey(chainId, normalizedHandle, normalizedContract)
  const cached = decryptCache.get(key)
  if (cached != null) return cached

  const baseUrl = getRelayerBaseUrlForChainId(chainId)
  const prepare = await relayerUserDecryptPrepare(
    { handles: [normalizedHandle], contractAddresses: [normalizedContract] },
    baseUrl,
  )
  const { requestId, eip712 } = prepare

  const signature = await signUserDecryptEip712(userAddress, walletChainId, provider, eip712 as Record<string, unknown>)

  const result = await relayerUserDecryptComplete(
    { requestId, signature, userAddress: getAddress(userAddress) },
    baseUrl,
  )
  const raw = pickDecryptedValue(result, normalizedHandle)
  if (raw === undefined || raw === null) {
    throw new Error(
      `Decrypt returned no value for this handle. Relayer keys: ${Object.keys(result).slice(0, 8).join(', ') || '(empty)'}`,
    )
  }
  const big = toBigIntValue(raw)
  decryptCache.set(key, big)
  return big
}

export function peekDecryptCache(chainId: number, handle: string, contractAddress: string): bigint | undefined {
  return decryptCache.get(cacheKey(chainId, handle, contractAddress))
}

export function clearDecryptCacheEntry(chainId: number, handle: string, contractAddress: string): void {
  decryptCache.delete(cacheKey(chainId, handle, contractAddress))
}
