import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Alert, Stack, Typography } from '@mui/material'
import { decodeFunctionData } from 'viem'
import { CONF_TOKEN_ABI, getTokenKeyForConfidentialAddress } from '@/services/confidential/contracts'
import useChainId from '@/hooks/useChainId'
import ConfidentialUserDecryptPanel from '@/components/tx-flow/flows/ConfidentialTokenTransfer/ConfidentialUserDecryptPanel'
import { parseConfidentialTransferHandleFromCalldata } from '@/services/confidential/encode'

const ConfidentialTransfer = ({ txData }: { txData: TransactionData }) => {
  const chainIdStr = useChainId()
  const chainId = Number(chainIdStr)
  const hex = txData.hexData
  let recipient: string | undefined
  if (hex && hex.length >= 10) {
    try {
      const decoded = decodeFunctionData({
        abi: CONF_TOKEN_ABI,
        data: hex as `0x${string}`,
      })
      if (decoded.functionName === 'confidentialTransfer') {
        const args = decoded.args as readonly [`0x${string}`, `0x${string}`, `0x${string}`]
        recipient = args[0]
      }
    } catch {
      /* ignore */
    }
  }

  const contractAddress = txData.to?.value
  const handle = hex ? parseConfidentialTransferHandleFromCalldata(hex as `0x${string}`) : null
  const tokenKey = contractAddress ? getTokenKeyForConfidentialAddress(chainId, contractAddress) : null

  return (
    <Stack spacing={1} sx={{ py: 1 }}>
      <Typography variant="h5">Confidential transfer</Typography>
      <Alert severity="info">
        This Safe transaction calls <strong>confidentialTransfer</strong> on the confidential token contract (FHE / Zama
        flow). Amounts are encrypted; co-owners approve the same calldata in the queue.
      </Alert>
      {recipient && (
        <Typography variant="body2">
          <strong>Recipient:</strong> {recipient}
        </Typography>
      )}
      {handle && contractAddress && tokenKey ? (
        <ConfidentialUserDecryptPanel handle={handle} contractAddress={contractAddress} tokenKey={tokenKey} />
      ) : null}
    </Stack>
  )
}

export default ConfidentialTransfer
