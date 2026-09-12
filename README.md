# 🛡️ SafeHer: Blockchain SOS Proof Engine on MST Blockchain

> **Hackathon Edition — MST Blockchain Track Submission**

SafeHer integrates a tamper-evident, privacy-preserving blockchain SOS proof system using **MST Blockchain**, **Ethers.js v6**, **Solidity smart contracts**, **Node.js + Express.js**, and the **BridgeKey Wallet**.

---

## 🌟 Hackathon Mandatory Requirements Compliance

| # | Requirement | Implementation in SafeHer | Status |
| --- | --- | --- | --- |
| 1 | **MST Blockchain Usage** | Core cryptographic proof engine recording SHA-256 event fingerprints on-chain via smart contract. | ✅ **Complete** |
| 2 | **MST Testnet Deployment** | Deployment script (`npm run deploy`) configured for MST Testnet (`https://testnetrpc.mstblockchain.com`, Chain ID `91562037`). | ✅ **Complete** |
| 3 | **Public GitHub Repository** | Clean repo layout containing `backend/`, `blockchain/`, `frontend`, and exhaustive `README.md`. | ✅ **Complete** |
| 4 | **BridgeKey Wallet Integration** | Frontend Web3 module (`js/blockchain.js`) supporting **BridgeKey Wallet** connect, network switching (`0x5752c55`), and balance checking. | ✅ **Complete** |
| 5 | **Working Product & On-Chain Proof** | Live SOS trigger flow with geolocation, ntfy dispatch, transaction hash output, and interactive tamper verification. | ✅ **Complete** |

---

## 🌐 MST Blockchain Network Details

- **Network Name**: MST Testnet
- **RPC URL**: `https://testnetrpc.mstblockchain.com`
- **Chain ID**: `91562037` (`0x5752c55` in hex)
- **Currency Symbol**: `tMSTC`
- **Block Explorer**: [https://testnet.mstscan.com](https://testnet.mstscan.com)
- **MST Faucet**: [https://faucet.mstblockchain.com/](https://faucet.mstblockchain.com/)
- **Official Wallet**: **BridgeKey** ([Website](https://bridgekey.io) \| [Chrome Extension](https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg))

---

## 🏗️ Architecture & Privacy Design

```
[ User Presses SOS ]
        │
        ├──> Captures Real Device GPS (Browser Geolocation API)
        │
        ├──> Sends Immediate Emergency Alert (ntfy.sh stream)
        │
        ├──> Saves Private Emergency Record (Backend Storage)
        │
        ├──> Generates SHA-256 Canonical Fingerprint Hash
        │
        ├──> Submits Hash to SafeHerSOS Solidity Contract (MST Testnet)
        │
        └──> Displays Tx Hash & Explorer Link on History Page
```

### 🔒 Privacy Rule
**No sensitive data** (GPS coordinates, phone numbers, or emergency contact info) is ever stored on the public MST Blockchain. The blockchain holds only the cryptographic proof (`bytes32 recordHash`) and non-sensitive `eventId`.

---

## 📁 Repository Structure

```
safeher/
│
├── index.html                  # Landing Portal
├── home.html                   # Emergency SOS Control Center (Large Red SOS Button)
├── history.html                # SOS Proof History & Tamper Verification Hub
│
├── css/
│   └── styles.css              # Dark Glassmorphism Emergency Theme
│
├── js/
│   ├── app.js                  # Shared utilities & backend health check
│   ├── emergency.js            # Geolocation capture & SOS trigger engine
│   ├── blockchain.js           # BridgeKey Wallet integration & MST Scan helpers
│   └── history.js              # History renderer & verification logic
│
├── backend/
│   ├── package.json            # Node.js dependencies (express, ethers v6, dotenv)
│   ├── .env                    # Environment configuration
│   ├── .env.example            # Environment sample
│   ├── server.js               # Express server entry point
│   │
│   ├── blockchain/
│   │   ├── SafeHerSOS.sol      # Solidity smart contract (v0.8.20)
│   │   ├── contract-abi.json   # Contract ABI
│   │   └── deploy.js           # Automated deployment script to MST Testnet
│   │
│   ├── services/
│   │   ├── hashService.js      # SHA-256 canonical hashing engine
│   │   ├── blockchainService.js# Ethers.js v6 provider & MST contract caller
│   │   └── sosService.js       # Emergency record lifecycle & verification
│   │
│   └── routes/
│       └── sosRoutes.js        # Express API endpoints
│
└── README.md                   # Hackathon Documentation & Setup Guide
```

---

## ⚡ Quick Start Guide

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `backend/.env`:
```env
PORT=5000
MST_RPC_URL=https://testnetrpc.mstblockchain.com
BLOCKCHAIN_PRIVATE_KEY=your_funded_testnet_private_key
SAFEHER_CONTRACT_ADDRESS=your_deployed_contract_address
EMERGENCY_CONTACT_PHONE=+917061330201
NTFY_TOPIC=7061330201
```

### 3. Deploy Smart Contract to MST Testnet
Fund your private key with free `tMSTC` coins at [https://faucet.mstblockchain.com/](https://faucet.mstblockchain.com/), then run:
```bash
npm run deploy
```
Copy the printed `Contract Address` into your `backend/.env` file.

### 4. Start the Backend Server
```bash
npm run dev
```

### 5. Launch the Frontend
Open `home.html` or `index.html` in your web browser (or serve using any static web server like Live Server).

---

## 🦊 BridgeKey Wallet Integration Guide

1. Install the [BridgeKey Chrome Extension](https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg).
2. Open SafeHer app in your browser and click **🦊 Connect BridgeKey Wallet** in the top navbar.
3. BridgeKey will prompt you to connect and automatically switch your active network to **MST Testnet** (Chain ID `91562037`).
4. Request free `tMSTC` tokens from the [MST Faucet](https://faucet.mstblockchain.com/).

---

## 🧪 Testing Verification & Tamper Detection

1. **Trigger Emergency SOS**: Click the 🚨 **PRESS SOS** button on `home.html`.
2. **View Proof**: Copy the transaction hash and view on [MST Scan Explorer](https://testnet.mstscan.com).
3. **Verify Intact Proof**: Go to `history.html` and click **🛡️ Verify MST Blockchain Proof**. The system recalculates the SHA-256 hash and confirms a `100% Intact` match (`✅ Record verified successfully`).
4. **Demonstrate Tamper Detection**: Click **⚠️ Simulate Tamper** to alter the local record's GPS coordinates. Now click **🛡️ Verify MST Blockchain Proof**. The system detects a hash mismatch (`⚠️ Proof Verification Mismatch Detected!`).

---

## 🎤 Viva / Judge Q&A Reference

### Q: Why use blockchain in SafeHer?
> **Answer**: Blockchain provides an immutable, tamper-evident proof of emergency events. When an SOS is triggered, SafeHer creates a private emergency record, computes its SHA-256 hash, and writes it to an EVM smart contract on MST Blockchain. Later, any party can recalculate the hash and prove whether the record has been modified or falsified.

### Q: Why not store raw GPS coordinates on the blockchain?
> **Answer**: Storing raw location data on a public blockchain creates severe safety and privacy risks. SafeHer keeps sensitive GPS and user details strictly in private backend storage and commits only the SHA-256 cryptographic fingerprint to MST Blockchain.

### Q: Does blockchain latency delay emergency notifications?
> **Answer**: No. SOS notifications are dispatched immediately over fast alert channels (like ntfy.sh streams) without waiting for block confirmation. Blockchain proof processing runs asynchronously as a verification layer.

### Q: What is the role of ethers.js v6?
> **Answer**: Ethers.js connects our Node.js backend to the MST Testnet RPC (`https://testnetrpc.mstblockchain.com`). It manages contract interaction, transaction signing, and reading proof storage from the `SafeHerSOS` Solidity contract.

---

## 📄 License
MIT License — Free and open source for women's safety & emergency response applications.
