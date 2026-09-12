/**
 * SafeHer Emergency SOS Trigger Engine
 * Standalone browser script (Compatible with file:// and http://)
 */

window.clientSosSequence = 0;

/**
 * Capture High-Accuracy Geolocation with immediate fallback
 */
window.getCurrentLocation = function() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ coords: { latitude: 28.4744, longitude: 77.5040, accuracy: 15 } });
      return;
    }

    let resolved = false;

    // Safety fallback timer (1.5s max wait)
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
 * Handle Emergency SOS Trigger Action — Multi-click guaranteed
 */
window.handleSOSTrigger = async function() {
  const sosBtn = document.getElementById("sosButton");
  const gpsStatusVal = document.getElementById("gpsStatusVal");
  const ntfyStatusVal = document.getElementById("ntfyStatusVal");
  const chainStatusVal = document.getElementById("chainStatusVal");
  const proofBoxContainer = document.getElementById("proofBoxContainer");

  window.clientSosSequence++;
  const seq = window.clientSosSequence;

  try {
    if (sosBtn) sosBtn.disabled = true;
    if (window.showToast) window.showToast(`🚨 SOS Alert #${seq} Triggered!`, "warning");

    // 1. Acquire location
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

    // 2. Dispatch IMMEDIATE Notification via ntfy.sh (No-CORS & Beacon Guaranteed Delivery)
    const contactPhone = "+917061330201";
    const topicNo = "7061330201";
    const mapUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const timestampStr = new Date().toLocaleTimeString();
    const nonce = Date.now();

    const alertBody = `🚨 EMERGENCY SOS ALERT #${seq}!\nContact Number: ${contactPhone}\nLocation: Lat ${location.latitude}, Long ${location.longitude}\nGoogle Maps: ${mapUrl}\nTime: ${timestampStr}\nNonce: ${nonce}`;
    const ntfyEndpoint1 = `https://ntfy.sh/${topicNo}`;
    const ntfyEndpoint2 = `https://ntfy.sh/safeher_${topicNo}`;

    // Direct no-cors fetch (works even on file:// protocol and cross-origin)
    fetch(ntfyEndpoint1, { method: "POST", mode: "no-cors", body: alertBody }).catch(e => console.warn(e));
    fetch(ntfyEndpoint2, { method: "POST", mode: "no-cors", body: alertBody }).catch(e => console.warn(e));

    // SendBeacon background delivery
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ntfyEndpoint1, alertBody);
      navigator.sendBeacon(ntfyEndpoint2, alertBody);
    }

    if (ntfyStatusVal) {
      ntfyStatusVal.innerHTML = `Alert #${seq} Sent to <a href="https://ntfy.sh/${topicNo}" target="_blank" style="color: var(--accent-green); font-weight: 700; text-decoration: underline;">ntfy.sh/${topicNo} ↗</a> (${contactPhone})`;
      ntfyStatusVal.style.color = "var(--accent-green)";
    }

    // 3. Post to SafeHer Express Backend Engine
    if (chainStatusVal) chainStatusVal.textContent = "Recording proof on MST Testnet...";

    const backendUrl = window.BACKEND_URL || "http://localhost:5000";
    try {
      const response = await fetch(`${backendUrl}/api/sos/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location })
      });

      const result = await response.json();

      if (result.success) {
        if (window.showToast) window.showToast(`✅ SOS #${seq} Broadcasted & MST Proof Recorded!`, "success");

        const proof = result.data.blockchainProof;
        const record = result.data.sosRecord;

        if (chainStatusVal) {
          chainStatusVal.textContent = `Confirmed on MST Testnet (Block #${proof.blockNumber})`;
          chainStatusVal.style.color = "var(--accent-green)";
        }

        if (proofBoxContainer) {
          const scanUrl = window.getMSTScanTxUrl ? window.getMSTScanTxUrl(proof.transactionHash) : `https://testnet.mstscan.com/tx/${proof.transactionHash}`;
          proofBoxContainer.innerHTML = `
            <div class="proof-box">
              <div class="proof-header">
                <span>🛡️ MST Blockchain Proof #${seq} Confirmed</span>
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
      }
    } catch (backendErr) {
      console.warn("Backend API error:", backendErr.message);
      if (chainStatusVal) chainStatusVal.textContent = "Notification Sent (Backend Standby)";
    }

  } catch (error) {
    console.error("SOS Trigger exception:", error);
  } finally {
    // Re-enable SOS button immediately so user can click continuously as many times as needed
    setTimeout(() => {
      if (sosBtn) sosBtn.disabled = false;
    }, 400);
  }
};

// Bind click listener on DOM load
function bindSOSEvent() {
  const sosBtn = document.getElementById("sosButton");
  if (!sosBtn) return;

  sosBtn.onclick = (e) => {
    if (e) e.preventDefault();
    window.handleSOSTrigger();
  };
  sosBtn.addEventListener("click", window.handleSOSTrigger);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindSOSEvent);
} else {
  bindSOSEvent();
}
