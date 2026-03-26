import { useCallback, useEffect, useState } from 'react'
import { BrowserProvider, Contract, type Eip1193Provider } from 'ethers'
import useChainId from '@/hooks/useChainId'
import useWallet from '@/hooks/wallets/useWallet'
import { ACL_ABI, getAclProxyForChainId } from '@/services/confidential/contracts'

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
        const provider = new BrowserProvider(wallet.provider as Eip1193Provider)
        const c = new Contract(aclAddress, ACL_ABI, provider)
        const ok = await c.isAllowed(handle, wallet.address)
        if (!cancelled) setAllowed(Boolean(ok))
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
