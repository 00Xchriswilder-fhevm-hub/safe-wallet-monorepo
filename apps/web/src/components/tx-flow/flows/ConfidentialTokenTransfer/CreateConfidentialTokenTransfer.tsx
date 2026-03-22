import { type ReactElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import CheckIcon from '@mui/icons-material/Check'
import { BrowserProvider, type Eip1193Provider, type Signer } from 'ethers'
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { isAddress } from 'viem'
import TxCard from '@/components/tx-flow/common/TxCard'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { relayerEncryptAmountForChain } from '@/services/confidential/relayer'
import {
  getConfidentialTokenAddress,
  getFhevmMultisigHelperForChainId,
  TOKEN_LABELS,
  type ConfidentialTokenKey,
} from '@/services/confidential/contracts'
import { sendAclAllowTx, sendAllowForSafeMultiSigTx } from '@/services/confidential/preflight'
import { SEPOLIA_CHAIN_ID } from '@/services/confidential/relayerConstants'
import type { ConfidentialTokenTransferParams } from './types'

const defaultParams: ConfidentialTokenTransferParams = {
  recipient: '',
  amount: '',
  tokenKey: 'usdc',
}

const CreateConfidentialTokenTransfer = (): ReactElement => {
  const chainIdStr = useChainId()
  const chainId = Number(chainIdStr)
  const { safeAddress } = useSafeInfo()
  const wallet = useWallet()
  const [ethersSigner, setEthersSigner] = useState<Signer | null>(null)

  useEffect(() => {
    if (!wallet?.provider) {
      setEthersSigner(null)
      return
    }
    const bp = new BrowserProvider(wallet.provider as Eip1193Provider)
    void bp
      .getSigner()
      .then(setEthersSigner)
      .catch(() => setEthersSigner(null))
  }, [wallet?.provider])
  const { onNext, data } = useContext(TxFlowContext) as TxFlowContextType<ConfidentialTokenTransferParams>

  const [recipient, setRecipient] = useState(data?.recipient ?? defaultParams.recipient)
  const [amount, setAmount] = useState(data?.amount ?? defaultParams.amount)
  const [tokenKey, setTokenKey] = useState<ConfidentialTokenKey>(data?.tokenKey ?? 'usdc')
  const [encrypted, setEncrypted] = useState(data?.encrypted)
  const [helperTxHash, setHelperTxHash] = useState(data?.helperTxHash)
  const [aclTxHash, setAclTxHash] = useState(data?.aclTxHash)
  const [encrypting, setEncrypting] = useState(false)
  const [helperBusy, setHelperBusy] = useState(false)
  const [aclBusy, setAclBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const helper = useMemo(() => getFhevmMultisigHelperForChainId(chainId), [chainId])
  const confToken = useMemo(() => getConfidentialTokenAddress(chainId, tokenKey), [chainId, tokenKey])

  const canUse =
    chainId === SEPOLIA_CHAIN_ID && helper && confToken && confToken !== '0x0000000000000000000000000000000000000000'

  const encryptDone = Boolean(encrypted?.handle)
  const helperDone = Boolean(helperTxHash)
  const aclDone = Boolean(aclTxHash)

  /** Which preflight step is currently in focus (only that step uses the primary contained style). */
  const activePreflightStep = useMemo((): 0 | 1 | 2 | 3 => {
    if (encrypting) return 1
    if (helperBusy) return 2
    if (aclBusy) return 3
    if (!encryptDone) return 1
    if (!helperDone) return 2
    if (!aclDone) return 3
    return 0
  }, [encrypting, helperBusy, aclBusy, encryptDone, helperDone, aclDone])

  const onEncrypt = useCallback(async () => {
    setFormError(null)
    if (!wallet?.address || !helper) {
      setFormError('Connect a wallet and ensure FHEVM helper is configured for this chain.')
      return
    }
    if (!amount.trim()) {
      setFormError('Enter an amount')
      return
    }
    setEncrypting(true)
    try {
      const res = await relayerEncryptAmountForChain(
        {
          contractAddress: helper,
          userAddress: wallet.address,
          amount: amount.trim(),
          decimals: TOKEN_LABELS[tokenKey].decimals,
        },
        chainId,
      )
      setEncrypted({
        handle: res.handle as `0x${string}`,
        inputProof: res.inputProof as `0x${string}`,
      })
      setHelperTxHash(undefined)
      setAclTxHash(undefined)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Encryption failed')
    } finally {
      setEncrypting(false)
    }
  }, [amount, chainId, helper, tokenKey, wallet?.address])

  const onHelper = useCallback(async () => {
    setFormError(null)
    if (!ethersSigner || !encrypted || !safeAddress) {
      setFormError('Connect wallet, encrypt first, and load a Safe.')
      return
    }
    setHelperBusy(true)
    try {
      const hash = await sendAllowForSafeMultiSigTx({
        signer: ethersSigner,
        chainId,
        safeAddress: safeAddress as `0x${string}`,
        handle: encrypted.handle,
        inputProof: encrypted.inputProof,
      })
      setHelperTxHash(hash)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Helper transaction failed')
    } finally {
      setHelperBusy(false)
    }
  }, [chainId, encrypted, ethersSigner, safeAddress])

  const onAcl = useCallback(async () => {
    setFormError(null)
    if (!ethersSigner || !encrypted || !confToken) {
      setFormError('Missing signer, encryption, or confidential token address.')
      return
    }
    setAclBusy(true)
    try {
      const hash = await sendAclAllowTx({
        signer: ethersSigner,
        chainId,
        handle: encrypted.handle,
        confidentialToken: confToken,
      })
      setAclTxHash(hash)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'ACL transaction failed')
    } finally {
      setAclBusy(false)
    }
  }, [chainId, confToken, encrypted, ethersSigner])

  const onContinue = useCallback(() => {
    setFormError(null)
    if (!recipient.trim() || !isAddress(recipient.trim())) {
      setFormError('Enter a valid recipient address')
      return
    }
    if (!encrypted?.handle) {
      setFormError('Encrypt the amount first')
      return
    }
    onNext({
      recipient: recipient.trim(),
      amount: amount.trim(),
      tokenKey,
      encrypted,
      helperTxHash,
      aclTxHash,
    })
  }, [aclTxHash, amount, encrypted, helperTxHash, onNext, recipient, tokenKey])

  return (
    <TxCard>
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Confidential send uses the Sepolia relayer to encrypt amounts, then on-chain helper + ACL transactions from
          your wallet, and finally a Safe transaction to transfer encrypted balances. Configure confidential token
          addresses in <code>.env</code> (see <code>.env.example</code>).
        </Typography>

        {!canUse && (
          <Alert severity="warning">
            {chainId !== SEPOLIA_CHAIN_ID ? (
              <>Switch the app to Sepolia (URL + wallet) to use confidential send.</>
            ) : tokenKey === 'usdt' ? (
              <>
                Set non-zero <code>NEXT_PUBLIC_SEPOLIA_CONF_USDT_ADDRESS</code> (and underlying USDT) in{' '}
                <code>.env</code>, then restart <code>yarn workspace @safe-global/web dev</code>.
              </>
            ) : (
              <>
                cUSDC addresses could not be loaded. Add <code>NEXT_PUBLIC_SEPOLIA_CONF_USDC_ADDRESS</code> to{' '}
                <code>.env</code> and restart the dev server so Next.js inlines <code>NEXT_PUBLIC_*</code> vars.
              </>
            )}
          </Alert>
        )}

        {formError && (
          <Alert severity="error" onClose={() => setFormError(null)}>
            {formError}
          </Alert>
        )}

        <FormControl fullWidth>
          <InputLabel id="conf-token-label">Confidential token</InputLabel>
          <Select
            labelId="conf-token-label"
            label="Confidential token"
            value={tokenKey}
            onChange={(e) => setTokenKey(e.target.value as ConfidentialTokenKey)}
          >
            <MenuItem value="usdc">{TOKEN_LABELS.usdc.symbol}</MenuItem>
            <MenuItem value="usdt">{TOKEN_LABELS.usdt.symbol}</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Recipient address"
          fullWidth
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x…"
        />

        <TextField
          label="Amount"
          fullWidth
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          helperText={`Decimals: ${TOKEN_LABELS[tokenKey].decimals}`}
        />

        <Box>
          <Button
            variant={activePreflightStep === 1 ? 'contained' : 'outlined'}
            color={activePreflightStep === 1 ? 'primary' : 'inherit'}
            onClick={onEncrypt}
            disabled={!canUse || encrypting}
            fullWidth
            startIcon={encryptDone && activePreflightStep !== 1 ? <CheckIcon fontSize="small" /> : undefined}
            sx={
              activePreflightStep === 1
                ? undefined
                : {
                    borderColor: 'divider',
                    color: 'text.secondary',
                  }
            }
          >
            {encrypting ? 'Encrypting…' : '1. Encrypt amount (relayer)'}
          </Button>
          {encrypted?.handle && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
              Handle: {encrypted.handle.slice(0, 18)}…
            </Typography>
          )}
        </Box>

        <Button
          variant={activePreflightStep === 2 ? 'contained' : 'outlined'}
          color={activePreflightStep === 2 ? 'primary' : 'inherit'}
          onClick={onHelper}
          disabled={!encrypted || helperBusy}
          fullWidth
          startIcon={helperDone && activePreflightStep !== 2 ? <CheckIcon fontSize="small" /> : undefined}
          sx={
            activePreflightStep === 2
              ? undefined
              : {
                  borderColor: 'divider',
                  color: 'text.secondary',
                }
          }
        >
          {helperBusy ? 'Confirm in wallet…' : '2. Submit helper tx (wallet)'}
        </Button>
        {helperTxHash && (
          <Typography variant="caption" color="text.secondary">
            Helper tx: {helperTxHash}
          </Typography>
        )}

        <Button
          variant={activePreflightStep === 3 ? 'contained' : 'outlined'}
          color={activePreflightStep === 3 ? 'primary' : 'inherit'}
          onClick={onAcl}
          disabled={!encrypted || aclBusy}
          fullWidth
          startIcon={aclDone && activePreflightStep !== 3 ? <CheckIcon fontSize="small" /> : undefined}
          sx={
            activePreflightStep === 3
              ? undefined
              : {
                  borderColor: 'divider',
                  color: 'text.secondary',
                }
          }
        >
          {aclBusy ? 'Confirm in wallet…' : '3. Submit ACL tx (wallet)'}
        </Button>
        {aclTxHash && (
          <Typography variant="caption" color="text.secondary">
            ACL tx: {aclTxHash}
          </Typography>
        )}

        <Alert severity="info">
          After helper and ACL transactions are mined, continue to propose the Safe confidential transfer. Co-owners can
          sign and execute from the transaction queue as usual.
        </Alert>

        <Button variant="contained" onClick={onContinue} disabled={!canUse || !encrypted} size="large" fullWidth>
          Continue to review
        </Button>
      </Stack>
    </TxCard>
  )
}

export default CreateConfidentialTokenTransfer
