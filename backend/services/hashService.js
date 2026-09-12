import crypto from "crypto";

/**
 * Generates a SHA-256 canonical hash fingerprint of the private SOS record.
 * @param {Object} record - Private SOS emergency record.
 * @returns {string} SHA-256 hex string digest.
 */
export function generateRecordHash(record) {
    const canonicalRecord = JSON.stringify({
        eventId: record.eventId,
        eventType: record.eventType,
        timestamp: record.timestamp,
        location: record.location,
        status: record.status
    });

    return crypto
        .createHash("sha256")
        .update(canonicalRecord)
        .digest("hex");
}

/**
 * Formats a hex string into EVM bytes32 standard (0x prefixed).
 * @param {string} hash - Hex hash string.
 * @returns {string} 0x prefixed hex string.
 */
export function hashToBytes32(hash) {
    return hash.startsWith("0x") ? hash : "0x" + hash;
}
