import express from "express";
import { createSOSRecord, verifySOSRecord, getAllSOSRecords, tamperSOSRecord } from "../services/sosService.js";
import { getSOSProof } from "../services/blockchainService.js";

const router = express.Router();

// Trigger a new SOS Emergency event
router.post("/trigger", async (req, res) => {
    try {
        const { location } = req.body;

        if (!location) {
            return res.status(400).json({
                success: false,
                message: "Location (latitude and longitude) is required"
            });
        }

        const result = await createSOSRecord({ location });

        res.status(201).json({
            success: true,
            message: "SOS active & MST Blockchain proof recorded",
            data: result
        });
    } catch (error) {
        console.error("SOS Trigger Error:", error);
        res.status(500).json({
            success: false,
            message: "SOS created, but blockchain proof encountered error: " + error.message
        });
    }
});

// Fetch proof details directly from MST Blockchain
router.get("/proof/:eventId", async (req, res) => {
    try {
        const proof = await getSOSProof(req.params.eventId);
        res.json({
            success: true,
            proof
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch proof from MST Blockchain"
        });
    }
});

// Verify record integrity against MST Blockchain stored hash
router.post("/verify", async (req, res) => {
    try {
        const record = req.body;

        if (!record || !record.eventId) {
            return res.status(400).json({
                success: false,
                message: "Valid record with eventId is required for verification"
            });
        }

        const result = await verifySOSRecord(record);

        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({
            success: false,
            message: "Verification failed: " + error.message
        });
    }
});

// Get list of all past SOS emergency events
router.get("/history", async (req, res) => {
    try {
        const history = await getAllSOSRecords();
        res.json({
            success: true,
            count: history.length,
            history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch SOS history"
        });
    }
});

// Helper route for Viva / Judge demonstration: Tamper record data to show verification failure
router.post("/tamper/:eventId", async (req, res) => {
    try {
        const tampered = await tamperSOSRecord(req.params.eventId);
        if (!tampered) {
            return res.status(404).json({ success: false, message: "Event ID not found" });
        }
        res.json({
            success: true,
            message: "Record modified locally for tamper detection testing!",
            record: tampered
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
