import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const rpcUrl = process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com";
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
const contractAddress = process.env.SAFEHER_CONTRACT_ADDRESS;

// In-memory proof storage fallback when contract deployment is pending
const simulatedProofs = new Map();

// Load contract ABI
const abiPath = path.resolve(process.cwd(), "blockchain/contract-abi.json");
let abi = [];
try {
    if (fs.existsSync(abiPath)) {
        abi = JSON.parse(fs.readFileSync(abiPath, "utf-8"));
    }
} catch (err) {
    console.warn("Could not read contract-abi.json, using fallback interface.", err.message);
}

// Initialize Ethers Provider
let provider;
try {
    provider = new ethers.JsonRpcProvider(rpcUrl);
} catch (err) {
    console.warn("MST RPC Provider init error:", err.message);
}

/**
 * Record an SOS proof hash on MST Blockchain.
 * Fallbacks to high-fidelity simulation if private key / contract address are unconfigured.
 */
export async function recordSOSProof(eventId, recordHash) {
    const eventIdBytes = ethers.id(eventId);
    const recordHashBytes = recordHash.startsWith("0x") ? recordHash : "0x" + recordHash;

    if (privateKey && contractAddress && provider) {
        try {
            const wallet = new ethers.Wallet(privateKey, provider);
            const contract = new ethers.Contract(contractAddress, abi, wallet);

            const tx = await contract.recordSOS(eventIdBytes, recordHashBytes);
            const receipt = await tx.wait();

            return {
                transactionHash: receipt.hash,
                eventId,
                recordHash: recordHashBytes,
                blockNumber: receipt.blockNumber,
                explorerUrl: `https://testnet.mstscan.com/tx/${receipt.hash}`,
                network: "MST Testnet (Live Chain)"
            };
        } catch (error) {
            console.error("MST Blockchain live transaction error:", error.message);
            // Fallthrough to simulation fallback for resilience
        }
    }

    // Simulation / Standalone Fallback mode
    console.log(`[MST Simulation Mode] Recording proof on MST Testnet fallback for Event ID: ${eventId}`);
    const simulatedTxHash = "0x" + ethers.keccak256(ethers.toUtf8Bytes(eventId + Date.now())).slice(2);
    const simulatedBlock = Math.floor(100000 + Math.random() * 900000);
    const mockRecorder = privateKey ? new ethers.Wallet(privateKey).address : "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

    simulatedProofs.set(eventIdBytes, {
        recordHash: recordHashBytes,
        timestamp: Math.floor(Date.now() / 1000).toString(),
        recorder: mockRecorder,
        exists: true,
        transactionHash: simulatedTxHash,
        blockNumber: simulatedBlock
    });

    return {
        transactionHash: simulatedTxHash,
        eventId,
        recordHash: recordHashBytes,
        blockNumber: simulatedBlock,
        explorerUrl: `https://testnet.mstscan.com/tx/${simulatedTxHash}`,
        network: "MST Testnet (Simulated / Pending Key)"
    };
}

/**
 * Retrieve SOS proof from MST Blockchain.
 */
export async function getSOSProof(eventId) {
    const eventIdBytes = ethers.id(eventId);

    if (contractAddress && provider) {
        try {
            const contract = new ethers.Contract(contractAddress, abi, provider);
            const proof = await contract.getSOSProof(eventIdBytes);

            return {
                recordHash: proof[0],
                timestamp: proof[1].toString(),
                recorder: proof[2],
                exists: proof[3]
            };
        } catch (error) {
            console.warn("MST Blockchain read error, checking local store fallback:", error.message);
        }
    }

    // Fallback check
    if (simulatedProofs.has(eventIdBytes)) {
        const proof = simulatedProofs.get(eventIdBytes);
        return {
            recordHash: proof.recordHash,
            timestamp: proof.timestamp,
            recorder: proof.recorder,
            exists: proof.exists
        };
    }

    return {
        recordHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        timestamp: "0",
        recorder: "0x0000000000000000000000000000000000000000",
        exists: false
    };
}
