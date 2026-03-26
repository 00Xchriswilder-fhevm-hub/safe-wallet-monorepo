import { type ReactElement, useCallback, useContext } from 'react'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Alert, Box, Button, CircularProgress, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { TxModalContext } from '@/components/tx-flow'
import BalanceAclProposalFlow from '@/components/tx-flow/flows/BalanceAclProposal'
import { useAclIsAllowedForBalanceHandle } from '@/hooks/useAclIsAllowedForBalanceHandle'
import { useConfidentialBalanceHandle, isZeroBytes32Handle } from '@/hooks/useConfidentialBalanceHandle'
import { TOKEN_LABELS } from '@/services/confidential/contracts'
import { MAINNET_CHAIN_ID } from '@/services/confidential/relayerConstants'
import useChainId from '@/hooks/useChainId'
import ConfidentialUserDecryptPanel from './ConfidentialUserDecryptPanel'

export type ConfidentialSafeBalancePanelContext = 'assets' | 'send'

type Props = {
  context?: ConfidentialSafeBalancePanelContext
}

/** Safe cUSDC balance ciphertext + step 4 decrypt only when `ACL.isAllowed` is true (Zama order). */
const ConfidentialSafeBalancePanel = ({ context = 'assets' }: Props): ReactElement | null => {
  const { setTxFlow } = useContext(TxModalContext)
  const chainId = Number(useChainId())
  const { handle, loading, error, confToken, refetch, canFetch, supported } = useConfidentialBalanceHandle('usdc')

  const openBalanceAclFlow = useCallback(() => {
    setTxFlow(<BalanceAclProposalFlow />)
  }, [setTxFlow])

  const balanceHandleForAcl = handle && !isZeroBytes32Handle(handle) ? handle : null
  const {
    allowed,
    loading: aclLoading,
    readError: aclReadError,
    refetch: refetchAcl,
    aclConfigured,
  } = useAclIsAllowedForBalanceHandle(balanceHandleForAcl)

  if (!supported) {
    return null
  }

  const isSend = context === 'send'

  const onRefresh = () => {
    void refetch()
    refetchAcl()
  }

  return (
    <Stack spacing={1} sx={{ py: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="subtitle2">Multisig cUSDC balance (ciphertext)</Typography>
        <Tooltip title="Refresh balance handle and ACL status">
          <span>
            <IconButton
              size="small"
              aria-label="Refresh confidential balance"
              onClick={onRefresh}
              disabled={!canFetch || loading}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {!canFetch && (
        <Alert severity="info">
          Connect a wallet on this network to load the balance ciphertext for{' '}
          <strong>{TOKEN_LABELS.usdc.symbol}</strong>.
        </Alert>
      )}

      {canFetch && loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Loading balance ciphertext…
          </Typography>
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {chainId === MAINNET_CHAIN_ID && !aclConfigured && (
        <Alert severity="warning">
          Set <code>NEXT_PUBLIC_MAINNET_ACL_PROXY</code> in <code>.env</code> so the app can read <code>isAllowed</code>{' '}
          for step 4.
        </Alert>
      )}

      {aclReadError && <Alert severity="error">{aclReadError}</Alert>}

      {canFetch && !loading && !error && handle && confToken && (
        <>
          {isZeroBytes32Handle(handle) ? (
            <Typography variant="body2" color="text.secondary">
              No {TOKEN_LABELS.usdc.symbol} balance ciphertext (zero handle).
            </Typography>
          ) : (
            <>
              <Typography
                variant="body2"
                component="code"
                sx={{ display: 'block', wordBreak: 'break-all', fontSize: '0.75rem', lineHeight: 1.5 }}
              >
                {handle}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={openBalanceAclFlow}
                disabled={allowed === true || aclLoading}
                sx={{ alignSelf: 'flex-start' }}
              >
                Propose ACL for balance
              </Button>
              <ConfidentialUserDecryptPanel
                handle={handle}
                contractAddress={confToken}
                tokenKey="usdc"
                variant="balance"
                balanceAclAllowsDecrypt={allowed === true}
                balanceAclLoading={aclLoading}
              />
            </>
          )}
        </>
      )}
    </Stack>
  )
}

export default ConfidentialSafeBalancePanel
