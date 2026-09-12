import crypto from "crypto";
import { generateRecordHash, hashToBytes32 } from "./hashService.js";
import { recordSOSProof, getSOSProof } from "./blockchainService.js";

// In-Memory Database Store for SOS Emergency Records
const sosDatabase = new Map();

let sosSequence = 0;

/**
 * Creates a new private SOS record, dispatches immediate emergency alert,
 * generates canonical hash, and commits proof to MST Blockchain.
 */
export async function createSOSRecord(data) {
    sosSequence++;
    const eventId = "sos-" + crypto.randomUUID().slice(0, 8);
    const timestamp = new Date().toISOString();

    const sosRecord = {
        eventId,
        eventType: "SOS_TRIGGERED",
        timestamp,
        location: {
            latitude: data.location?.latitude || 28.4744,
            longitude: data.location?.longitude || 77.5040,
            accuracy: data.location?.accuracy || 10
        },
        status: "ACTIVE"
    };

    // 1. Dispatch immediate emergency notification via ntfy.sh to phone contact topic 7061330201
    try {
        const phone = process.env.EMERGENCY_CONTACT_PHONE || "+917061330201";
        const topic = process.env.NTFY_TOPIC || "7061330201";
        const mapUrl = `https://maps.google.com/?q=${sosRecord.location.latitude},${sosRecord.location.longitude}`;
        const messageBody = `🚨 EMERGENCY SOS ALERT #${sosSequence}\nContact Number: ${phone}\nLocation: Lat ${sosRecord.location.latitude}, Long ${sosRecord.location.longitude}\nGoogle Maps: ${mapUrl}\nEvent ID: ${eventId}\nTime: ${new Date().toLocaleTimeString()}`;

        const headers = {
            "Title": `SafeHer SOS Alert #${sosSequence} for ${phone}`,
            "Priority": "5",
            "Tags": "warning,emergency,phone,rotating_light",
            "Click": mapUrl
        };

        // Post to primary topic (7061330201)
        fetch(`https://ntfy.sh/${topic}`, { method: "POST", body: messageBody, headers }).catch(err => console.log("Ntfy topic 1 send:", err.message));
        // Post to fallback topic (safeher_7061330201)
        fetch(`https://ntfy.sh/safeher_${topic}`, { method: "POST", body: messageBody, headers }).catch(err => console.log("Ntfy topic 2 send:", err.message));
    } catch (e) {
        console.warn("Ntfy alert error:", e.message);
    }

    // 2. Save private record locally
    sosDatabase.set(eventId, { ...sosRecord });

    // 3. Generate SHA-256 cryptographic fingerprint
    const recordHash = generateRecordHash(sosRecord);

    // 4. Submit proof hash to MST Blockchain
    let blockchainProof;
    try {
        blockchainProof = await recordSOSProof(eventId, recordHash);
    } catch (error) {
        console.error("Blockchain proof recording error:", error);
        blockchainProof = {
            status: "FAILED",
            error: error.message
        };
    }

    // Update local database record with blockchain proof metadata
    const finalRecord = {
        ...sosRecord,
        recordHash,
        blockchain: blockchainProof
    };
    sosDatabase.set(eventId, finalRecord);

    return {
        sosRecord: finalRecord,
        blockchainProof
    };
}

/**
 * Verifies whether a given SOS record matches the recorded proof on MST Blockchain.
 */
export async function verifySOSRecord(recordInput) {
    const eventId = recordInput.eventId;

    // Generate hash directly from recordInput to verify if input data matches on-chain proof
    const calculatedHash = generateRecordHash(recordInput);
    const expectedHashBytes = hashToBytes32(calculatedHash).toLowerCase();

    const blockchainProof = await getSOSProof(eventId);
    const storedHash = (blockchainProof.recordHash || "").toLowerCase();

    const isVerified = blockchainProof.exists && storedHash === expectedHashBytes;

    return {
        eventId,
        verified: isVerified,
        calculatedHash,
        storedHash: blockchainProof.recordHash,
        blockchainTimestamp: blockchainProof.timestamp,
        recorder: blockchainProof.recorder,
        exists: blockchainProof.exists,
        integrityStatus: isVerified ? "INTACT" : "TAMPERED_OR_NOT_FOUND"
    };
}

/**
 * Returns all stored SOS emergency records for History page.
 */
export async function getAllSOSRecords() {
    return Array.from(sosDatabase.values()).reverse();
}

/**
 * Helper function for Viva / Demo testing: intentionally alters location of a record to prove tamper detection!
 */
export async function tamperSOSRecord(eventId) {
    const record = sosDatabase.get(eventId);
    if (!record) return null;

    // Mutate location slightly to cause SHA-256 hash mismatch
    record.location.latitude = Number((record.location.latitude + 0.005).toFixed(6));
    record.location.longitude = Number((record.location.longitude + 0.005).toFixed(6));
    record.tampered = true;

    sosDatabase.set(eventId, record);
    return record;
}
