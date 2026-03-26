import type { Signer } from 'ethers'
import { encodeAclAllowCalldata, encodeAllowForSafeMultiSigCalldata } from './encode'
import { getAclProxyForChainId, getFhevmMultisigHelperForChainId } from './contracts'

export async function sendAllowForSafeMultiSigTx(params: {
  signer: Signer
  chainId: number
  safeAddress: `0x${string}`
  handle: `0x${string}`
  inputProof: `0x${string}`
}): Promise<`0x${string}`> {
  const helper = getFhevmMultisigHelperForChainId(params.chainId)
  if (!helper) throw new Error('FHEVM multisig helper is not configured for this chain')
  const data = encodeAllowForSafeMultiSigCalldata(params.safeAddress, params.handle, params.inputProof)
  const tx = await params.signer.sendTransaction({
    to: helper,
    data,
  })
  const receipt = await tx.wait()
  if (!receipt) throw new Error('Helper transaction failed')
  return tx.hash as `0x${string}`
}

export async function sendAclAllowTx(params: {
  signer: Signer
  chainId: number
  handle: `0x${string}`
  confidentialToken: `0x${string}`
}): Promise<`0x${string}`> {
  const acl = getAclProxyForChainId(params.chainId)
  if (!acl) throw new Error('ACL proxy is not configured for this chain')
  const data = encodeAclAllowCalldata(params.handle, params.confidentialToken)
  const tx = await params.signer.sendTransaction({
    to: acl,
    data,
  })
  const receipt = await tx.wait()
  if (!receipt) throw new Error('ACL transaction failed')
  return tx.hash as `0x${string}`
}

/**
 * `ACL.allow(balanceHandle, owner)` — lets an owner EOA user-decrypt that handle (e.g. `confidentialBalanceOf` result).
 * This is separate from {@link sendAclAllowTx}, which uses `allow(amountHandle, token)` for encrypted *transfer* inputs.
 */
