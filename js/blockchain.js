/**
 * SafeHer Blockchain & BridgeKey Wallet Manager
 * Standalone browser script (Compatible with file:// and http://)
 * Supports MST Testnet (Chain ID: 91562037 / 0x5752c55 hex)
 */

window.MST_TESTNET_CONFIG = {
  chainId: "0x5752c55", // 91562037 in hex
  chainName: "MST Testnet",
  nativeCurrency: {
    name: "tMSTC",
    symbol: "tMSTC",
    decimals: 18
  },
  rpcUrls: ["https://testnetrpc.mstblockchain.com"],
  blockExplorerUrls: ["https://testnet.mstscan.com"]
};

window.currentAccount = null;

/**
 * Initialize BridgeKey / Web3 Wallet Connection Listener
 */
window.initWallet = function() {
  const walletBtn = document.getElementById("walletConnectBtn");
  if (!walletBtn) return;

  walletBtn.addEventListener("click", async () => {
    if (window.currentAccount) {
      window.disconnectWallet();
    } else {
      await window.connectBridgeKeyWallet();
    }
  });

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        window.disconnectWallet();
      } else {
        window.currentAccount = accounts[0];
        window.updateWalletUI(window.currentAccount);
      }
    });

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  }
};

/**
 * Connect BridgeKey Wallet & Switch to MST Testnet
 */
window.connectBridgeKeyWallet = async function() {
  const walletBtn = document.getElementById("walletConnectBtn");
  if (walletBtn) walletBtn.textContent = "Connecting...";

  if (!window.ethereum) {
    alert("BridgeKey Wallet not detected!\n\nPlease install the official BridgeKey extension or app to connect your wallet:\nhttps://bridgekey.io");
    if (walletBtn) walletBtn.textContent = "🦊 Connect BridgeKey Wallet";
    return null;
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    window.currentAccount = accounts[0];

    await window.switchToMSTTestnet();

    window.updateWalletUI(window.currentAccount);
    return window.currentAccount;
  } catch (error) {
    console.error("BridgeKey connection error:", error);
    alert("Wallet connection cancelled or failed: " + error.message);
    if (walletBtn) walletBtn.textContent = "🦊 Connect BridgeKey Wallet";
    return null;
  }
};

window.switchToMSTTestnet = async function() {
  if (!window.ethereum) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: window.MST_TESTNET_CONFIG.chainId }]
    });
  } catch (switchError) {
    if (switchError.code === 4902 || switchError.message?.includes("Unrecognized chain")) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [window.MST_TESTNET_CONFIG]
        });
      } catch (addError) {
        console.error("Could not add MST Testnet to wallet:", addError);
      }
    }
  }
};

window.updateWalletUI = function(account) {
  const walletBtn = document.getElementById("walletConnectBtn");
  if (!walletBtn) return;

  if (account) {
    const shortAcc = account.slice(0, 6) + "..." + account.slice(-4);
    walletBtn.textContent = `⚡ ${shortAcc}`;
    walletBtn.classList.add("connected");
  } else {
    walletBtn.textContent = "🦊 Connect BridgeKey Wallet";
    walletBtn.classList.remove("connected");
  }
};

window.disconnectWallet = function() {
  window.currentAccount = null;
  window.updateWalletUI(null);
};

window.getMSTScanTxUrl = function(txHash) {
  if (!txHash) return "https://testnet.mstscan.com";
  return `https://testnet.mstscan.com/tx/${txHash}`;
};
