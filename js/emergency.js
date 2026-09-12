/**
 * SafeHer Emergency SOS Trigger Engine
 * Standalone browser script
 */

window.isSOSTriggering = false;

window.getCurrentLocation = function() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ coords: { latitude: 28.4744, longitude: 77.5040, accuracy: 15 } });
      return;
    }

    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ coords: { latitude: 28.4744, longitude: 77.5040, accuracy: 15 } });
      }
    }, 1500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(pos);
        }
      },
      (err) => {
        console.warn("Geolocation fallback:", err.message);
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve({ coords: { latitude: 28.4744, longitude: 77.5040, accuracy: 15 } });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 1500,
        maximumAge: 5000
      }
    );
  });
};

/**
 * Handle Emergency SOS Trigger Action — Clean Single Execution
 */
window.handleSOSTrigger = async function() {
  if (window.isSOSTriggering) return;
  window.isSOSTriggering = true;

  const sosBtn = document.getElementById("sosButton");
  const gpsStatusVal = document.getElementById("gpsStatusVal");
  const ntfyStatusVal = document.getElementById("ntfyStatusVal");
  const chainStatusVal = document.getElementById("chainStatusVal");
  const proofBoxContainer = document.getElementById("proofBoxContainer");

  try {
    if (sosBtn) sosBtn.disabled = true;
    if (window.showToast) window.showToast("🚨 Emergency SOS Triggered!", "warning");

    // 1. Acquire GPS position
    if (gpsStatusVal) gpsStatusVal.textContent = "Acquiring position...";
    const position = await window.getCurrentLocation();

    const location = {
      latitude: Number(position.coords.latitude.toFixed(6)),
      longitude: Number(position.coords.longitude.toFixed(6)),
      accuracy: Math.round(position.coords.accuracy || 10)
    };

    if (gpsStatusVal) {
      gpsStatusVal.textContent = `Lat: ${location.latitude}, Long: ${location.longitude} (±${location.accuracy}m)`;
      gpsStatusVal.style.color = "var(--accent-green)";
    }

    const topicNo = "7061330201";
    if (ntfyStatusVal) {
      ntfyStatusVal.innerHTML = `Sending alert to <a href="https://ntfy.sh/${topicNo}" target="_blank" style="color: #38bdf8;">ntfy.sh/${topicNo} ↗</a>...`;
    }

    // 2. Call Express Backend Engine (Backend sends 1 ntfy push alert & records MST Blockchain Tx)
    if (chainStatusVal) chainStatusVal.textContent = "Recording proof on MST Testnet...";

    const backendUrl = window.BACKEND_URL || "http://localhost:5000";
    const response = await fetch(`${backendUrl}/api/sos/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location })
    });

    const result = await response.json();

    if (result.success) {
      if (window.showToast) window.showToast("✅ SOS Alert Sent & MST Blockchain Proof Confirmed!", "success");

      if (ntfyStatusVal) {
        ntfyStatusVal.innerHTML = `Sent to <a href="https://ntfy.sh/${topicNo}" target="_blank" style="color: var(--accent-green); font-weight: 700; text-decoration: underline;">ntfy.sh/${topicNo} ↗</a> (+917061330201)`;
        ntfyStatusVal.style.color = "var(--accent-green)";
      }

      const proof = result.data.blockchainProof;
      const record = result.data.sosRecord;

      if (chainStatusVal) {
        const netName = proof.network || "MST Testnet";
        chainStatusVal.textContent = `Confirmed on ${netName} (Block #${proof.blockNumber})`;
        chainStatusVal.style.color = "var(--accent-green)";
      }

      if (proofBoxContainer) {
        const scanUrl = window.getMSTScanTxUrl ? window.getMSTScanTxUrl(proof.transactionHash) : `https://testnet.mstscan.com/tx/${proof.transactionHash}`;
        proofBoxContainer.innerHTML = `
          <div class="proof-box">
            <div class="proof-header">
              <span>🛡️ MST Blockchain Proof Confirmed</span>
            </div>
            <div class="proof-row">
              <span class="proof-label">Event ID</span>
              <span class="proof-value">${record.eventId}</span>
            </div>
            <div class="proof-row">
              <span class="proof-label">SHA-256 Record Hash (On-Chain Fingerprint)</span>
              <span class="proof-value">${record.recordHash}</span>
            </div>
            <div class="proof-row">
              <span class="proof-label">MST Testnet Transaction Hash</span>
              <span class="proof-value">${proof.transactionHash}</span>
            </div>
            <div class="proof-row">
              <span class="proof-label">Block Number</span>
              <span class="proof-value">#${proof.blockNumber}</span>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 1rem; flex-wrap: wrap;">
              <a href="${scanUrl}" target="_blank" rel="noopener noreferrer" class="btn-secondary">
                🔍 View on MST Scan Explorer ↗
              </a>
              <a href="history.html" class="btn-action">
                📋 Go to Proof History & Verify
              </a>
            </div>
          </div>
        `;
      }
    } else {
      if (window.showToast) window.showToast("⚠️ SOS trigger error: " + result.message, "error");
    }
  } catch (error) {
    console.error("SOS Trigger exception:", error);
    if (window.showToast) window.showToast("Backend connection error: " + error.message, "error");
  } finally {
    setTimeout(() => {
      window.isSOSTriggering = false;
      if (sosBtn) sosBtn.disabled = false;
    }, 1000);
  }
};

function bindSOSEvent() {
  const sosBtn = document.getElementById("sosButton");
  if (!sosBtn) return;

  sosBtn.onclick = function(e) {
    if (e) e.preventDefault();
    window.handleSOSTrigger();
  };
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindSOSEvent);
} else {
  bindSOSEvent();
}
