import CreateBalanceAclProposal from './CreateBalanceAclProposal'
import ReviewBalanceAclTx from './ReviewBalanceAclTx'
import AssetsIcon from '@/public/images/sidebar/assets.svg'
import { useMemo } from 'react'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import type { BalanceAclParams } from './types'

export type { BalanceAclParams } from './types'

type Props = {
  txNonce?: number
}

const BalanceAclProposalFlow = ({ txNonce }: Props) => {
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
        <CreateBalanceAclProposal />
      </TxFlowStep>
    </TxFlow>
  )
}

export default BalanceAclProposalFlow
