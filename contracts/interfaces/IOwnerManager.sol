// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.9.0;

/**
 * @title IOwnerManager - Interface for contract which manages Safe owners and a threshold to authorize transactions.
 * @author @safe-global/safe-protocol
 */
interface IOwnerManager {
    event UpdatedOwners(address[] owners);

    /**
     * @notice Updates the list of owners and threshold if enough current owners approve
     * @param newThreshold New threshold for transactions
     * @param newOwners New sorted list of owners
     * @param signature Signature of the owner calling the function
     */
    function updateOwners(
        uint256 newThreshold,
        address[] calldata newOwners,
        bytes calldata signature
    ) external;

    /**
     * @notice Returns the number of required confirmations for a Safe transaction aka the threshold.
     * @return Threshold number.
     */
    function getThreshold() external view returns (uint256);

    /**
     * @notice Returns if `owner` is an owner of the Safe.
     * @return Boolean if `owner` is an owner of the Safe.
     */
    function isOwner(address owner) external view returns (bool);

    /**
     * @notice Returns a list of Safe owners.
     * @return Array of Safe owners.
     */
    function getOwners() external view returns (address[] memory);

    /**
     * @notice Returns the approved hashes for an owner
     * @param owner Owner address
     * @param hash Hash of the update
     * @return Value indicating if hash is approved
     */
    function approvedOwnersHashes(address owner, bytes32 hash) external view returns (uint256);
}