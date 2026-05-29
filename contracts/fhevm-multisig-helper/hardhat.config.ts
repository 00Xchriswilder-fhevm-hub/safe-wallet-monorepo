import '@fhevm/hardhat-plugin'
import '@nomicfoundation/hardhat-ethers'
import '@typechain/hardhat'
import type { HardhatUserConfig } from 'hardhat/config'
import 'dotenv/config'

const MNEMONIC = process.env.MNEMONIC ?? 'test test test test test test test test test test test junk'
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? ''

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      accounts: { mnemonic: MNEMONIC },
      chainId: 31337,
    },
    sepolia: {
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : { mnemonic: MNEMONIC, count: 10 },
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com',
    },
    mainnet: {
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : { mnemonic: MNEMONIC, count: 10 },
      chainId: 1,
      url: process.env.MAINNET_RPC_URL ?? 'https://ethereum-rpc.publicnode.com',
    },
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test',
  },
  solidity: {
    version: '0.8.27',
    settings: {
      metadata: { bytecodeHash: 'none' },
      optimizer: { enabled: true, runs: 800 },
      viaIR: true,
      evmVersion: 'cancun',
    },
  },
  typechain: {
    outDir: 'types',
    target: 'ethers-v6',
  },
}

export default config
