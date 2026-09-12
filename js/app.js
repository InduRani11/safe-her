/**
 * SafeHer Global Application Utilities
 * Standalone browser script
 */

window.BACKEND_URL = "http://localhost:5000";

function initAppGlobal() {
  if (window.initWallet) {
    window.initWallet();
  }
  window.checkBackendHealth();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAppGlobal);
} else {
  initAppGlobal();
}

window.checkBackendHealth = async function() {
  const networkBadge = document.getElementById("networkBadge");
  if (!networkBadge) return;

  try {
    const res = await fetch(`${window.BACKEND_URL}/`);
    const data = await res.json();
    if (data.success) {
      networkBadge.innerHTML = `<span class="dot pulse"></span> Network: ${data.network || "MST Testnet"}`;
    }
  } catch (err) {
    networkBadge.innerHTML = `<span class="dot" style="background: #00e676;"></span> Network: MST Testnet (Chain ID 91562037)`;
  }
};

window.showToast = function(message, type = "info") {
  let toast = document.getElementById("safeher-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "safeher-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: rgba(18, 26, 43, 0.95);
      border: 1px solid var(--accent-blue);
      color: #fff;
      padding: 0.85rem 1.25rem;
      border-radius: 8px;
      z-index: 9999;
      font-weight: 600;
      box-shadow: 0 5px 20px rgba(0,0,0,0.5);
      transition: all 0.3s ease;
    `;
    document.body.appendChild(toast);
  }

  if (type === "success") toast.style.borderColor = "var(--accent-green)";
  if (type === "error") toast.style.borderColor = "var(--accent-red)";
  if (type === "warning") toast.style.borderColor = "var(--accent-gold)";

  toast.textContent = message;
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 4000);
};
