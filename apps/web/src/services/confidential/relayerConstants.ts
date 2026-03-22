/** Relayer REST (Zama). */

export const MAINNET_RELAYER_BASE_URL =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MAINNET_RELAYER_URL
    ? process.env.NEXT_PUBLIC_MAINNET_RELAYER_URL
    : 'https://z-dashboard-production.up.railway.app'

export const SEPOLIA_RELAYER_BASE_URL =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SEPOLIA_RELAYER_URL
    ? process.env.NEXT_PUBLIC_SEPOLIA_RELAYER_URL
    : 'https://sepolia-relayer-sdk-production.up.railway.app'

export const RELAYER_ENDPOINTS = {
  encryptAmount: '/api/encrypt-amount',
  encryptAmountBatch: '/api/encrypt-amount-batch',
  publicDecrypt: '/api/public-decrypt',
  userDecryptPrepare: '/api/user-decrypt/prepare',
  userDecryptComplete: '/api/user-decrypt/complete',
} as const

export const SEPOLIA_CHAIN_ID = 11155111
export const MAINNET_CHAIN_ID = 1

export function getRelayerBaseUrlForChainId(chainId: number): string {
  return chainId === SEPOLIA_CHAIN_ID ? SEPOLIA_RELAYER_BASE_URL : MAINNET_RELAYER_BASE_URL
}
