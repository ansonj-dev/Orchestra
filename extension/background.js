// extension/background.js - Service Worker for Orchestra WebMCP Marketplace
// Handles lifecycle, wallet buffers, circuit breakers, and cross-context messaging.

const DEFAULT_TOOLS = [
  'shopify_checkout_fast',
  'extract_analytics_table',
  'margin_context_editor'
];

// 1. Initialize Extension State on Install
chrome.runtime.onInstalled.addListener(() => {
  console.log("⚡ Orchestra WebMCP Background Service Worker Activated.");
  
  chrome.storage.local.get(["activeWalletBalance", "enabledTools"], (data) => {
    chrome.storage.local.set({
      activeWalletBalance: data.activeWalletBalance ?? 100.00,
      sessionAuthenticated: true,
      enabledTools: data.enabledTools ?? DEFAULT_TOOLS,
      executionLogs: []
    });
  });
});

// 2. Centralized Messaging Pipeline
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // A. Sync from Next.js Marketplace Web App
  if (request.type === "ORCHESTRA_MARKETPLACE_SYNC") {
    const { walletBalance, tools } = request.payload;
    
    chrome.storage.local.set({
      activeWalletBalance: parseFloat(walletBalance),
      enabledTools: Array.isArray(tools) ? tools : []
    }, () => {
      console.log(`🔄 Marketplace state synchronized. Balance: ${walletBalance} CR. Tools: ${tools.length}`);
      sendResponse({ status: "SUCCESS", message: "Extension storage synchronized." });
    });
    return true;
  }

  // B. Verification Query from Client Content Script (content.js)
  if (request.type === "CHECK_TOOL_AUTHORIZATION") {
    const { targetToolName } = request.payload;
    
    chrome.storage.local.get(["activeWalletBalance", "enabledTools"], (data) => {
      const balance = data.activeWalletBalance ?? 100.00;
      const tools = data.enabledTools ?? DEFAULT_TOOLS;
      const isAuthorized = tools.includes(targetToolName);
      const hasFunds = balance > 0;
      
      if (isAuthorized && hasFunds) {
        sendResponse({ allowed: true, currentBalance: balance });
      } else {
        sendResponse({ 
          allowed: false, 
          reason: !hasFunds ? "Wallet depleted (Circuit Breaker Triggered)" : "Tool not activated in Orchestra marketplace" 
        });
      }
    });
    return true;
  }
  
  // C. Real-Time Deduction Notification from Content Scripts
  if (request.type === "NOTIFY_CREDIT_DEDUCTION") {
    const { toolName, cost, args, resultSummary } = request.payload;
    
    chrome.storage.local.get(["activeWalletBalance", "executionLogs"], (data) => {
      const currentBalance = data.activeWalletBalance ?? 100.00;
      const deduction = parseFloat(cost) || 0.10;
      const newBalance = Math.max(0, parseFloat((currentBalance - deduction).toFixed(4)));
      
      const newLog = {
        id: "tx_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toISOString(),
        toolName,
        cost: deduction,
        remainingBalance: newBalance,
        status: newBalance <= 0 ? "CIRCUIT_BREAKER_DEPLETED" : "EXECUTED",
        resultSummary: resultSummary || "Execution completed successfully"
      };

      const updatedLogs = [newLog, ...(data.executionLogs || [])].slice(0, 50);

      chrome.storage.local.set({ 
        activeWalletBalance: newBalance,
        executionLogs: updatedLogs
      }, () => {
        console.log(`🪙 Micro-billing Event. Tool: ${toolName} (-${deduction} CR). New Balance: ${newBalance} CR`);
        sendResponse({ success: true, updatedLocalBalance: newBalance, log: newLog });
      });
    });
    return true;
  }

  // D. Query Full Extension State (used by Popup UI)
  if (request.type === "GET_EXTENSION_STATE") {
    chrome.storage.local.get(["activeWalletBalance", "enabledTools", "executionLogs"], (data) => {
      sendResponse({
        balance: data.activeWalletBalance ?? 100.00,
        tools: data.enabledTools ?? DEFAULT_TOOLS,
        logs: data.executionLogs ?? []
      });
    });
    return true;
  }

  // E. Manual Credit Top-Up (from Popup)
  if (request.type === "REFILL_CREDITS") {
    const { amount } = request.payload;
    chrome.storage.local.get(["activeWalletBalance"], (data) => {
      const updated = parseFloat(((data.activeWalletBalance ?? 0) + parseFloat(amount)).toFixed(2));
      chrome.storage.local.set({ activeWalletBalance: updated }, () => {
        sendResponse({ success: true, balance: updated });
      });
    });
    return true;
  }
});
