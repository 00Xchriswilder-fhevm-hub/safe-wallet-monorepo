import CreateConfidentialTokenTransfer from './CreateConfidentialTokenTransfer'
import ReviewConfidentialTokenTx from './ReviewConfidentialTokenTx'
import AssetsIcon from '@/public/images/sidebar/assets.svg'
import { useMemo } from 'react'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import type { ConfidentialTokenTransferParams } from './types'

export type { ConfidentialTokenTransferParams } from './types'

type Props = {
  txNonce?: number
}

const defaultParams: ConfidentialTokenTransferParams = {
  recipient: '',
  amount: '',
  tokenKey: 'usdc',
}

const ConfidentialTokenTransferFlow = ({ txNonce }: Props) => {
  const initialData = useMemo<ConfidentialTokenTransferParams>(() => ({ ...defaultParams }), [])

  return (
    <TxFlow
      initialData={initialData}
      icon={AssetsIcon}
      subtitle="Confidential send"
      eventCategory={TxFlowType.CONFIDENTIAL_TOKEN_TRANSFER}
      ReviewTransactionComponent={ReviewConfidentialTokenTx}
    >
      <TxFlowStep title="New transaction">
        <CreateConfidentialTokenTransfer />
      </TxFlowStep>
    </TxFlow>
  )
}

export default ConfidentialTokenTransferFlow
