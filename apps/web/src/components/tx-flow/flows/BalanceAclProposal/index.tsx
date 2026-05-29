import CreateBalanceAclProposal from './CreateBalanceAclProposal'
import ReviewBalanceAclTx from './ReviewBalanceAclTx'
import AssetsIcon from '@/public/images/sidebar/assets.svg'
import { useMemo } from 'react'
import { TxFlowType } from '@/services/analytics'
import type { ConfidentialTokenKey } from '@/services/confidential/contracts'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import type { BalanceAclParams } from './types'

export type { BalanceAclParams } from './types'

type Props = {
  txNonce?: number
  /** Which confidential wrapper’s balance handle to use (must match the row that opened this flow). */
  tokenKey?: ConfidentialTokenKey
}

const BalanceAclProposalFlow = ({ txNonce, tokenKey = 'usdc' }: Props) => {
  const initialData = useMemo<BalanceAclParams>(() => ({}), [])

  return (
    <TxFlow
      initialData={initialData}
      txNonce={txNonce}
      icon={AssetsIcon}
      subtitle="ACL for balance (multisig)"
      eventCategory={TxFlowType.CONFIDENTIAL_BALANCE_ACL}
      ReviewTransactionComponent={ReviewBalanceAclTx}
    >
      <TxFlowStep title="Propose ACL for balance">
        <CreateBalanceAclProposal tokenKey={tokenKey} />
      </TxFlowStep>
    </TxFlow>
  )
}

export default BalanceAclProposalFlow
