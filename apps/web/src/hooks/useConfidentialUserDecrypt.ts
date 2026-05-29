import { useCallback, useRef, useState } from 'react'
import type { Eip1193Provider } from 'ethers'
import useChainId from '@/hooks/useChainId'
import useWallet from '@/hooks/wallets/useWallet'
import { toDecryptErrorMessage, userDecryptHandleWithWallet } from '@/services/confidential/userDecryptFlow'

export function useConfidentialUserDecrypt() {
  const chainIdStr = useChainId()
  const chainId = Number(chainIdStr)
  const wallet = useWallet()
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeHandle = useRef<string | null>(null)

  const decrypt = useCallback(
    async (handle: string, contractAddress: string): Promise<bigint | null> => {
      if (!wallet?.address || !wallet.provider) {
        setError('Connect a wallet to verify the encrypted amount.')
        return null
      }
      if (!handle || !contractAddress) {
        setError('Missing handle or contract.')
        return null
      }
      if (activeHandle.current) return null
      activeHandle.current = handle
      setIsDecrypting(true)
      setError(null)
      try {
        const walletChainIdHint = wallet.chainId ? Number(wallet.chainId) : undefined
        return await userDecryptHandleWithWallet({
          chainId,
          userAddress: wallet.address,
          handle,
          contractAddress,
          provider: wallet.provider as Eip1193Provider,
          walletChainIdHint,
        })
      } catch (e) {
        setError(toDecryptErrorMessage(e))
        return null
      } finally {
        setIsDecrypting(false)
        activeHandle.current = null
      }
    },
    [chainId, wallet?.address, wallet?.provider],
  )

  return {
    decrypt,
    isDecrypting,
    error,
    clearError: () => setError(null),
    isReady: Boolean(wallet?.address && wallet?.provider),
  }
}
