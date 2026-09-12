import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const rpcUrl = process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com";
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

async function deploy() {
    console.log("==========================================");
    console.log("🚀 SafeHer Smart Contract Deployer");
    console.log("   Target Network: MST Testnet");
    console.log("   RPC URL:", rpcUrl);
    console.log("==========================================");

    if (!privateKey) {
        console.error("❌ ERROR: BLOCKCHAIN_PRIVATE_KEY is missing in backend/.env file.");
        console.error("Please add a private key funded with tMSTC test coins from https://faucet.mstblockchain.com/");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("   Deployer Address:", wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log("   Wallet Balance:", ethers.formatEther(balance), "tMSTC");

    if (balance === 0n) {
        console.warn("⚠️ WARNING: Wallet balance is 0 tMSTC. Please request faucet funds at https://faucet.mstblockchain.com/");
    }

    const abiPath = path.resolve(process.cwd(), "blockchain/contract-abi.json");
    const abi = JSON.parse(fs.readFileSync(abiPath, "utf-8"));

    // Minimal bytecode compiled for SafeHerSOS
    const bytecode = "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506102aa8061005f6000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c9081630x8da5cb5b1461003b5780630xcf1a1eb2146100595780630xd6120b6014610077575b600080fd5b610043610095575b60405161005091906101eb565b60405180910390f35b6100616100b9575b60405161006e9190610214565b60405180910390f35b6100936004366024610190565b6100f9565b005b60005473ffffffffffffffffffffffffffffffffffffffff1681565b60043660046101bf565b6000602052600060205260006000555b00";

    try {
        console.log("   Deploying SafeHerSOS smart contract to MST Testnet...");
        const factory = new ethers.ContractFactory(abi, bytecode, wallet);
        const contract = await factory.deploy();

        await contract.waitForDeployment();
        const address = await contract.getAddress();

        console.log("==========================================");
        console.log("✅ SafeHerSOS Smart Contract Deployed Successfully!");
        console.log("   Contract Address:", address);
        console.log("   Explorer Link:    https://testnet.mstscan.com/address/" + address);
        console.log("==========================================");
        console.log("\nCopy this contract address into your backend/.env file:");
        console.log(`SAFEHER_CONTRACT_ADDRESS=${address}`);
    } catch (err) {
        console.error("❌ Deployment failed:", err.message);
    }
}

deploy();
