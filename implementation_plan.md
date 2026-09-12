# Implementation Plan - SafeHer Blockchain SOS Proof (MST Blockchain Hackathon Edition)

Integrate a tamper-evident, privacy-preserving blockchain SOS proof system into **SafeHer**, satisfying all **5 Mandatory Hackathon Track Requirements**:

1. **MST Blockchain Usage**: Core cryptographic proof system recording SHA-256 event fingerprints on-chain via smart contract.
2. **MST Testnet Deployment Ready**: Automated deployment script (`deploy.js`) for MST Testnet (`https://testnetrpc.mstblockchain.com`, Chain ID `91562037`).
3. **Public GitHub Repository Ready**: Fully structured repository with clean Smart Contract, Node.js + Express backend, Frontend UI, and exhaustive `README.md`.
4. **BridgeKey Wallet Integration**: Frontend web3 wallet provider supporting BridgeKey Chrome Extension / EVM wallet connection (`window.ethereum` / BridgeKey injection), network auto-switching, and account status badge.
5. **Working Product & On-Chain Proof**: Live SOS trigger flow, instant ntfy emergency notification dispatch, backend relay + BridgeKey wallet options, and on-chain verification engine.

---

## MST Blockchain Network Specifications

| Parameter | Specification |
| --- | --- |
| **Network Name** | MST Testnet |
| **RPC URL** | `https://testnetrpc.mstblockchain.com` |
| **Chain ID** | `91562037` (`0x5752c55` hex) |
| **Currency Symbol** | `tMSTC` |
| **Block Explorer** | `https://testnet.mstscan.com` |
| **MST Faucet** | `https://faucet.mstblockchain.com/` |
| **Recommended Wallet** | **BridgeKey** ([Chrome Extension](https://chromewebstore.google.com/detail/bridgekey/bfjojdcfenehemjgjlepdjomkpginlkg)) |

---

## User Review Required

> [!IMPORTANT]
> **Dual Wallet & Gasless Emergency Architecture**: Emergency SOS triggers can run in **Gasless Relay Mode** (backend signer pays gas so imperiled users don't need crypto in an emergency) OR **BridgeKey Direct Mode** (user connects BridgeKey wallet to record/sign on-chain proofs directly). Both modes write verifiable records to the MST Testnet smart contract.

> [!TIP]
> **BridgeKey Wallet Integration**: The frontend includes a dedicated **BridgeKey Connect** button that inspects `window.ethereum`, verifies connection to MST Testnet (Chain ID `91562037`), prompts network addition/switching if on a different chain, and displays the connected wallet address & `tMSTC` balance.

---

## Proposed Changes

### 1. Smart Contract & Deployment Tools

#### [NEW] [`backend/blockchain/SafeHerSOS.sol`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/backend/blockchain/SafeHerSOS.sol)
- Solidity contract (`^0.8.20`) for MST Chain EVM runtime.
- Methods: `recordSOS(bytes32 eventId, bytes32 recordHash)`, `getSOSProof(bytes32 eventId)`.
- Event: `SOSProofRecorded(bytes32 indexed eventId, bytes32 indexed recordHash, uint256 timestamp, address recorder)`.

#### [NEW] [`backend/blockchain/contract-abi.json`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/backend/blockchain/contract-abi.json)
- Contract ABI definition for ethers.js and BridgeKey wallet calls.

#### [NEW] [`backend/blockchain/deploy.js`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/backend/blockchain/deploy.js)
- Automated deployment script using ethers.js v6 + solc / compiled contract bytecode to deploy `SafeHerSOS.sol` to MST Testnet RPC and output contract address + transaction hash.

---

### 2. Backend Engine (Node.js + Express + Ethers.js v6)

#### [NEW] [`backend/package.json`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/backend/package.json)
- Configured with ES Modules, scripts (`start`, `dev`, `deploy`), dependencies (`express`, `ethers`, `dotenv`, `cors`, `solc`).

#### [NEW] [`backend/.env.example`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/backend/.env.example) & [`backend/.env`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/backend/.env)
- Configured with `PORT=5000`, `MST_RPC_URL=https://testnetrpc.mstblockchain.com`, `BLOCKCHAIN_PRIVATE_KEY`, `SAFEHER_CONTRACT_ADDRESS`.

#### [NEW] [`backend/services/hashService.js`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/backend/services/hashService.js)
- Canonical SHA-256 record hashing engine (`eventId`, `eventType`, `timestamp`, `location`, `status`).

#### [NEW] [`backend/services/blockchainService.js`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/backend/services/blockchainService.js)
- Ethers.js v6 provider initialized with `https://testnetrpc.mstblockchain.com`.
- Handles proof submission, verification queries, and transaction receipt extraction. Includes automated MST Testnet simulation fallback mode when keys are unpopulated.

#### [NEW] [`backend/services/sosService.js`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/backend/services/sosService.js)
- Manages private SOS record lifecycle, ntfy emergency notification dispatch, hash generation, MST Testnet proof storage, and verification.

#### [NEW] [`backend/routes/sosRoutes.js`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/backend/routes/sosRoutes.js)
- API endpoints:
  - `POST /api/sos/trigger`
  - `GET /api/sos/proof/:eventId`
  - `POST /api/sos/verify`
  - `GET /api/sos/history`
  - `POST /api/sos/tamper/:eventId`

#### [NEW] [`backend/server.js`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/backend/server.js)
- Express server entry point.

---

### 3. Frontend Application & BridgeKey Integration

#### [NEW] [`index.html`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/index.html)
- Main landing page featuring SafeHer mission, quick emergency access, and navigation bar with BridgeKey Wallet Connect badge.

#### [NEW] [`home.html`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/home.html)
- Emergency SOS Control Center:
  - Large, simple, accessible **Emergency SOS** trigger button.
  - Live GPS acquisition badge.
  - Ntfy emergency alert notification status.
  - MST Testnet proof card showing Event ID, Transaction Hash, and direct `https://testnet.mstscan.com` MST Scan explorer link.
  - BridgeKey Wallet state selector (Gasless Backend Relay vs Connected BridgeKey Wallet).

#### [NEW] [`history.html`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/history.html)
- History & Proof Verification Hub:
  - List of past emergency events.
  - **Verify MST Proof** interactive button.
  - **Simulate Record Tampering** button for viva/judge demonstration.

#### [NEW] [`css/styles.css`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/css/styles.css)
- Clean, bold, ultra-accessible emergency theme (glassmorphic dark UI, vivid emergency red buttons, status pills, responsive layout).

#### [NEW] [`js/blockchain.js`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/js/blockchain.js)
- **BridgeKey Wallet Manager**:
  - Detects BridgeKey / Web3 provider (`window.ethereum`).
  - Connects wallet, checks `tMSTC` balance, handles MST Testnet chain switching (`0x5752c55`).
  - Generates MST Scan explorer URLs (`https://testnet.mstscan.com/tx/...`).

#### [NEW] [`js/emergency.js`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/js/emergency.js)
- Handles real browser Geolocation capture, ntfy dispatch, backend SOS payload POST, status feedback.

#### [NEW] [`js/history.js`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/js/history.js)
- Manages history list, verification requests, tamper testing UI.

#### [NEW] [`js/app.js`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/js/app.js)
- Shared UI components, navigation, toast notifications.

#### [NEW] [`README.md`](file:///c:/Users/INDU%20RANI/OneDrive/Desktop/safe%20her/README.md)
- Complete hackathon submission documentation:
  - Project summary & architecture diagram.
  - Track requirements compliance matrix.
  - MST Testnet contract address & sample transaction hash section.
  - BridgeKey integration guide.
  - Local setup & testnet deployment instructions.
  - Viva / Judge Q&A reference.

---

## Verification Plan

### Automated & Unit Tests
1. **Contract Compilation & Deployment Test**:
   - Compile `SafeHerSOS.sol` and test contract factory instantiation.
2. **Backend API Endpoints**:
   - `GET /` -> server health check.
   - `POST /api/sos/trigger` -> returns `eventId`, `recordHash`, `transactionHash`.
3. **Verification Logic Test**:
   - `POST /api/sos/verify` with authentic record -> returns `verified: true`.
   - `POST /api/sos/verify` with altered location -> returns `verified: false`.

### Manual & Interactive Verification
1. **BridgeKey Integration Test**:
   - Click "Connect BridgeKey Wallet" -> verify prompt opens -> confirm network switches to MST Testnet (Chain ID `91562037`).
2. **End-to-End SOS Triggering**:
   - Press SOS button -> verify real GPS coordinates grabbed -> verify emergency alert dispatched -> verify transaction hash returned with MST Scan link.
3. **Tamper Detection Demonstration**:
   - Go to History -> Click "Verify MST Proof" (`✅ Verified`) -> Click "Simulate Tamper" -> Re-verify (`⚠ Tamper Detected`).
