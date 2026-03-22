import { getRelayerBaseUrlForChainId, MAINNET_RELAYER_BASE_URL, RELAYER_ENDPOINTS } from './relayerConstants'

export type EncryptAmountParams = {
  contractAddress: string
  userAddress: string
  amount: string
  decimals: number
}

export type EncryptAmountResult = { handle: string; inputProof: string }

/** Zama relayer REST (encrypt-amount). */
export async function relayerEncryptAmount(
  params: EncryptAmountParams,
  baseUrl: string = MAINNET_RELAYER_BASE_URL,
): Promise<EncryptAmountResult> {
  const res = await fetch(baseUrl.replace(/\/$/, '') + RELAYER_ENDPOINTS.encryptAmount, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contractAddress: params.contractAddress,
      userAddress: params.userAddress,
      amount: params.amount,
      decimals: params.decimals,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`relayer encrypt-amount failed: ${res.status} ${text}`)
  }
  const data = (await res.json()) as { handle?: string; inputProof?: string }
  if (!data.handle || !data.inputProof) {
    throw new Error('relayer encrypt-amount: missing handle or inputProof')
  }
  return { handle: data.handle, inputProof: data.inputProof }
}

export async function relayerEncryptAmountForChain(
  params: EncryptAmountParams,
  chainId: number,
): Promise<EncryptAmountResult> {
  return relayerEncryptAmount(params, getRelayerBaseUrlForChainId(chainId))
}

/** Public decrypt via relayer (no wallet). */
export async function relayerPublicDecrypt(
  handles: string[],
  baseUrl: string = MAINNET_RELAYER_BASE_URL,
): Promise<unknown> {
  const res = await fetch(baseUrl.replace(/\/$/, '') + RELAYER_ENDPOINTS.publicDecrypt, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handles }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`relayer public-decrypt failed: ${res.status} ${text}`)
  }
  return res.json()
}

export async function relayerUserDecryptPrepare(
  params: { handles: string[]; contractAddresses: string[] },
  baseUrl: string = MAINNET_RELAYER_BASE_URL,
): Promise<{ requestId: string; eip712: unknown }> {
  const res = await fetch(baseUrl.replace(/\/$/, '') + RELAYER_ENDPOINTS.userDecryptPrepare, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`relayer user-decrypt/prepare failed: ${res.status} ${text}`)
  }
  const data = (await res.json()) as { requestId?: string; eip712?: unknown }
  if (!data.requestId || !data.eip712) {
    throw new Error('relayer user-decrypt/prepare: missing requestId or eip712')
  }
  return { requestId: data.requestId, eip712: data.eip712 }
}

export async function relayerUserDecryptComplete(
  params: { requestId: string; signature: string; userAddress: string },
  baseUrl: string = MAINNET_RELAYER_BASE_URL,
): Promise<Record<string, unknown>> {
  const res = await fetch(baseUrl.replace(/\/$/, '') + RELAYER_ENDPOINTS.userDecryptComplete, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`relayer user-decrypt/complete failed: ${res.status} ${text}`)
  }
  return (await res.json()) as Record<string, unknown>
}
