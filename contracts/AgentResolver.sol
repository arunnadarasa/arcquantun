// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title AgentResolver
/// @notice A single-name ENS resolver for the Clinical Quantum Exchange agent
///         namespace on Sepolia. It is deliberately keyed by record key alone
///         rather than by node: this resolver serves exactly one name, so node
///         ambiguity between ENS v1 namehash and the v2 canonical id cannot
///         produce a silently empty read.
/// @dev Implements the ENSIP-10 wildcard `resolve(bytes,bytes)` entry point used
///      by Universal Resolver V2, plus the direct `text`/`addr` accessors.
contract AgentResolver {
    error NotOwner();

    event TextChanged(string indexed indexedKey, string key, string value);
    event AddrChanged(bytes32 indexed node, address a);

    address public owner;
    address public ethAddress;
    mapping(string => string) private texts;

    constructor(address _owner) {
        owner = _owner;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function setOwner(address next) external onlyOwner {
        owner = next;
    }

    function setAddr(address a) external onlyOwner {
        ethAddress = a;
        emit AddrChanged(bytes32(0), a);
    }

    function setText(string calldata key, string calldata value) public onlyOwner {
        texts[key] = value;
        emit TextChanged(key, key, value);
    }

    /// @notice Write a batch of records in one transaction.
    function setTexts(string[] calldata keys, string[] calldata values) external onlyOwner {
        for (uint256 i = 0; i < keys.length; i++) {
            setText(keys[i], values[i]);
        }
    }

    // --- ENS read interface -------------------------------------------------

    function text(bytes32, string calldata key) external view returns (string memory) {
        return texts[key];
    }

    function addr(bytes32) external view returns (address payable) {
        return payable(ethAddress);
    }

    function addr(bytes32, uint256 coinType) external view returns (bytes memory) {
        if (coinType != 60) return "";
        return abi.encodePacked(ethAddress);
    }

    /// @notice ENSIP-10 wildcard resolution.
    function resolve(bytes calldata, bytes calldata data) external view returns (bytes memory) {
        bytes4 selector = bytes4(data[:4]);
        if (selector == 0x59d1d43c) {
            (, string memory key) = abi.decode(data[4:], (bytes32, string));
            return abi.encode(texts[key]);
        }
        if (selector == 0x3b3b57de) {
            return abi.encode(ethAddress);
        }
        if (selector == 0xf1cb7e06) {
            (, uint256 coinType) = abi.decode(data[4:], (bytes32, uint256));
            if (coinType != 60) return abi.encode(bytes(""));
            return abi.encode(abi.encodePacked(ethAddress));
        }
        return "";
    }

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return
            id == 0x01ffc9a7 || // ERC-165
            id == 0x3b3b57de || // addr(bytes32)
            id == 0xf1cb7e06 || // addr(bytes32,uint256)
            id == 0x59d1d43c || // text(bytes32,string)
            id == 0x9061b923; // ENSIP-10 extended resolver
    }
}
