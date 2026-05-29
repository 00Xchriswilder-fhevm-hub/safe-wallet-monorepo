import { useCallback, useEffect, useState } from 'react'
import { BrowserProvider, Contract, JsonRpcProvider, type Eip1193Provider } from 'ethers'
import useChainId from '@/hooks/useChainId'
import useWallet from '@/hooks/wallets/useWallet'
import { ACL_ABI, getAclProxyForChainId } from '@/services/confidential/contracts'
import { getConfidentialBalanceReadRpcUrl } from '@/services/confidential/relayerConstants'

async function readIsAllowed(
  aclAddress: `0x${string}`,
  handle: string,
  account: `0x${string}`,
  walletProvider: Eip1193Provider,
  chainId: number,
): Promise<boolean> {
  const run = (provider: BrowserProvider | JsonRpcProvider) => {
    const c = new Contract(aclAddress, ACL_ABI, provider)
    return c.isAllowed(handle, account)
  }

  try {
    const browserProvider = new BrowserProvider(walletProvider)
    const ok = await run(browserProvider)
    return Boolean(ok)
  } catch {
    const rpcUrl = getConfidentialBalanceReadRpcUrl(chainId)
    if (!rpcUrl) {
      throw new Error('No read RPC fallback for this chain')
    }
    const jsonProvider = new JsonRpcProvider(rpcUrl, chainId)
    const ok = await run(jsonProvider)
    return Boolean(ok)
  }
}

/**
 * Reads `ACL.isAllowed(balanceHandle, connectedWallet)` — must be true before user-decrypt of that handle (Zama steps 2–3 before step 4).
 */
export function useAclIsAllowedForBalanceHandle(handle: string | null | undefined) {
  const chainIdStr = useChainId()
  const chainId = Number(chainIdStr)
  const wallet = useWallet()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const refetch = useCallback(() => setNonce((n) => n + 1), [])

  const aclAddress = getAclProxyForChainId(chainId)

  useEffect(() => {
    if (!handle || !wallet?.address || !wallet?.provider || !aclAddress) {
      setAllowed(null)
      setReadError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setReadError(null)

    const run = async () => {
      try {
        const ok = await readIsAllowed(
          aclAddress as `0x${string}`,
          handle,
          wallet.address as `0x${string}`,
          wallet.provider as Eip1193Provider,
          chainId,
        )
        if (!cancelled) setAllowed(ok)
      } catch (e) {
        if (!cancelled) {
          setAllowed(null)
          setReadError(e instanceof Error ? e.message : 'ACL read failed')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [handle, chainId, wallet?.address, wallet?.provider, aclAddress, nonce])

  return {
    allowed,
    loading,
    readError,
    refetch,
    aclConfigured: Boolean(aclAddress),
  }
}
