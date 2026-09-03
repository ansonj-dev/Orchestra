// extension/popup.js - Handles Popup UI state and interactions

document.addEventListener("DOMContentLoaded", () => {
  const walletDisplay = document.getElementById("wallet-display");
  const toolList = document.getElementById("tool-list");
  const toolCount = document.getElementById("tool-count");
  const btnRefill = document.getElementById("btn-refill");
  const btnSync = document.getElementById("btn-sync");

  function refreshState() {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "GET_EXTENSION_STATE" }, (response) => {
        if (chrome.runtime.lastError || !response) return;

        const balance = parseFloat(response.balance || 100).toFixed(2);
        walletDisplay.innerHTML = `${balance} <span style="font-size:14px;color:#9ca3af;">CR</span>`;

        const tools = response.tools || [];
        toolCount.textContent = `${tools.length} loaded`;

        if (tools.length === 0) {
          toolList.innerHTML = `<li class="tool-item" style="color:#9ca3af;justify-content:center;">No tools enabled. Visit Marketplace.</li>`;
        } else {
          toolList.innerHTML = tools.map(tool => `
            <li class="tool-item">
              <span class="tool-item-name">${tool}</span>
              <span class="tool-item-status">● Live</span>
            </li>
          `).join("");
        }
      });
    }
  }

  btnRefill.addEventListener("click", () => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "REFILL_CREDITS", payload: { amount: 50.00 } }, (res) => {
        if (res && res.success) {
          refreshState();
        }
      });
    }
  });

  btnSync.addEventListener("click", () => {
    btnSync.textContent = "Syncing...";
    if (typeof chrome !== "undefined" && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "ORCHESTRA_TRIGGER_SYNC" }, () => {
            setTimeout(() => {
              btnSync.textContent = "Synced!";
              setTimeout(() => { btnSync.textContent = "Sync Active Tab"; }, 1500);
            }, 300);
          });
        }
      });
    } else {
      setTimeout(() => { btnSync.textContent = "Synced!"; }, 300);
    }
    refreshState();
  });

  refreshState();
});
