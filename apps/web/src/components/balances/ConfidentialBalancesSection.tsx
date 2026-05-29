import { type ReactElement } from 'react'
import { Alert, Box, Divider, Link, Paper, Stack, Typography } from '@mui/material'
import TokenIcon from '@/components/common/TokenIcon'
import useChainId from '@/hooks/useChainId'
import { listConfiguredConfidentialTokenKeys, TOKEN_LABELS } from '@/services/confidential/contracts'
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID } from '@/services/confidential/relayerConstants'
import ConfidentialSafeBalancePanel from '@/components/tx-flow/flows/ConfidentialTokenTransfer/ConfidentialSafeBalancePanel'

/**
 * Assets page: per-token confidential balance handles + decrypt (FHE / Zama).
 * Mainnet and Sepolia list the same ERC-7984 asset keys (Sepolia uses official mock wrapper addresses).
 */
const ConfidentialBalancesSection = (): ReactElement => {
  const chainId = Number(useChainId())
  const supported = chainId === SEPOLIA_CHAIN_ID || chainId === MAINNET_CHAIN_ID
  const configuredKeys = supported ? listConfiguredConfidentialTokenKeys(chainId) : []

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, maxWidth: 1280, width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ minWidth: 0 }}>
          {configuredKeys.length > 0 ? (
            <Stack direction="row" spacing={0.5} alignItems="center" useFlexGap flexWrap="wrap" sx={{ pt: 0.25 }}>
              {configuredKeys.map((k) => {
                const m = TOKEN_LABELS[k]
                return <TokenIcon key={k} logoUri={m.underlyingLogoUri} tokenSymbol={m.underlyingSymbol} size={28} />
              })}
            </Stack>
          ) : null}
          <Typography variant="h6" component="h2" fontWeight={700}>
            Confidential balances
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ flexShrink: 0, textAlign: { xs: 'left', sm: 'right' } }}>
          <Link href="https://portfolio.zama.org/shield" target="_blank" rel="noopener noreferrer" underline="hover">
            Shield assets on Zama Portfolio
          </Link>
        </Typography>
      </Box>

      {!supported ? (
        <Alert severity="info">
          Switch the app to <strong>Ethereum mainnet</strong> or <strong>Sepolia</strong> (URL + wallet) to load and
          decrypt this Safe&apos;s confidential balances.
        </Alert>
      ) : (
        <Stack divider={<Divider flexItem role="presentation" />} spacing={0}>
          <Box
            sx={{
              display: { xs: 'none', sm: 'grid' },
              gridTemplateColumns: 'minmax(200px, 240px) minmax(0, 1fr)',
              columnGap: { sm: 4, md: 5 },
              alignItems: 'baseline',
              py: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Token
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Balance
            </Typography>
          </Box>
          {configuredKeys.map((key) => (
            <ConfidentialSafeBalancePanel key={key} tokenKey={key} />
          ))}
        </Stack>
      )}
    </Paper>
  )
}

export default ConfidentialBalancesSection
