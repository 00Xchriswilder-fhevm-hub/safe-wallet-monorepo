import { ethers, network } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  const Factory = await ethers.getContractFactory('FHEVMMultiSigHelper')
  const helper = await Factory.deploy()
  await helper.waitForDeployment()
  const address = await helper.getAddress()

  console.log('Network:', network.name)
  console.log('Deployer:', deployer.address)
  console.log('FHEVMMultiSigHelper:', address)
  console.log('')
  console.log('Set in apps/web/.env:')
  if (network.config.chainId === 11155111) {
    console.log(`NEXT_PUBLIC_SEPOLIA_FHEVM_MULTISIG_HELPER=${address}`)
  } else if (network.config.chainId === 1) {
    console.log(`NEXT_PUBLIC_MAINNET_FHEVM_MULTISIG_HELPER=${address}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
