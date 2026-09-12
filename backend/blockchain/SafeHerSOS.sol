// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SafeHerSOS
 * @dev On-chain tamper-evident proof store for SafeHer Emergency System on MST Blockchain.
 */
contract SafeHerSOS {

    address public owner;

    struct SOSProof {
        bytes32 recordHash;
        uint256 timestamp;
        address recorder;
        bool exists;
    }

    mapping(bytes32 => SOSProof) private proofs;

    event SOSProofRecorded(
        bytes32 indexed eventId,
        bytes32 indexed recordHash,
        uint256 timestamp,
        address recorder
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Record a new SOS proof hash on MST Blockchain.
     * @param eventId Unique bytes32 ID generated for the SOS event.
     * @param recordHash Cryptographic SHA-256 fingerprint (bytes32) of private SOS record.
     */
    function recordSOS(
        bytes32 eventId,
        bytes32 recordHash
    ) external onlyOwner {

        require(
            !proofs[eventId].exists,
            "SOS already recorded"
        );

        proofs[eventId] = SOSProof({
            recordHash: recordHash,
            timestamp: block.timestamp,
            recorder: msg.sender,
            exists: true
        });

        emit SOSProofRecorded(
            eventId,
            recordHash,
            block.timestamp,
            msg.sender
        );
    }

    /**
     * @dev Retrieve stored SOS proof metadata from MST Blockchain.
     * @param eventId Unique bytes32 ID of the SOS event.
     */
    function getSOSProof(
        bytes32 eventId
    )
        external
        view
        returns (
            bytes32 recordHash,
            uint256 timestamp,
            address recorder,
            bool exists
        )
    {
        SOSProof memory proof = proofs[eventId];

        return (
            proof.recordHash,
            proof.timestamp,
            proof.recorder,
            proof.exists
        );
    }
}
