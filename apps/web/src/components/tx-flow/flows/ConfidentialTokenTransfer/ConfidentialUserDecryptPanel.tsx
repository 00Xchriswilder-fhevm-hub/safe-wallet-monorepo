import { useMemo, useState } from 'react'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
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
  /** `balance`: Safe balance decrypt copy; `transfer` (default): verify transfer amount. */
  variant?: 'transfer' | 'balance'
  /** For `balance` variant: `true` once the executed Safe ACL flow allows this wallet to decrypt. Omitted = locked. */
  balanceAclAllowsDecrypt?: boolean
  /** While checking `isAllowed` on-chain. */
  balanceAclLoading?: boolean
  /**
   * When `true` with `variant="balance"`: toolbar style — only the decrypt button sits in the parent flex row;
   * alerts / decrypted output use full width on the following line(s). Parent should be `display: flex; flexWrap: wrap`.
   */
  inline?: boolean
}

/** Relayer user-decrypt: EIP-712 from relayer → wallet signs → cleartext returned. */
const ConfidentialUserDecryptPanel = ({
  handle,
  contractAddress,
  tokenKey,
  statedAmount,
  variant = 'transfer',
  balanceAclAllowsDecrypt,
  balanceAclLoading = false,
  inline = false,
}: Props) => {
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

  const isBalance = variant === 'balance'
  const canDecryptBalance = !isBalance || balanceAclAllowsDecrypt === true
  const balanceDecryptLocked = isBalance && (balanceAclLoading || !canDecryptBalance)

  const decryptButton = (
    <Button
      variant="outlined"
      size="small"
      disabled={!isReady || isDecrypting || !handle || balanceDecryptLocked}
      title={isBalance ? 'Decrypt balance' : 'Verify amount'}
      sx={inline && isBalance ? { flexShrink: 0 } : undefined}
      onClick={async () => {
        clearError()
        setDecrypted(null)
        const v = await decrypt(handle, contractAddress)
        if (v != null) setDecrypted(v)
      }}
    >
      {isDecrypting ? 'Sign in wallet…' : isBalance ? 'Decrypt balance' : 'Decrypt with wallet'}
    </Button>
  )

  const fullWidthRowSx =
    inline && isBalance ? { flexBasis: '100%', width: '100%', minWidth: '100%' as const } : undefined

  if (inline && isBalance) {
    return (
      <Box sx={{ display: 'contents' }}>
        {decryptButton}
        {error && (
          <Alert severity="error" sx={fullWidthRowSx} onClose={() => clearError()}>
            {error}
          </Alert>
        )}
        {formattedDecrypt != null && (
          <>
            <Typography variant="body2" sx={fullWidthRowSx}>
              <strong>Decrypted balance:</strong> {formattedDecrypt} {symbol}
            </Typography>
          </>
        )}
      </Box>
    )
  }

  return (
    <Stack spacing={1} sx={{ py: 1, alignItems: 'flex-start', maxWidth: '100%' }}>
      <Typography variant="subtitle2">{isBalance ? 'Decrypt balance' : 'Verify amount'}</Typography>
      {!isBalance && (
        <Typography variant="body2" color="text.secondary">
          The relayer returns EIP-712 data; your wallet signs it; the relayer returns the cleartext amount. Compare with
          the stated amount before you sign the Safe transaction.
        </Typography>
      )}
      {statedAmount?.trim() ? (
        <Typography variant="body2">
          <strong>Stated amount:</strong> {statedAmount.trim()} {symbol}
        </Typography>
      ) : null}
      {decryptButton}
      {error && (
        <Alert severity="error" sx={{ alignSelf: 'stretch', width: '100%' }} onClose={() => clearError()}>
          {error}
        </Alert>
      )}
      {formattedDecrypt != null && (
        <>
          <Typography variant="body2">
            <strong>{isBalance ? 'Decrypted balance' : 'Decrypted amount'}:</strong> {formattedDecrypt} {symbol}
          </Typography>
          {statedAmount?.trim() && statedMatches !== null && (
            <Alert severity={statedMatches ? 'success' : 'warning'} sx={{ alignSelf: 'stretch', width: '100%' }}>
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
