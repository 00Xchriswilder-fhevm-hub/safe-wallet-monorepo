import { getAddress, parseAbi } from 'viem'
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID } from './relayerConstants'

function checksum(addr: string): `0x${string}` {
  if (!addr || addr === '0x0000000000000000000000000000000000000000') {
    return '0x0000000000000000000000000000000000000000'
  }
  try {
    return getAddress(addr) as `0x${string}`
  } catch {
    return addr as `0x${string}`
  }
}

function envAddr(key: string, fallback: string): `0x${string}` {
  const v = typeof process !== 'undefined' ? process.env[key] : undefined
  return checksum(typeof v === 'string' && v.trim() ? v.trim() : fallback)
}

/**
 * Sepolia: underlying + confidential token pair (override via NEXT_PUBLIC_*).
 * Non-zero fallbacks match common Sepolia test deploys so the flow works even if env
 * was added after the dev server started (restart dev server to pick up .env changes).
 */
const SEPOLIA_CONTRACTS = {
  USDC: envAddr('NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS', '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'),
  CONF_USDC: envAddr('NEXT_PUBLIC_SEPOLIA_CONF_USDC_ADDRESS', '0xfCf943a1d840325A049C18757075372Aa1000166'),
  USDT: envAddr('NEXT_PUBLIC_SEPOLIA_USDT_ADDRESS', '0x0000000000000000000000000000000000000000'),
  CONF_USDT: envAddr('NEXT_PUBLIC_SEPOLIA_CONF_USDT_ADDRESS', '0x0000000000000000000000000000000000000000'),
} as const

/**
 * Mainnet: underlying + confidential token pair (override via NEXT_PUBLIC_*).
 * Defaults set to zPayy mainnet USDC + confUSDC wrapper when present.
 */
const MAINNET_CONTRACTS = {
  USDC: envAddr('NEXT_PUBLIC_MAINNET_USDC_ADDRESS', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
  CONF_USDC: envAddr('NEXT_PUBLIC_MAINNET_CONF_USDC_ADDRESS', '0xe978f22157048e5dB8e5d07971376E86671672b2'),
  USDT: envAddr('NEXT_PUBLIC_MAINNET_USDT_ADDRESS', '0x0000000000000000000000000000000000000000'),
  CONF_USDT: envAddr('NEXT_PUBLIC_MAINNET_CONF_USDT_ADDRESS', '0x0000000000000000000000000000000000000000'),
} as const

export type ConfidentialTokenKey = 'usdc' | 'usdt'

export const TOKEN_LABELS: Record<
  ConfidentialTokenKey,
  { symbol: string; decimals: number; underlyingSymbol: string; underlyingLogoUri: string }
> = {
  usdc: {
    symbol: 'cUSDC',
    decimals: 6,
    underlyingSymbol: 'USDC',
    underlyingLogoUri: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
  },
  usdt: {
    symbol: 'cUSDT',
    decimals: 6,
    underlyingSymbol: 'USDT',
    underlyingLogoUri: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  },
}

export function getConfidentialTokenAddress(chainId: number, key: ConfidentialTokenKey): `0x${string}` | null {
  if (chainId === SEPOLIA_CHAIN_ID) {
    return key === 'usdc' ? SEPOLIA_CONTRACTS.CONF_USDC : SEPOLIA_CONTRACTS.CONF_USDT
  }
  if (chainId === MAINNET_CHAIN_ID) {
    return key === 'usdc' ? MAINNET_CONTRACTS.CONF_USDC : MAINNET_CONTRACTS.CONF_USDT
  }
  return null
}

/** Resolve which confidential token key matches an on-chain contract address (for decrypt UI / queue). */
export function getTokenKeyForConfidentialAddress(chainId: number, address: string): ConfidentialTokenKey | null {
  const normalized = getAddress(address).toLowerCase()
  for (const key of ['usdc', 'usdt'] as const) {
    const conf = getConfidentialTokenAddress(chainId, key)
    if (conf && getAddress(conf).toLowerCase() === normalized) return key
  }
  return null
}

export function getFhevmMultisigHelperForChainId(chainId: number): `0x${string}` | null {
  if (chainId === SEPOLIA_CHAIN_ID) {
    return envAddr('NEXT_PUBLIC_SEPOLIA_FHEVM_MULTISIG_HELPER', '0xc51693587A5ec99FF131Ccd8aa6Fb424B17f5F61')
  }
  if (chainId === MAINNET_CHAIN_ID) {
    return envAddr('NEXT_PUBLIC_MAINNET_FHEVM_MULTISIG_HELPER', '0xd430F46fE522a32b12ce92C719f437fFce35e127')
  }
  return null
}

export function getAclProxyForChainId(chainId: number): `0x${string}` | null {
  if (chainId === SEPOLIA_CHAIN_ID) {
    return envAddr('NEXT_PUBLIC_SEPOLIA_ACL_PROXY', '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D')
  }
  const mainnetAcl = process.env.NEXT_PUBLIC_MAINNET_ACL_PROXY
  if (chainId === MAINNET_CHAIN_ID && mainnetAcl?.trim()) {
    return checksum(mainnetAcl.trim())
  }
  return null
}

export const ACL_ABI = parseAbi([
  'function allow(bytes32 handle, address account)',
  'function isAllowed(bytes32 handle, address account) view returns (bool)',
])

export const FHEVM_MULTISIG_HELPER_ABI = parseAbi([
  'function allowForSafeMultiSig(address safeMultisig, bytes32[] inputHandles, bytes inputProof)',
  'function allowForCustomMultiSigOwners(address multisig, address[] owners, bytes32[] inputHandles, bytes inputProof)',
])

export const CONF_TOKEN_ABI = parseAbi([
  'function wrap(address to, uint256 amount)',
  'function unwrap(address from, address to, bytes32 encryptedAmount, bytes inputProof)',
  'function finalizeUnwrap(bytes32 burntAmount, uint64 burntAmountCleartext, bytes decryptionProof)',
  'function confidentialBalanceOf(address account) view returns (bytes32)',
  'function confidentialTransfer(address to, bytes32 encryptedAmount, bytes inputProof)',
  'function underlying() view returns (address)',
])
