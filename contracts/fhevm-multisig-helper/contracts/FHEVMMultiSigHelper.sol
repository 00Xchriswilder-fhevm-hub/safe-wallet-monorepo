// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/Impl.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

interface ISafe {
    function getOwners() external view returns (address[] memory);
}

/// @title FHEVMMultiSigHelper
/// @notice Helper contract to facilitate usage of fhEVM with multisig accounts (e.g. Safe).
/// @dev Used by the Safe confidential transfer flow: `allowForSafeMultiSig` grants ACL on encrypted
///      handles to the Safe and all owners so owners can sign preflight txs and user-decrypt amounts.
contract FHEVMMultiSigHelper {
    /// @notice Returned if the list of input handles is empty
    error EmptyInputHandles();

    /// @notice Returned if the list of owners is empty
    error EmptyOwners();

    /// @notice Returned if the multisig address is null
    error NullMultisig();

    /// @notice Returned if one of the handles is null
    error UninitializedHandle();

    constructor() {
        FHE.setCoprocessor(ZamaConfig.getEthereumCoprocessorConfig());
    }

    /// @notice Allow a list of handles to the owners of a Safe multisig and to the Safe itself
    /// @param safeMultisig The Safe account address
    /// @param inputHandles Initialized handles to allow (non-empty)
    /// @param inputProof Input proof for `inputHandles` (non-empty)
    function allowForSafeMultiSig(
        address safeMultisig,
        bytes32[] memory inputHandles,
        bytes memory inputProof
    ) external {
        address[] memory owners = ISafe(safeMultisig).getOwners();
        uint256 numOwners = owners.length;
        _allowHandlesForMultiSigAndOwners(safeMultisig, inputHandles, inputProof, owners, numOwners);
    }

    /// @notice Allow handles to a custom owner list and multisig (non-Safe multisigs supported)
    /// @dev Caller must supply the correct owner list for the multisig
    /// @param multisig Multisig account address
    /// @param owners Owner addresses (non-empty)
    /// @param inputHandles Initialized handles (non-empty)
    /// @param inputProof Input proof for `inputHandles`
    function allowForCustomMultiSigOwners(
        address multisig,
        address[] memory owners,
        bytes32[] memory inputHandles,
        bytes memory inputProof
    ) external {
        uint256 numOwners = owners.length;
        if (numOwners == 0) revert EmptyOwners();
        _allowHandlesForMultiSigAndOwners(multisig, inputHandles, inputProof, owners, numOwners);
    }

    function _allowHandlesForMultiSigAndOwners(
        address multisig,
        bytes32[] memory inputHandles,
        bytes memory inputProof,
        address[] memory owners,
        uint256 numOwners
    ) internal {
        if (multisig == address(0)) revert NullMultisig();
        uint256 inputHandlesLength = inputHandles.length;
        if (inputHandlesLength == 0) revert EmptyInputHandles();
        for (uint256 idxHandle = 0; idxHandle < inputHandlesLength; idxHandle++) {
            bytes32 inputHandle = inputHandles[idxHandle];
            if (inputHandle == bytes32(0)) revert UninitializedHandle();
            Impl.verify(inputHandle, inputProof, FheType(uint8(inputHandle[30])));
            Impl.allow(inputHandle, multisig);
            for (uint256 idxOwner; idxOwner < numOwners; idxOwner++) {
                Impl.allow(inputHandle, owners[idxOwner]);
            }
        }
    }
}
