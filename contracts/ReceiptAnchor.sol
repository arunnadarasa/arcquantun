// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title ReceiptAnchor
/// @notice Tamper-evident anchor for Clinical Quantum Exchange receipts on Arc.
/// @dev Stores keccak256 of the receipt JSON alongside the engine string and
///      shot count, so a number can never be read back without its qualifier.
contract ReceiptAnchor {
    event Anchored(
        address indexed author,
        bytes32 indexed receiptHash,
        string signalId,
        string engine,
        uint32 shots,
        uint256 at
    );

    mapping(bytes32 => uint256) public anchoredAt;
    uint256 public total;

    error AlreadyAnchored();
    error EmptyEngine();

    /// @notice Anchor a receipt. A receipt hash may only be anchored once.
    function anchor(
        bytes32 receiptHash,
        string calldata signalId,
        string calldata engine,
        uint32 shots
    ) external {
        if (anchoredAt[receiptHash] != 0) revert AlreadyAnchored();
        if (bytes(engine).length == 0) revert EmptyEngine();
        anchoredAt[receiptHash] = block.timestamp;
        unchecked {
            total += 1;
        }
        emit Anchored(msg.sender, receiptHash, signalId, engine, shots, block.timestamp);
    }

    /// @notice True when this exact receipt has been anchored before.
    function isAnchored(bytes32 receiptHash) external view returns (bool) {
        return anchoredAt[receiptHash] != 0;
    }
}
