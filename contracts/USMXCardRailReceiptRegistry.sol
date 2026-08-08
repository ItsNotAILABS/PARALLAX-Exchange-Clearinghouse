// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title USMXCardRailReceiptRegistry
/// @notice Anchors PARALLAX US/MX card-rail receipts without custody, card data, or settlement authority.
contract USMXCardRailReceiptRegistry {
    struct ReceiptAnchor {
        uint256 sequence;
        bytes32 receiptHash;
        bytes32 previousHash;
        bytes32 eventHead;
        string corridor;
        string provider;
        string intentId;
        string executionId;
        bool custodyByParallax;
        uint256 anchoredAt;
    }

    address public immutable operator;
    uint256 public receiptCount;
    bytes32 public headHash;
    mapping(uint256 => ReceiptAnchor) public receipts;
    mapping(bytes32 => bool) public seenReceiptHash;

    event ReceiptAnchored(
        uint256 indexed sequence,
        bytes32 indexed receiptHash,
        bytes32 indexed previousHash,
        bytes32 eventHead,
        string corridor,
        string provider,
        string intentId,
        string executionId,
        bool custodyByParallax
    );

    error OnlyOperator();
    error CustodyNotAllowed();
    error DuplicateReceipt();
    error PreviousHashMismatch();
    error EmptyReceiptHash();

    constructor(address initialOperator) {
        operator = initialOperator == address(0) ? msg.sender : initialOperator;
    }

    function anchorReceipt(
        bytes32 receiptHash,
        bytes32 previousHash,
        bytes32 eventHead,
        string calldata corridor,
        string calldata provider,
        string calldata intentId,
        string calldata executionId,
        bool custodyByParallax
    ) external returns (uint256 sequence) {
        if (msg.sender != operator) revert OnlyOperator();
        if (custodyByParallax) revert CustodyNotAllowed();
        if (receiptHash == bytes32(0)) revert EmptyReceiptHash();
        if (seenReceiptHash[receiptHash]) revert DuplicateReceipt();
        if (previousHash != headHash) revert PreviousHashMismatch();

        sequence = ++receiptCount;
        receipts[sequence] = ReceiptAnchor({
            sequence: sequence,
            receiptHash: receiptHash,
            previousHash: previousHash,
            eventHead: eventHead,
            corridor: corridor,
            provider: provider,
            intentId: intentId,
            executionId: executionId,
            custodyByParallax: false,
            anchoredAt: block.timestamp
        });
        seenReceiptHash[receiptHash] = true;
        headHash = receiptHash;
        emit ReceiptAnchored(sequence, receiptHash, previousHash, eventHead, corridor, provider, intentId, executionId, false);
    }

    function latestReceipt() external view returns (ReceiptAnchor memory) {
        return receipts[receiptCount];
    }
}
