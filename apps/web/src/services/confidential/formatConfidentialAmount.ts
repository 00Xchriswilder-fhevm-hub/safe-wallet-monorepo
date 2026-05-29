import { formatUnits } from 'viem'
import { CONFIDENTIAL_DECIMALS } from './contracts'

/** Human-readable confidential amount (ERC-7984 uses {@link CONFIDENTIAL_DECIMALS} on the FHE side). */
export function formatConfidentialAmount(value: bigint): string {
  const s = formatUnits(value, CONFIDENTIAL_DECIMALS)
  if (!s.includes('.')) return s
  const trimmed = s.replace(/\.?0+$/, '')
  return trimmed === '' ? '0' : trimmed
}
