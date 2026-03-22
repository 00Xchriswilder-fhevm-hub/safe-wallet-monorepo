import { useMemo, useState } from 'react'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { formatUnits, parseUnits } from 'viem'
import { useConfidentialUserDecrypt } from '@/hooks/useConfidentialUserDecrypt'
import { TOKEN_LABELS } from '@/services/confidential/contracts'
import type { ConfidentialTokenKey } from '@/services/confidential/contracts'

type Props = {
  /** Encrypted amount handle (bytes32 hex). */
  handle: string
  /** Confidential token contract. */
  contractAddress: string
  tokenKey: ConfidentialTokenKey
  /** Human amount entered at proposal time — compare to decrypt result when present. */
  statedAmount?: string
}

/** Relayer user-decrypt: EIP-712 from relayer → wallet signs → cleartext returned. */
const ConfidentialUserDecryptPanel = ({ handle, contractAddress, tokenKey, statedAmount }: Props) => {
  const { decrypt, isDecrypting, error, clearError, isReady } = useConfidentialUserDecrypt()
  const [decrypted, setDecrypted] = useState<bigint | null>(null)
  const { decimals, symbol } = TOKEN_LABELS[tokenKey]

  const formattedDecrypt = useMemo(() => {
    if (decrypted == null) return null
    return formatUnits(decrypted, decimals)
  }, [decrypted, decimals])

  const statedMatches = useMemo(() => {
    if (!statedAmount?.trim() || decrypted == null) return null
    try {
      const stated = parseUnits(statedAmount.trim(), decimals)
      return stated === decrypted
    } catch {
      return false
    }
  }, [statedAmount, decrypted, decimals])

  return (
    <Stack spacing={1} sx={{ py: 1 }}>
      <Typography variant="subtitle2">Verify amount</Typography>
      <Typography variant="body2" color="text.secondary">
        The relayer returns EIP-712 data; your wallet signs it; the relayer returns the cleartext amount. Compare with
        the stated amount before you sign the Safe transaction.
      </Typography>
      {statedAmount?.trim() ? (
        <Typography variant="body2">
          <strong>Stated amount:</strong> {statedAmount.trim()} {symbol}
        </Typography>
      ) : null}
      <Button
        variant="outlined"
        size="small"
        disabled={!isReady || isDecrypting || !handle}
        onClick={async () => {
          clearError()
          setDecrypted(null)
          const v = await decrypt(handle, contractAddress)
          if (v != null) setDecrypted(v)
        }}
      >
        {isDecrypting ? 'Sign in wallet…' : 'Decrypt with wallet'}
      </Button>
      {error && (
        <Alert severity="error" onClose={() => clearError()}>
          {error}
        </Alert>
      )}
      {formattedDecrypt != null && (
        <>
          <Typography variant="body2">
            <strong>Decrypted amount:</strong> {formattedDecrypt} {symbol} (raw: {decrypted?.toString()})
          </Typography>
          {statedAmount?.trim() && statedMatches !== null && (
            <Alert severity={statedMatches ? 'success' : 'warning'}>
              {statedMatches
                ? 'Decrypted value matches the stated amount.'
                : 'Decrypted value does not match the stated amount — confirm with the proposer before signing.'}
            </Alert>
          )}
        </>
      )}
    </Stack>
  )
}

export default ConfidentialUserDecryptPanel
