import { type ReactElement, useContext, useMemo } from 'react'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import useChainId from '@/hooks/useChainId'
import { useConfidentialBalanceHandle, isZeroBytes32Handle } from '@/hooks/useConfidentialBalanceHandle'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getAclProxyForChainId, TOKEN_LABELS, type ConfidentialTokenKey } from '@/services/confidential/contracts'
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID } from '@/services/confidential/relayerConstants'
import type { BalanceAclParams } from './types'

type CreateProps = {
  tokenKey?: ConfidentialTokenKey
}

const CreateBalanceAclProposal = ({ tokenKey = 'usdc' }: CreateProps): ReactElement => {
  const { onNext } = useContext(TxFlowContext) as TxFlowContextType<BalanceAclParams>
  const chainId = Number(useChainId())
  const { safe, safeLoaded } = useSafeInfo()
  const labels = TOKEN_LABELS[tokenKey]
  const { handle, loading, error, refetch, canFetch, supported } = useConfidentialBalanceHandle(tokenKey)
  const aclProxy = getAclProxyForChainId(chainId)

  const ownerCount = safe.owners?.length ?? 0
  const supportedChain = chainId === SEPOLIA_CHAIN_ID || chainId === MAINNET_CHAIN_ID

  const canContinue = Boolean(
    safeLoaded && supportedChain && supported && aclProxy && handle && !isZeroBytes32Handle(handle) && ownerCount > 0,
  )

  const hint = useMemo(() => {
    if (chainId === MAINNET_CHAIN_ID && !aclProxy) {
      return 'Set NEXT_PUBLIC_MAINNET_ACL_PROXY in .env.'
    }
    return null
  }, [chainId, aclProxy])

  return (
    <Stack spacing={2}>
      {!supportedChain && (
        <Alert severity="warning">Confidential balance ACL is only available on Sepolia or Ethereum mainnet.</Alert>
      )}

      {hint && <Alert severity="warning">{hint}</Alert>}

      {!canFetch && (
        <Alert severity="info">Connect a wallet on this network to load the balance handle for {labels.symbol}.</Alert>
      )}

      {loading && (
        <Typography variant="body2" color="text.secondary">
          Loading balance handle…
        </Typography>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {safeLoaded && ownerCount === 0 && (
        <Alert severity="error">This Safe has no owners; cannot build ACL.allow calls.</Alert>
      )}

      {handle && !isZeroBytes32Handle(handle) && (
        <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
          Handle: <code>{handle}</code>
        </Typography>
      )}

      {handle && isZeroBytes32Handle(handle) && (
        <Alert severity="info">No balance ciphertext (zero handle). Nothing to grant ACL for.</Alert>
      )}

      <Stack direction="row" gap={1} flexWrap="wrap">
        <Button variant="outlined" onClick={() => refetch()} disabled={!canFetch || loading}>
          Refresh handle
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => onNext({ balanceHandle: handle as `0x${string}` })}
          disabled={!canContinue}
        >
          Continue to review
        </Button>
      </Stack>
    </Stack>
  )
}

export default CreateBalanceAclProposal
