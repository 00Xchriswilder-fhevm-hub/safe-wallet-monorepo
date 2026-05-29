import { type ReactElement, useCallback, useContext } from 'react'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Alert, Box, Button, CircularProgress, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import TokenIcon from '@/components/common/TokenIcon'
import { TxModalContext } from '@/components/tx-flow'
import BalanceAclProposalFlow from '@/components/tx-flow/flows/BalanceAclProposal'
import { useAclIsAllowedForBalanceHandle } from '@/hooks/useAclIsAllowedForBalanceHandle'
import { useConfidentialBalanceHandle, isZeroBytes32Handle } from '@/hooks/useConfidentialBalanceHandle'
import { TOKEN_LABELS, type ConfidentialTokenKey } from '@/services/confidential/contracts'
import { MAINNET_CHAIN_ID } from '@/services/confidential/relayerConstants'
import useChainId from '@/hooks/useChainId'
import ConfidentialUserDecryptPanel from './ConfidentialUserDecryptPanel'

type Props = {
  tokenKey?: ConfidentialTokenKey
}

/** Per-token row: token symbol + balance column (handle, ACL, decrypt). */
const ConfidentialSafeBalancePanel = ({ tokenKey = 'usdc' }: Props): ReactElement | null => {
  const { setTxFlow } = useContext(TxModalContext)
  const chainId = Number(useChainId())
  const labels = TOKEN_LABELS[tokenKey]
  const { handle, loading, error, confToken, refetch, canFetch, supported } = useConfidentialBalanceHandle(tokenKey)

  const openBalanceAclFlow = useCallback(() => {
    setTxFlow(<BalanceAclProposalFlow tokenKey={tokenKey} />)
  }, [setTxFlow, tokenKey])

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

  const onRefresh = () => {
    void refetch()
    refetchAcl()
  }

  const balanceColumn = (
    <Stack spacing={1} sx={{ width: '100%' }}>
      {!canFetch && (
        <Alert severity="info" sx={{ py: 0.5 }}>
          Connect a wallet on this network to load the balance for <strong>{labels.symbol}</strong>.
        </Alert>
      )}

      {canFetch && loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {chainId === MAINNET_CHAIN_ID && !aclConfigured && (
        <Alert severity="warning" sx={{ py: 0.5 }}>
          Set <code>NEXT_PUBLIC_MAINNET_ACL_PROXY</code> in <code>.env</code> so the app can read <code>isAllowed</code>{' '}
          for step 4.
        </Alert>
      )}

      {aclReadError && <Alert severity="error">{aclReadError}</Alert>}

      {canFetch && !loading && !error && handle && confToken && (
        <>
          {isZeroBytes32Handle(handle) ? (
            <Typography variant="body2" color="text.secondary">
              No {labels.symbol} balance.
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 1.5,
                rowGap: 1,
                width: '100%',
              }}
            >
              <Tooltip title={handle} placement="top" enterDelay={400}>
                <Typography
                  variant="body2"
                  component="code"
                  sx={{
                    flex: '1 1 auto',
                    minWidth: 0,
                    maxWidth: { xs: '100%', sm: 340, md: 460, lg: 560 },
                    fontSize: '0.75rem',
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {handle}
                </Typography>
              </Tooltip>
              <Button
                variant="contained"
                size="small"
                onClick={openBalanceAclFlow}
                disabled={allowed === true || aclLoading}
                sx={{ flexShrink: 0 }}
              >
                Propose ACL for balance
              </Button>
              <ConfidentialUserDecryptPanel
                handle={handle}
                contractAddress={confToken}
                tokenKey={tokenKey}
                variant="balance"
                balanceAclAllowsDecrypt={allowed === true}
                balanceAclLoading={aclLoading}
                inline
              />
            </Box>
          )}
        </>
      )}
    </Stack>
  )

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'minmax(200px, 240px) minmax(0, 1fr)' },
        columnGap: { xs: 0, sm: 4, md: 5 },
        rowGap: { xs: 1.5, sm: 0 },
        alignItems: 'start',
        width: '100%',
        py: 1.5,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexShrink: 0,
          minWidth: 0,
        }}
      >
        <TokenIcon logoUri={labels.underlyingLogoUri} tokenSymbol={labels.underlyingSymbol} size={24} />
        <Typography variant="body2" fontWeight={600} component="span">
          {labels.symbol}
        </Typography>
        <Tooltip title="Refresh balance and ACL status">
          <span>
            <IconButton
              size="small"
              aria-label={`Refresh ${labels.symbol} balance`}
              onClick={onRefresh}
              disabled={!canFetch || loading}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box sx={{ minWidth: 0, width: '100%' }}>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={700}
          sx={{ display: { xs: 'block', sm: 'none' }, mb: 0.5 }}
        >
          Balance
        </Typography>
        {balanceColumn}
      </Box>
    </Box>
  )
}

export default ConfidentialSafeBalancePanel
