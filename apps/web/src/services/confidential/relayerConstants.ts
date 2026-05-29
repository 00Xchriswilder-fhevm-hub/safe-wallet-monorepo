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

/**
 * Fallback JSON-RPC for **read-only** `eth_call` (e.g. `confidentialBalanceOf`). Wallet-injected RPCs
 * sometimes return empty `0x` / BAD_DATA on mainnet; Sepolia is less affected.
 */
export function getConfidentialBalanceReadRpcUrl(chainId: number): string | null {
  if (chainId === MAINNET_CHAIN_ID) {
    const fromEnv = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_MAINNET_PUBLIC_RPC_URL?.trim() : ''
    return fromEnv || 'https://ethereum.publicnode.com'
  }
  if (chainId === SEPOLIA_CHAIN_ID) {
    const fromEnv = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SEPOLIA_PUBLIC_RPC_URL?.trim() : ''
    return fromEnv || 'https://ethereum-sepolia-rpc.publicnode.com'
  }
  return null
}

export function getRelayerBaseUrlForChainId(chainId: number): string {
  return chainId === SEPOLIA_CHAIN_ID ? SEPOLIA_RELAYER_BASE_URL : MAINNET_RELAYER_BASE_URL
}
