/** Zama user-decrypt: prepare → eth_signTypedData_v4 → complete. */
import type { Eip1193Provider } from 'ethers'
import { getRelayerBaseUrlForChainId } from './relayerConstants'
import { relayerUserDecryptComplete, relayerUserDecryptPrepare } from './relayer'

const decryptCache = new Map<string, bigint>()

function cacheKey(chainId: number, handle: string, contract: string) {
  return `${chainId}:${contract.toLowerCase()}:${handle}`
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
    primaryType: primaryType ?? 'UserDecryptRequestVerification',
  }
}

function canonicalStringify(obj: unknown): string {
  const sortKeys = (o: unknown): unknown => {
    if (o !== null && typeof o === 'object' && !Array.isArray(o)) {
      const sorted: Record<string, unknown> = {}
      for (const k of Object.keys(o as object).sort()) {
        sorted[k] = sortKeys((o as Record<string, unknown>)[k])
      }
      return sorted
    }
    return o
  }
  return JSON.stringify(sortKeys(obj))
}

function pickDecryptedValue(result: Record<string, unknown>, handle: string): unknown {
  if (result[handle] !== undefined && result[handle] !== null) return result[handle]
  const lower = handle.toLowerCase()
  for (const k of Object.keys(result)) {
    if (k.toLowerCase() === lower) return result[k]
  }
  return undefined
}

function toBigIntValue(value: unknown): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(Math.floor(value))
  return BigInt(String(value))
}

/**
 * Decrypt one handle for a confidential token contract (wallet must sign EIP-712 from relayer).
 */
export async function userDecryptHandleWithWallet(params: {
  chainId: number
  userAddress: string
  handle: string
  contractAddress: string
  provider: Eip1193Provider
}): Promise<bigint> {
  const { chainId, userAddress, handle, contractAddress, provider } = params
  const key = cacheKey(chainId, handle, contractAddress)
  const cached = decryptCache.get(key)
  if (cached != null) return cached

  const baseUrl = getRelayerBaseUrlForChainId(chainId)
  const prepare = await relayerUserDecryptPrepare({ handles: [handle], contractAddresses: [contractAddress] }, baseUrl)
  const { requestId, eip712 } = prepare
  const typedData = toTypedDataV4Params(eip712 as Record<string, unknown>)

  const signature = (await provider.request({
    method: 'eth_signTypedData_v4',
    params: [userAddress, canonicalStringify(typedData)],
  })) as string

  const result = await relayerUserDecryptComplete({ requestId, signature, userAddress }, baseUrl)
  const raw = pickDecryptedValue(result, handle)
  if (raw === undefined || raw === null) {
    throw new Error('Decrypt returned no value for this handle.')
  }
  const big = toBigIntValue(raw)
  decryptCache.set(key, big)
  return big
}

export function peekDecryptCache(chainId: number, handle: string, contractAddress: string): bigint | undefined {
  return decryptCache.get(cacheKey(chainId, handle, contractAddress))
}
