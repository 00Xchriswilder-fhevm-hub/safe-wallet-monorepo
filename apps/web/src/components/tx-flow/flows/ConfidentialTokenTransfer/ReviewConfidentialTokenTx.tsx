import { type ReactElement, type PropsWithChildren, useContext } from 'react'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import ReviewConfidentialTokenTransfer from './ReviewConfidentialTokenTransfer'
import type { ConfidentialTokenTransferParams } from './types'

const ReviewConfidentialTokenTx = ({
  onSubmit,
  txNonce,
  children,
}: PropsWithChildren<{
  onSubmit: () => void
  txNonce?: number
}>): ReactElement => {
  const { data } = useContext(TxFlowContext) as TxFlowContextType<ConfidentialTokenTransferParams>

  return (
    <ReviewConfidentialTokenTransfer params={data} onSubmit={onSubmit} txNonce={txNonce}>
      {children}
    </ReviewConfidentialTokenTransfer>
  )
}

export default ReviewConfidentialTokenTx
