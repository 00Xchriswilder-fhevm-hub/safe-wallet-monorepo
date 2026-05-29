import { getAddress, parseAbi } from 'viem'
import { MAINNET_CHAIN_ID, SEPOLIA_CHAIN_ID } from './relayerConstants'

const ZERO = '0x0000000000000000000000000000000000000000' as const

function checksum(addr: string): `0x${string}` {
  if (!addr || addr === ZERO) {
    return ZERO
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
 * UI symbols/logos match mainnet; on-chain addresses are Sepolia mock pairs.
 */
const SEPOLIA_CONTRACTS = {
  USDC: envAddr('NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS', '0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF'),
  CONF_USDC: envAddr('NEXT_PUBLIC_SEPOLIA_CONF_USDC_ADDRESS', '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639'),
  USDT: envAddr('NEXT_PUBLIC_SEPOLIA_USDT_ADDRESS', '0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0'),
  CONF_USDT: envAddr('NEXT_PUBLIC_SEPOLIA_CONF_USDT_ADDRESS', '0x4E7B06D78965594eB5EF5414c357ca21E1554491'),
  ZAMA: envAddr('NEXT_PUBLIC_SEPOLIA_ZAMA_ADDRESS', '0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57'),
  CONF_ZAMA: envAddr('NEXT_PUBLIC_SEPOLIA_CONF_ZAMA_ADDRESS', '0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB'),
  WETH: envAddr('NEXT_PUBLIC_SEPOLIA_WETH_ADDRESS', '0xff54739b16576FA5402F211D0b938469Ab9A5f3F'),
  CONF_WETH: envAddr('NEXT_PUBLIC_SEPOLIA_CONF_WETH_ADDRESS', '0x46208622DA27d91db4f0393733C8BA082ed83158'),
  BRON: envAddr('NEXT_PUBLIC_SEPOLIA_BRON_ADDRESS', '0xFf021fB13cA64e5354c62c954b949a88cfDEb25E'),
  CONF_BRON: envAddr('NEXT_PUBLIC_SEPOLIA_CONF_BRON_ADDRESS', '0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891'),
  TGBP: envAddr('NEXT_PUBLIC_SEPOLIA_TGBP_ADDRESS', '0x93c931278A2aad1916783F952f94276eA5111442'),
  CONF_TGBP: envAddr('NEXT_PUBLIC_SEPOLIA_CONF_TGBP_ADDRESS', '0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC'),
  XAUT: envAddr('NEXT_PUBLIC_SEPOLIA_XAUT_ADDRESS', '0x24377AE4AA0C45ecEe71225007f17c5D423dd940'),
  CONF_XAUT: envAddr('NEXT_PUBLIC_SEPOLIA_CONF_XAUT_ADDRESS', '0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7'),
} as const

/**
 * Mainnet: defaults aligned with zPayy mobile `app.config.js` (ERC-7984 / Zama wrappers).
 */
const MAINNET_CONTRACTS = {
  USDC: envAddr('NEXT_PUBLIC_MAINNET_USDC_ADDRESS', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
  CONF_USDC: envAddr('NEXT_PUBLIC_MAINNET_CONF_USDC_ADDRESS', '0xe978F22157048E5DB8E5d07971376e86671672B2'),
  USDT: envAddr('NEXT_PUBLIC_MAINNET_USDT_ADDRESS', '0xdAC17F958D2ee523a2206206994597C13D831ec7'),
  CONF_USDT: envAddr('NEXT_PUBLIC_MAINNET_CONF_USDT_ADDRESS', '0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50'),
  ZAMA: envAddr('NEXT_PUBLIC_MAINNET_ZAMA_ADDRESS', '0xA12CC123ba206d4031D1c7f6223D1C2Ec249f4f3'),
  CONF_ZAMA: envAddr('NEXT_PUBLIC_MAINNET_CONF_ZAMA_ADDRESS', '0x80CB147Fd86dC6dEe3Eee7e4Cee33d1397d98071'),
  WETH: envAddr('NEXT_PUBLIC_MAINNET_WETH_ADDRESS', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  CONF_WETH: envAddr('NEXT_PUBLIC_MAINNET_CONF_WETH_ADDRESS', '0xda9396b82634Ea99243cE51258B6A5Ae512D4893'),
  BRON: envAddr('NEXT_PUBLIC_MAINNET_BRON_ADDRESS', '0xBA2C598E11eD093079cC324FCa5BbbA99F616E83'),
  CONF_BRON: envAddr('NEXT_PUBLIC_MAINNET_CONF_BRON_ADDRESS', '0x85dE671c3bec1aDeD752c3Cea943521181C826bc'),
  TGBP: envAddr('NEXT_PUBLIC_MAINNET_TGBP_ADDRESS', '0x27f6c8289550fCE67f6B50BeD1F519966aFE5287'),
  CONF_TGBP: envAddr('NEXT_PUBLIC_MAINNET_CONF_TGBP_ADDRESS', '0xa873750ccBafD5ec7Dd13bfD5237d7129832eDD9'),
  XAUT: envAddr('NEXT_PUBLIC_MAINNET_XAUT_ADDRESS', '0x68749665FF8D2d112Fa859AA293F07A622782F38'),
  CONF_XAUT: envAddr('NEXT_PUBLIC_MAINNET_CONF_XAUT_ADDRESS', '0x73cc9aF9d6BEFdb3c3fAf8a5E8c05Cb95FdaEEf1'),
} as const

export type ConfidentialTokenKey = 'usdc' | 'usdt' | 'zama' | 'weth' | 'bron' | 'tgbp' | 'xaut'

/** Mainnet: all confidential FHE assets supported in UI when addresses are non-zero. */
export const CONFIDENTIAL_TOKEN_KEYS_MAINNET: ConfidentialTokenKey[] = [
  'usdc',
  'usdt',
  'zama',
  'weth',
  'bron',
  'tgbp',
  'xaut',
]

/** Sepolia: same asset set as mainnet (official mock wrappers on testnet). */
export const CONFIDENTIAL_TOKEN_KEYS_SEPOLIA: ConfidentialTokenKey[] = CONFIDENTIAL_TOKEN_KEYS_MAINNET

/**
 * ERC-7984 confidential balances / relayer encrypt-decrypt use 6 decimals on the FHE side,
 * even when the underlying ERC-20 uses 18 (Zama convention; see ERC7984-bounty `tokenDecimals.ts`).
 */
export const CONFIDENTIAL_DECIMALS = 6

export const TOKEN_LABELS: Record<
  ConfidentialTokenKey,
  {
    symbol: string
    /** Public ERC-20 decimals (underlying token). */
    underlyingDecimals: number
    underlyingSymbol: string
    underlyingLogoUri?: string
  }
> = {
  usdc: {
    symbol: 'cUSDC',
    underlyingDecimals: 6,
    underlyingSymbol: 'USDC',
    underlyingLogoUri: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
  },
  usdt: {
    symbol: 'cUSDT',
    underlyingDecimals: 6,
    underlyingSymbol: 'USDT',
    underlyingLogoUri: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  },
  zama: {
    symbol: 'cZAMA',
    underlyingDecimals: 18,
    underlyingSymbol: 'ZAMA',
    underlyingLogoUri: 'https://coin-images.coingecko.com/coins/images/70921/small/zama.png',
  },
  weth: {
    symbol: 'cWETH',
    underlyingDecimals: 18,
    underlyingSymbol: 'WETH',
    underlyingLogoUri: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
  },
  bron: {
    symbol: 'cBRON',
    underlyingDecimals: 18,
    underlyingSymbol: 'BRON',
    underlyingLogoUri: '/images/common/token-placeholder.svg',
  },
  tgbp: {
    symbol: 'ctGBP',
    underlyingDecimals: 18,
    underlyingSymbol: 'tGBP',
    underlyingLogoUri: 'https://coin-images.coingecko.com/coins/images/70647/small/tgbp-square.png',
  },
  xaut: {
    symbol: 'cXAUt',
    underlyingDecimals: 6,
    underlyingSymbol: 'XAUt',
    underlyingLogoUri: 'https://coin-images.coingecko.com/coins/images/10481/small/logo.png',
  },
}

function mainnetConfColumn(key: ConfidentialTokenKey): `0x${string}` {
  switch (key) {
    case 'usdc':
      return MAINNET_CONTRACTS.CONF_USDC
    case 'usdt':
      return MAINNET_CONTRACTS.CONF_USDT
    case 'zama':
      return MAINNET_CONTRACTS.CONF_ZAMA
    case 'weth':
      return MAINNET_CONTRACTS.CONF_WETH
    case 'bron':
      return MAINNET_CONTRACTS.CONF_BRON
    case 'tgbp':
      return MAINNET_CONTRACTS.CONF_TGBP
    case 'xaut':
      return MAINNET_CONTRACTS.CONF_XAUT
  }
}

function sepoliaConfColumn(key: ConfidentialTokenKey): `0x${string}` {
  switch (key) {
    case 'usdc':
      return SEPOLIA_CONTRACTS.CONF_USDC
    case 'usdt':
      return SEPOLIA_CONTRACTS.CONF_USDT
    case 'zama':
      return SEPOLIA_CONTRACTS.CONF_ZAMA
    case 'weth':
      return SEPOLIA_CONTRACTS.CONF_WETH
    case 'bron':
      return SEPOLIA_CONTRACTS.CONF_BRON
    case 'tgbp':
      return SEPOLIA_CONTRACTS.CONF_TGBP
    case 'xaut':
      return SEPOLIA_CONTRACTS.CONF_XAUT
  }
}

export function getConfidentialTokenAddress(chainId: number, key: ConfidentialTokenKey): `0x${string}` | null {
  if (chainId === SEPOLIA_CHAIN_ID) {
    const addr = sepoliaConfColumn(key)
    return addr === ZERO ? null : addr
  }
  if (chainId === MAINNET_CHAIN_ID) {
    const addr = mainnetConfColumn(key)
    return addr === ZERO ? null : addr
  }
  return null
}

/** Keys with a non-zero confidential token address on this chain (for pickers / asset list). */
export function listConfiguredConfidentialTokenKeys(chainId: number): ConfidentialTokenKey[] {
  const base = chainId === SEPOLIA_CHAIN_ID ? CONFIDENTIAL_TOKEN_KEYS_SEPOLIA : CONFIDENTIAL_TOKEN_KEYS_MAINNET
  return base.filter((k) => getConfidentialTokenAddress(chainId, k) != null)
}

/** Resolve which confidential token key matches an on-chain contract address (for decrypt UI / queue). */
export function getTokenKeyForConfidentialAddress(chainId: number, address: string): ConfidentialTokenKey | null {
  const normalized = getAddress(address).toLowerCase()
  const keys: ConfidentialTokenKey[] = ['usdc', 'usdt', 'zama', 'weth', 'bron', 'tgbp', 'xaut']
  for (const key of keys) {
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
    return envAddr('NEXT_PUBLIC_MAINNET_FHEVM_MULTISIG_HELPER', '0xd430F46fE522a32b12ce92C719437fFce35e127')
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
