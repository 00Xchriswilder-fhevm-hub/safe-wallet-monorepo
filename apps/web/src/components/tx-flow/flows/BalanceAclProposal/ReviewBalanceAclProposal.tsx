import { type PropsWithChildren, useContext, useEffect, useMemo } from 'react'
import { Stack, Typography } from '@mui/material'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { MetaTransactionData } from '@safe-global/types-kit'
import { getAddress, isAddress } from 'viem'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getAclProxyForChainId } from '@/services/confidential/contracts'
import { encodeAclAllowBalanceOwnerCalldata } from '@/services/confidential/encode'
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID } from '@/services/confidential/relayerConstants'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import type { NamedAddress } from '@/components/new-safe/create/types'

import type { BalanceAclParams } from './types'

function ownerChecksumList(owners: AddressInfo[] | NamedAddress[]): `0x${string}`[] {
  const out: `0x${string}`[] = []
  for (const o of owners) {
    const raw = 'value' in o && o.value !== undefined ? o.value : 'address' in o ? o.address : undefined
    if (!raw) continue
    try {
      out.push(getAddress(raw) as `0x${string}`)
    } catch {
      // skip invalid
    }
  }
  return out
}

const ReviewBalanceAclProposal = ({
  params,
  onSubmit,
  txNonce,
  children,
}: PropsWithChildren<{
  params?: BalanceAclParams
  onSubmit: () => void
  txNonce?: number
}>) => {
  const { setSafeTx, setSafeTxError, setNonce } = useContext(SafeTxContext)
  const chainId = Number(useChainId())
  const { safe, safeLoaded } = useSafeInfo()

  const aclProxy = useMemo(() => getAclProxyForChainId(chainId), [chainId])

  const owners = useMemo(() => ownerChecksumList(safe.owners ?? []), [safe.owners])

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }
  }, [txNonce, setNonce])

  useEffect(() => {
    if (!params?.balanceHandle) {
      return
    }
    if (!safeLoaded) {
      return
    }
    if (!aclProxy || !isAddress(aclProxy) || aclProxy === '0x0000000000000000000000000000000000000000') {
      const hint =
        chainId === MAINNET_CHAIN_ID
          ? 'Set NEXT_PUBLIC_MAINNET_ACL_PROXY in .env'
          : chainId === SEPOLIA_CHAIN_ID
            ? 'Set NEXT_PUBLIC_SEPOLIA_ACL_PROXY in .env'
            : 'Configure ACL proxy for this network'
      setSafeTxError(new Error(`ACL proxy is not configured. ${hint}`))
      return
    }
    if (owners.length === 0) {
      setSafeTxError(new Error('This Safe has no owners to grant ACL.'))
      return
    }

    let handle: `0x${string}`
    try {
      handle = params.balanceHandle.trim() as `0x${string}`
      if (handle.length !== 66) {
        throw new Error('Invalid balance handle length')
      }
    } catch (e) {
      setSafeTxError(e instanceof Error ? e : new Error('Invalid balance handle'))
      return
    }

    const txs: MetaTransactionData[] = owners.map((owner) => ({
      to: aclProxy,
      value: '0',
      data: encodeAclAllowBalanceOwnerCalldata(handle, owner),
    }))

    setSafeTxError(undefined)
    const promise = txs.length === 1 ? createTx(txs[0]) : createMultiSendCallOnlyTx(txs)
    promise.then(setSafeTx).catch(setSafeTxError)
  }, [chainId, aclProxy, owners, params?.balanceHandle, safeLoaded, setSafeTx, setSafeTxError])

  return (
    <ReviewTransaction onSubmit={onSubmit}>
      <Stack gap={1} sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Proposes <strong>ACL.allow(balanceHandle, owner)</strong> on the ACL contract for each Safe owner so owners
          can user-decrypt the multisig balance (Zama flow: steps 2–3).
        </Typography>
        {params?.balanceHandle && (
          <Typography variant="caption" color="text.secondary" component="div" sx={{ wordBreak: 'break-all' }}>
            Balance handle: <code>{params.balanceHandle}</code>
          </Typography>
        )}
        {owners.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            Calls: {owners.length} ({owners.length === 1 ? 'single transaction' : 'batched via MultiSend'})
          </Typography>
        )}
      </Stack>
      {children}
    </ReviewTransaction>
  )
}

export default ReviewBalanceAclProposal
