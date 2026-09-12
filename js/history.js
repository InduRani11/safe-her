/**
 * SafeHer SOS History & Proof Verification Hub
 * Standalone browser script
 */

function initHistoryPage() {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;
  window.loadSOSHistory();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHistoryPage);
} else {
  initHistoryPage();
}

window.loadSOSHistory = async function() {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;

  historyList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading emergency events...</div>`;

  const backendUrl = window.BACKEND_URL || "http://localhost:5000";

  try {
    const res = await fetch(`${backendUrl}/api/sos/history`);
    const data = await res.json();

    if (!data.success || data.history.length === 0) {
      historyList.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 3rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;">No Emergency Events Recorded Yet</p>
          <p style="font-size: 0.9rem;">Go to the <a href="home.html" style="color: var(--accent-blue);">Home Page</a> and press the SOS button to create an event.</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = "";
    data.history.forEach((record) => {
      const card = createHistoryCard(record);
      historyList.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load history:", err);
    historyList.innerHTML = `
      <div style="text-align: center; color: var(--accent-red); padding: 2rem;">
        Failed to connect to backend server. Make sure node backend is running on http://localhost:5000
      </div>
    `;
  }
};

function createHistoryCard(record) {
  const card = document.createElement("div");
  card.className = "history-card";
  card.id = `card-${record.eventId}`;

  const dateStr = new Date(record.timestamp).toLocaleString();
  const txHash = record.blockchain?.transactionHash || "N/A";
  const scanUrl = window.getMSTScanTxUrl ? window.getMSTScanTxUrl(txHash) : `https://testnet.mstscan.com/tx/${txHash}`;

  card.innerHTML = `
    <div class="history-card-top">
      <span class="event-id-badge">🚨 ${record.eventId}</span>
      <span class="timestamp">📅 ${dateStr}</span>
    </div>

    <div class="history-details">
      <div>
        <span class="proof-label">Status</span>
        <div style="font-weight: 700; color: ${record.tampered ? 'var(--accent-red)' : 'var(--accent-green)'};">
          ${record.tampered ? '⚠️ TAMPERED LOCAL RECORD' : 'ACTIVE EMERGENCY'}
        </div>
      </div>
      <div>
        <span class="proof-label">Location (GPS)</span>
        <div style="font-family: monospace;">Lat: ${record.location.latitude}, Long: ${record.location.longitude}</div>
      </div>
    </div>

    <div class="proof-row">
      <span class="proof-label">SHA-256 Record Hash (Fingerprint)</span>
      <span class="proof-value">${record.recordHash || 'N/A'}</span>
    </div>

    <div class="proof-row">
      <span class="proof-label">MST Testnet Transaction Hash</span>
      <span class="proof-value">${txHash}</span>
    </div>

    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.5rem; align-items: center;">
      <button class="btn-action btn-verify" data-id="${record.eventId}">
        🛡️ Verify MST Blockchain Proof
      </button>

      <button class="btn-warning btn-tamper" data-id="${record.eventId}">
        ⚠️ Simulate Tamper
      </button>

      <a href="${scanUrl}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="font-size: 0.85rem; padding: 0.5rem 0.85rem;">
        Explorer ↗
      </a>
    </div>

    <div class="verify-output" id="output-${record.eventId}" style="display: none;"></div>
  `;

  const verifyBtn = card.querySelector(".btn-verify");
  const tamperBtn = card.querySelector(".btn-tamper");

  verifyBtn.addEventListener("click", () => verifyProof(record));
  tamperBtn.addEventListener("click", () => tamperRecord(record.eventId));

  return card;
}

async function verifyProof(record) {
  const outputDiv = document.getElementById(`output-${record.eventId}`);
  if (!outputDiv) return;

  outputDiv.style.display = "block";
  outputDiv.className = "verify-output";
  outputDiv.textContent = "Verifying against MST Blockchain smart contract...";

  const backendUrl = window.BACKEND_URL || "http://localhost:5000";

  try {
    const res = await fetch(`${backendUrl}/api/sos/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    });

    const data = await res.json();
    const result = data.result;

    if (result && result.verified) {
      outputDiv.className = "verify-output success";
      outputDiv.innerHTML = `
        ✅ <strong>MST BLOCKCHAIN PROOF VERIFIED MATCH</strong><br>
        • On-Chain Hash: <code>${result.storedHash}</code><br>
        • Re-calculated Record Hash: <code>0x${result.calculatedHash}</code><br>
        • Integrity Status: <strong>100% Intact & Unmodified</strong>
      `;
      if (window.showToast) window.showToast("✅ Record verified successfully on MST Blockchain!", "success");
    } else {
      outputDiv.className = "verify-output failed";
      outputDiv.innerHTML = `
        ⚠️ <strong>PROOF VERIFICATION MISMATCH DETECTED!</strong><br>
        • On-Chain Hash: <code>${result.storedHash || 'None'}</code><br>
        • Current Record Hash: <code>0x${result.calculatedHash}</code><br>
        • Integrity Status: <strong>TAMPERED / MODIFIED RECORD</strong>
      `;
      if (window.showToast) window.showToast("⚠️ Alert: Record data has been modified!", "error");
    }
  } catch (err) {
    console.error("Verification error:", err);
    outputDiv.className = "verify-output failed";
    outputDiv.textContent = "Verification unavailable. Check backend connection.";
  }
}

async function tamperRecord(eventId) {
  const backendUrl = window.BACKEND_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${backendUrl}/api/sos/tamper/${eventId}`, {
      method: "POST"
    });
    const data = await res.json();

    if (data.success) {
      if (window.showToast) window.showToast("⚠️ Record coordinates modified! Now click 'Verify MST Blockchain Proof' to test verification.", "warning");
      await window.loadSOSHistory();
    }
  } catch (err) {
    if (window.showToast) window.showToast("Tamper error: " + err.message, "error");
  }
}
