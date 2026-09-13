import crypto from "crypto";
import { generateRecordHash, hashToBytes32 } from "./hashService.js";
import { recordSOSProof, getSOSProof } from "./blockchainService.js";

// In-Memory Database Store for SOS Emergency Records
const sosDatabase = new Map();

let sosSequence = 0;

/**
 * Dispatch Telegram Bot Emergency SOS Alert with MST Contract Address & Explorer Links
 */
async function sendTelegramSOSAlert({ phone, location, eventId, contractAddress, transactionHash, recordHash, explorerUrl }) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || "8339300150:AAH_fsxUkhl-qmkF_c9SSb9SJg2NfMacjtw";
    const chatId = process.env.TELEGRAM_CHAT_ID || "8621629999";

    if (!botToken || !chatId) return;

    const mapUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const targetContract = contractAddress || process.env.SAFEHER_CONTRACT_ADDRESS || "0x18b73EA9BA16C50620A5a6E5F891B42890134CdA";
    const contractUrl = `https://testnet.mstscan.com/address/${targetContract}`;
    const txUrl = explorerUrl || `https://testnet.mstscan.com/tx/${transactionHash}`;

    const text = `🚨 <b>SAFEHER EMERGENCY SOS ALERT</b> 🚨

<b>👤 Emergency Contact:</b> ${phone}
<b>📍 GPS Location:</b> Lat <code>${location.latitude}</code>, Long <code>${location.longitude}</code>
<b>🗺️ Google Maps:</b> <a href="${mapUrl}">${mapUrl}</a>
<b>🆔 Event ID:</b> <code>${eventId}</code>
<b>⏰ Time:</b> ${new Date().toLocaleString("en-IN")}

<b>⛓️ MST BLOCKCHAIN PROOF & ADDRESS:</b>
<b>• MST Contract Address:</b> <code>${targetContract}</code>
<b>• Contract Page:</b> <a href="${contractUrl}">View MST Contract Page</a>
<b>• Transaction Explorer Page:</b> <a href="${txUrl}">View MST Transaction Page</a>
<b>• Tx Hash:</b> <code>${transactionHash}</code>
<b>• SHA-256 Fingerprint:</b> <code>${recordHash}</code>

<i>🔒 Tamper-evident proof anchored on MST Testnet (Chain ID 91562037). Tap links above to view directly on MST Scan.</i>`;

    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: "HTML",
                disable_web_page_preview: false
            })
        });
        console.log("✅ Telegram SOS Alert with MST Address & Tx Link delivered to Telegram!");
    } catch (err) {
        console.warn("Telegram alert error:", err.message);
    }
}

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

    const phone = process.env.EMERGENCY_CONTACT_PHONE || "+917061330201";

    // 1. Save private record locally
    sosDatabase.set(eventId, { ...sosRecord });

    // 2. Generate SHA-256 cryptographic fingerprint
    const recordHash = generateRecordHash(sosRecord);

    // 3. Submit proof hash to MST Blockchain
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

    // 4. Dispatch immediate emergency notification via ntfy.sh
    try {
        const topic = process.env.NTFY_TOPIC || "7061330201";
        const mapUrl = `https://maps.google.com/?q=${sosRecord.location.latitude},${sosRecord.location.longitude}`;
        const txUrl = blockchainProof.explorerUrl || `https://testnet.mstscan.com/address/${process.env.SAFEHER_CONTRACT_ADDRESS}`;
        const messageBody = `🚨 EMERGENCY SOS ALERT!\nContact Number: ${phone}\nLocation: Lat ${sosRecord.location.latitude}, Long ${sosRecord.location.longitude}\nGoogle Maps: ${mapUrl}\nMST Contract: ${process.env.SAFEHER_CONTRACT_ADDRESS}\nMST Tx Page: ${txUrl}\nEvent ID: ${eventId}\nTime: ${new Date().toLocaleTimeString()}`;

        const headers = {
            "Title": `SafeHer SOS Alert for ${phone}`,
            "Priority": "5",
            "Tags": "warning,emergency,phone,rotating_light",
            "Click": txUrl
        };

        fetch(`https://ntfy.sh/${topic}`, { method: "POST", body: messageBody, headers }).catch(err => console.log("Ntfy send log:", err.message));
    } catch (e) {
        console.warn("Ntfy alert error:", e.message);
    }

    // 5. Dispatch Telegram SOS Alert with MST Contract Address & MST Transaction Page link
    sendTelegramSOSAlert({
        phone,
        location: sosRecord.location,
        eventId,
        contractAddress: process.env.SAFEHER_CONTRACT_ADDRESS,
        transactionHash: blockchainProof.transactionHash,
        recordHash,
        explorerUrl: blockchainProof.explorerUrl
    }).catch(err => console.warn("Telegram dispatch error:", err.message));

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
