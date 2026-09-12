import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import solc from "solc";

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
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("   Deployer Address:", wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log("   Wallet Balance:", ethers.formatEther(balance), "tMSTC");

    const solPath = path.resolve(process.cwd(), "blockchain/SafeHerSOS.sol");
    const sourceCode = fs.readFileSync(solPath, "utf-8");

    const input = {
        language: "Solidity",
        sources: {
            "SafeHerSOS.sol": {
                content: sourceCode
            }
        },
        settings: {
            outputSelection: {
                "*": {
                    "*": ["abi", "evm.bytecode"]
                }
            }
        }
    };

    console.log("   Compiling SafeHerSOS.sol with Solidity Compiler...");
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        const errors = output.errors.filter(e => e.severity === "error");
        if (errors.length > 0) {
            console.error("❌ Compilation errors:", errors);
            process.exit(1);
        }
    }

    const contractFile = output.contracts["SafeHerSOS.sol"]["SafeHerSOS"];
    const abi = contractFile.abi;
    const bytecode = "0x" + contractFile.evm.bytecode.object;

    // Update contract-abi.json
    const abiPath = path.resolve(process.cwd(), "blockchain/contract-abi.json");
    fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));

    console.log("   Deploying SafeHerSOS smart contract to MST Testnet...");
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy();

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    const txHash = contract.deploymentTransaction()?.hash;

    console.log("==========================================");
    console.log("✅ SafeHerSOS Smart Contract Deployed Successfully!");
    console.log("   Contract Address: ", contractAddress);
    console.log("   Deploy Tx Hash:   ", txHash);
    console.log("   Explorer Link:    https://testnet.mstscan.com/address/" + contractAddress);
    console.log("==========================================");

    // Automatically update backend/.env with contract address
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, "utf-8");
        if (envContent.includes("SAFEHER_CONTRACT_ADDRESS=")) {
            envContent = envContent.replace(/SAFEHER_CONTRACT_ADDRESS=.*/g, `SAFEHER_CONTRACT_ADDRESS=${contractAddress}`);
        } else {
            envContent += `\nSAFEHER_CONTRACT_ADDRESS=${contractAddress}\n`;
        }
        fs.writeFileSync(envPath, envContent);
        console.log("✅ Saved SAFEHER_CONTRACT_ADDRESS to backend/.env!");
    }
}

deploy().catch(err => {
    console.error("❌ Deployment failed:", err.message);
    process.exit(1);
});
