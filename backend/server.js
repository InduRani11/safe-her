import express from "express";
import cors from "cors";
import "dotenv/config";
import sosRoutes from "./routes/sosRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/sos", sosRoutes);
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "SafeHer Blockchain Backend",
        network: "MST Testnet (Chain ID 91562037)",
        rpcUrl: process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com",
        contractAddress: process.env.SAFEHER_CONTRACT_ADDRESS || "Pending Configuration",
        status: "RUNNING"
    });
});

app.listen(PORT, () => {
    console.log("==================================================");
    console.log(`🚀 SafeHer Blockchain Server active on port ${PORT}`);
    console.log(`   Network Target: MST Testnet (${process.env.MST_RPC_URL || "https://testnetrpc.mstblockchain.com"})`);
    console.log(`   API Endpoint:   http://localhost:${PORT}/api/sos`);
    console.log("==================================================");
});
