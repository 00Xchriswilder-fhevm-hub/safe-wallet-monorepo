import { type PropsWithChildren, useContext, useEffect, useMemo } from 'react'
import { Stack, Typography } from '@mui/material'
import { getAddress, isAddress } from 'viem'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { createTx } from '@/services/tx/tx-sender'
import { encodeConfidentialTransferMultisigCalldata } from '@/services/confidential/encode'
import { getConfidentialTokenAddress } from '@/services/confidential/contracts'
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID } from '@/services/confidential/relayerConstants'
import useChainId from '@/hooks/useChainId'
import type { ConfidentialTokenTransferParams } from './types'
import ConfidentialUserDecryptPanel from './ConfidentialUserDecryptPanel'

const ReviewConfidentialTokenTransfer = ({
  params,
  onSubmit,
  txNonce,
  children,
}: PropsWithChildren<{
  params?: ConfidentialTokenTransferParams
  onSubmit: () => void
  txNonce?: number
}>) => {
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)
  const chainIdStr = useChainId()
  const chainId = Number(chainIdStr)

  const confToken = useMemo(() => {
    if (!params?.tokenKey) return null
    return getConfidentialTokenAddress(chainId, params.tokenKey)
  }, [chainId, params?.tokenKey])

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }
  }, [txNonce, setNonce])

  useEffect(() => {
    if (!params?.encrypted?.handle) {
      return
    }
    if (!params.recipient || !confToken) {
      setSafeTxError(new Error('Missing recipient or token'))
      return
    }
    let recipient: `0x${string}`
    try {
      recipient = getAddress(params.recipient.trim()) as `0x${string}`
    } catch {
      setSafeTxError(new Error('Invalid recipient address'))
      return
    }

    if (!isAddress(confToken) || confToken === '0x0000000000000000000000000000000000000000') {
      const hint =
        chainId === MAINNET_CHAIN_ID
          ? 'Set NEXT_PUBLIC_MAINNET_CONF_USDC_ADDRESS / CONF_USDT in .env'
          : chainId === SEPOLIA_CHAIN_ID
            ? 'Set NEXT_PUBLIC_SEPOLIA_CONF_USDC_ADDRESS / CONF_USDT in .env'
            : 'Set NEXT_PUBLIC_SEPOLIA_* or NEXT_PUBLIC_MAINNET_* confidential token addresses in .env'
      setSafeTxError(new Error(`Confidential token address is not configured. ${hint}`))
      return
    }

    const data = encodeConfidentialTransferMultisigCalldata(recipient, params.encrypted.handle)

    setSafeTxError(undefined)
    createTx({
      to: confToken,
      value: '0',
      data,
    })
      .then(setSafeTx)
      .catch(setSafeTxError)
  }, [chainId, params?.encrypted?.handle, params?.recipient, confToken, setSafeTx, setSafeTxError])

  return (
    <ReviewTransaction onSubmit={onSubmit}>
      <Stack gap={1} sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Confidential transfer (FHE). The Safe will call the confidential token contract with your encrypted handle.
          Ensure helper and ACL steps completed in the previous screen.
        </Typography>
        {params?.recipient && (
          <Typography variant="body2">
            <strong>To:</strong> {params.recipient}
          </Typography>
        )}
        {params?.encrypted?.handle && confToken && params.tokenKey && (
          <ConfidentialUserDecryptPanel
            handle={params.encrypted.handle}
            contractAddress={confToken}
            tokenKey={params.tokenKey}
            statedAmount={params.amount}
          />
        )}
      </Stack>
      {children}
    </ReviewTransaction>
  )
}

export default ReviewConfidentialTokenTransfer
