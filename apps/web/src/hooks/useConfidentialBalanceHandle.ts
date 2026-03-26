import { useCallback, useEffect, useState } from 'react'
import { BrowserProvider, Contract, type Eip1193Provider } from 'ethers'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import {
  CONF_TOKEN_ABI,
  getConfidentialTokenAddress,
  type ConfidentialTokenKey,
} from '@/services/confidential/contracts'
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID } from '@/services/confidential/relayerConstants'

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

/**
 * Reads `confidentialBalanceOf(safe)` (encrypted handle) from the confidential token contract via the connected wallet RPC.
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
      const provider = new BrowserProvider(wallet.provider as Eip1193Provider)
      const contract = new Contract(confToken, CONF_TOKEN_ABI, provider)
      const raw = await contract.confidentialBalanceOf(safeAddress)
      const h = normalizeHandle(raw)
      setHandle(h || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read confidential balance')
      setHandle(null)
    } finally {
      setLoading(false)
    }
  }, [canFetch, confToken, safeAddress, wallet?.provider])

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
