import { type ReactElement } from 'react'
import { Alert, Link, Paper, Typography } from '@mui/material'
import useChainId from '@/hooks/useChainId'
import { TOKEN_LABELS } from '@/services/confidential/contracts'
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID } from '@/services/confidential/relayerConstants'
import ConfidentialSafeBalancePanel from '@/components/tx-flow/flows/ConfidentialTokenTransfer/ConfidentialSafeBalancePanel'

/**
 * Assets page block: Safe cUSDC confidential balance handle + decrypt (FHE / Zama).
 * Shown under “Total assets value”; on other networks, explains how to switch.
 */
const ConfidentialBalancesSection = (): ReactElement => {
  const chainId = Number(useChainId())
  const supported = chainId === SEPOLIA_CHAIN_ID || chainId === MAINNET_CHAIN_ID

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 0.5 }}>
        Confidential balances
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <Link href="https://portfolio.zama.org/shield" target="_blank" rel="noopener noreferrer" underline="hover">
          Shield USDC on Zama Portfolio
        </Link>
      </Typography>

      {!supported ? (
        <Alert severity="info">
          Switch the app to <strong>Ethereum mainnet</strong> or <strong>Sepolia</strong> (URL + wallet) to load and
          decrypt this Safe&apos;s confidential {TOKEN_LABELS.usdc.symbol} balance.
        </Alert>
      ) : (
        <ConfidentialSafeBalancePanel />
      )}
    </Paper>
  )
}

export default ConfidentialBalancesSection
