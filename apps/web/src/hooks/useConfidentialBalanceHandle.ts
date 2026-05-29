import { useCallback, useEffect, useState } from 'react'
import { BrowserProvider, Contract, JsonRpcProvider, type Eip1193Provider } from 'ethers'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import {
  CONF_TOKEN_ABI,
  getConfidentialTokenAddress,
  type ConfidentialTokenKey,
} from '@/services/confidential/contracts'
import {
  getConfidentialBalanceReadRpcUrl,
  MAINNET_CHAIN_ID,
  SEPOLIA_CHAIN_ID,
} from '@/services/confidential/relayerConstants'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

/** All-zero bytes32 (empty / trivial ciphertext handle). */
const ZERO_B32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as const

function normalizeHandle(value: unknown): string {
  if (typeof value === 'string') return value
  if (value != null && typeof (value as { toString?: () => string }).toString === 'function') {
    return (value as { toString: () => string }).toString()
  }
  return ''
}

async function readBalanceHandle(
  confToken: `0x${string}`,
  safeAddress: `0x${string}`,
  walletProvider: Eip1193Provider,
  chainId: number,
): Promise<string> {
  const run = (provider: BrowserProvider | JsonRpcProvider) => {
    const contract = new Contract(confToken, CONF_TOKEN_ABI, provider)
    return contract.confidentialBalanceOf(safeAddress)
  }

  try {
    const browserProvider = new BrowserProvider(walletProvider)
    const raw = await run(browserProvider)
    const h = normalizeHandle(raw)
    return h && h.length > 0 ? h : ZERO_B32
  } catch {
    const rpcUrl = getConfidentialBalanceReadRpcUrl(chainId)
    if (!rpcUrl) {
      throw new Error('No read RPC fallback for this chain')
    }
    const jsonProvider = new JsonRpcProvider(rpcUrl, chainId)
    const raw = await run(jsonProvider)
    const h = normalizeHandle(raw)
    return h && h.length > 0 ? h : ZERO_B32
  }
}

/**
 * Reads `confidentialBalanceOf(safe)` (encrypted handle). Tries the wallet RPC first, then a public read RPC if the
 * wallet returns empty / undecodable data (common on mainnet with some injected providers).
 */
export function useConfidentialBalanceHandle(tokenKey: ConfidentialTokenKey = 'usdc') {
  const chainIdStr = useChainId()
  const chainId = Number(chainIdStr)
  const { safeAddress } = useSafeInfo()
  const wallet = useWallet()

  const [handle, setHandle] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confToken = getConfidentialTokenAddress(chainId, tokenKey)
  const supported = chainId === SEPOLIA_CHAIN_ID || chainId === MAINNET_CHAIN_ID
  const canFetch = Boolean(supported && confToken && confToken !== ZERO_ADDRESS && safeAddress && wallet?.provider)

  const refetch = useCallback(async () => {
    if (!canFetch || !confToken || !safeAddress || !wallet?.provider) {
      setHandle(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const h = await readBalanceHandle(
        confToken as `0x${string}`,
        safeAddress as `0x${string}`,
        wallet.provider as Eip1193Provider,
        chainId,
      )
      setHandle(h)
    } catch (e) {
      setHandle(null)
      const technical = e instanceof Error ? e.message : String(e)
      setError(
        `Could not read confidential balance for ${confToken}. Wallet RPC and public fallback both failed. Set NEXT_PUBLIC_MAINNET_PUBLIC_RPC_URL / NEXT_PUBLIC_SEPOLIA_PUBLIC_RPC_URL if needed. (${technical})`,
      )
    } finally {
      setLoading(false)
    }
  }, [canFetch, chainId, confToken, safeAddress, wallet?.provider])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return {
    handle,
    loading,
    error,
    confToken,
    refetch,
    canFetch,
    supported,
    chainId,
  }
}

export function isZeroBytes32Handle(handle: string | null | undefined): boolean {
  if (!handle) return true
  const h = handle.toLowerCase()
  return h === ZERO_B32
}
