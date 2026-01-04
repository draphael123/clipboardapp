// Clipboard Manager Background Service Worker
const MAX_ITEMS = 5000;
const STORAGE_KEY = 'clipboardItems';
const LAST_CLIPBOARD_KEY = 'lastClipboard';

let isMonitoring = false;
let lastClipboardText = '';

// Initialize storage
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    if (!result[STORAGE_KEY]) {
      chrome.storage.local.set({ [STORAGE_KEY]: [] });
    }
  });
  startMonitoring();
});

// Start clipboard monitoring
function startMonitoring() {
  if (isMonitoring) return;
  isMonitoring = true;
  
  // Primary method: Listen for copy events from content scripts
  // This is handled by the message listener below
  
  // Fallback: Periodic check (less frequent)
  setInterval(async () => {
    try {
      // Only check if we haven't received a copy event recently
      const text = await getClipboardText();
      
      if (text && text !== lastClipboardText && text.trim().length > 0) {
        lastClipboardText = text;
        await addClipboardItem(text);
      }
    } catch (error) {
      // Silently fail - clipboard access is limited
    }
  }, 2000); // Check every 2 seconds as fallback
}

// Get clipboard text (fallback method)
async function getClipboardText() {
  try {
    // Try to read from active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getClipboard' }, (response) => {
          if (chrome.runtime.lastError) {
            resolve('');
          } else {
            resolve(response?.text || '');
          }
        });
      });
    }
  } catch (error) {
    // Clipboard access is restricted
  }
  return '';
}

// Add clipboard item to storage
async function addClipboardItem(text) {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      let items = result[STORAGE_KEY] || [];
      
      // Remove duplicate if exists
      items = items.filter(item => item.text !== text);
      
      // Add new item at the beginning
      const newItem = {
        id: Date.now().toString(),
        text: text,
        timestamp: Date.now(),
        preview: text.substring(0, 100)
      };
      
      items.unshift(newItem);
      
      // Keep only MAX_ITEMS
      if (items.length > MAX_ITEMS) {
        items = items.slice(0, MAX_ITEMS);
      }
      
      chrome.storage.local.set({ [STORAGE_KEY]: items }, () => {
        // Notify popup if open
        chrome.runtime.sendMessage({ 
          action: 'clipboardUpdated', 
          item: newItem 
        }).catch(() => {});
        resolve();
      });
    });
  });
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle copy events from content scripts
  if (request.action === 'clipboardCopied') {
    const text = request.text;
    if (text && text !== lastClipboardText && text.trim().length > 0) {
      lastClipboardText = text;
      addClipboardItem(text).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
    sendResponse({ success: false });
    return true;
  }
  
  if (request.action === 'getItems') {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      sendResponse({ items: result[STORAGE_KEY] || [] });
    });
    return true;
  }
  
  if (request.action === 'deleteItem') {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      let items = result[STORAGE_KEY] || [];
      items = items.filter(item => item.id !== request.id);
      chrome.storage.local.set({ [STORAGE_KEY]: items }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
  
  if (request.action === 'clearAll') {
    chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'copyItem') {
    // Copy to clipboard
    navigator.clipboard.writeText(request.text).then(() => {
      sendResponse({ success: true });
    }).catch(() => {
      sendResponse({ success: false });
    });
    return true;
  }
  
  if (request.action === 'addItem') {
    addClipboardItem(request.text).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'exportData') {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      sendResponse({ data: result[STORAGE_KEY] || [] });
    });
    return true;
  }
  
  if (request.action === 'importData') {
    chrome.storage.local.set({ [STORAGE_KEY]: request.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Start monitoring on startup
chrome.runtime.onStartup.addListener(() => {
  startMonitoring();
});

startMonitoring();


