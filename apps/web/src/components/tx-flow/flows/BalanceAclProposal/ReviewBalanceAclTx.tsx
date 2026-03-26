import { type PropsWithChildren, type ReactElement, useContext } from 'react'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import ReviewBalanceAclProposal from './ReviewBalanceAclProposal'
import type { BalanceAclParams } from './types'

const ReviewBalanceAclTx = ({
  onSubmit,
  txNonce,
  children,
}: PropsWithChildren<{
  onSubmit: () => void
  txNonce?: number
}>): ReactElement => {
  const { data } = useContext(TxFlowContext) as TxFlowContextType<BalanceAclParams>

  return (
    <ReviewBalanceAclProposal params={data} onSubmit={onSubmit} txNonce={txNonce}>
      {children}
    </ReviewBalanceAclProposal>
  )
}

export default ReviewBalanceAclTx
