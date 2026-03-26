import { decodeFunctionData, encodeFunctionData } from 'viem'
import { CONF_TOKEN_ABI, FHEVM_MULTISIG_HELPER_ABI, ACL_ABI } from './contracts'

/** Calldata for Safe: confidential transfer after FHEVM multisig helper + ACL (empty proof on transfer). */
export function encodeConfidentialTransferMultisigCalldata(
  to: `0x${string}`,
  encryptedAmountHandle: `0x${string}`,
): `0x${string}` {
  return encodeFunctionData({
    abi: CONF_TOKEN_ABI,
    functionName: 'confidentialTransfer',
    args: [to, encryptedAmountHandle, '0x'],
  })
}

export function parseConfidentialTransferHandleFromCalldata(data: `0x${string}`): `0x${string}` | null {
  if (!data || data.length < 10) return null
  try {
    const decoded = decodeFunctionData({
      abi: CONF_TOKEN_ABI,
      data,
    })
    if (decoded.functionName !== 'confidentialTransfer') return null
    const args = decoded.args as readonly [`0x${string}`, `0x${string}`, `0x${string}`]
    return args[1]
  } catch {
    return null
  }
}

export function encodeAllowForSafeMultiSigCalldata(
  safeAddress: `0x${string}`,
  handle: `0x${string}`,
  inputProof: `0x${string}`,
): `0x${string}` {
  return encodeFunctionData({
    abi: FHEVM_MULTISIG_HELPER_ABI,
    functionName: 'allowForSafeMultiSig',
    args: [safeAddress, [handle], inputProof],
  })
}

export function encodeAclAllowCalldata(handle: `0x${string}`, confidentialToken: `0x${string}`): `0x${string}` {
  return encodeFunctionData({
    abi: ACL_ABI,
    functionName: 'allow',
    args: [handle, confidentialToken],
  })
}

/** `ACL.allow(balanceHandle, owner)` — grant a Safe owner EOA permission to user-decrypt `confidentialBalanceOf(Safe)`. */
export function encodeAclAllowBalanceOwnerCalldata(handle: `0x${string}`, owner: `0x${string}`): `0x${string}` {
  return encodeAclAllowCalldata(handle, owner)
}

export function isConfidentialTransferCalldata(hexData: string | undefined): boolean {
  if (!hexData || hexData.length < 10) return false
  try {
    const decoded = decodeFunctionData({
      abi: CONF_TOKEN_ABI,
      data: hexData as `0x${string}`,
    })
    return decoded.functionName === 'confidentialTransfer'
  } catch {
    return false
  }
}
