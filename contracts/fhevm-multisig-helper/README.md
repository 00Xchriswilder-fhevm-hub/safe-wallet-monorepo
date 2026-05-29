# FHEVMMultiSigHelper

Solidity helper for **fhEVM + multisig (Safe)** confidential flows. Before a Safe can execute a confidential ERC-7984 transfer, encrypted amount handles must be **allowed** on the FHE ACL for the Safe and its owners. This contract batches that step via the Zama `Impl` API.

Used by [`apps/web`](../../apps/web) confidential send preflight (`allowForSafeMultiSig`).

## Contract API

| Function                                                         | Purpose                                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `allowForSafeMultiSig(safe, handles, proof)`                     | Reads Safe owners via `getOwners()`, then allows each handle for the Safe + every owner |
| `allowForCustomMultiSigOwners(multisig, owners, handles, proof)` | Same ACL grants for a custom owner list (non-Safe multisigs)                            |

Source: [`contracts/FHEVMMultiSigHelper.sol`](./contracts/FHEVMMultiSigHelper.sol)

## Deployed instances (for dev program / explorers)

| Network              | Address                                      | Explorer                                                                                             |
| -------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Sepolia**          | `0xc51693587A5ec99FF131Ccd8aa6Fb424B17f5F61` | [Sepolia Etherscan](https://sepolia.etherscan.io/address/0xc51693587A5ec99FF131Ccd8aa6Fb424B17f5F61) |
| **Ethereum mainnet** | `0xd430F46fE522a32b12ce92C719437fFce35e127`  | [Etherscan](https://etherscan.io/address/0xd430F46fE522a32b12ce92C719437fFce35e127)                  |

Machine-readable copy: [`deployments.json`](./deployments.json).

Web app env vars (see `apps/web/.env`):

- `NEXT_PUBLIC_SEPOLIA_FHEVM_MULTISIG_HELPER`
- `NEXT_PUBLIC_MAINNET_FHEVM_MULTISIG_HELPER`

Related (ACL proxy, separate contract): `NEXT_PUBLIC_*_ACL_PROXY` in the web app — used for balance-handle `ACL.allow` proposals, not this helper.

## Build & deploy

```bash
cd contracts/fhevm-multisig-helper
cp .env.example .env   # set PRIVATE_KEY + RPC URLs
npm install
npm run compile
npm run deploy:sepolia
# npm run deploy:mainnet
```

After deploy, update `deployments.json` and `apps/web/.env`, then restart the web dev server.

## Verify on Etherscan (optional)

```bash
npx hardhat verify --network sepolia <DEPLOYED_ADDRESS>
```

## License

BSD-3-Clause-Clear (see SPDX header in the `.sol` file).
