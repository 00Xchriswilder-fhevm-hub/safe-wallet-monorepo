import type { ConfidentialTokenKey } from '@/services/confidential/contracts'

export type ConfidentialTokenTransferParams = {
  recipient: string
  amount: string
  tokenKey: ConfidentialTokenKey
  /** After relayer */
  encrypted?: {
    handle: `0x${string}`
    inputProof: `0x${string}`
  }
  /** EOA preflight tx hashes (optional, for display) */
  helperTxHash?: `0x${string}`
  aclTxHash?: `0x${string}`
}
