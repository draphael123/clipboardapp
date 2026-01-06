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
  setupContextMenu();
  updateBadge();
});

// Setup context menu
function setupContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'save-to-clipboard-manager',
      title: 'Save to Clipboard Manager',
      contexts: ['selection']
    });
    
    chrome.contextMenus.create({
      id: 'search-clipboard-manager',
      title: 'Search in Clipboard Manager',
      contexts: ['page']
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-to-clipboard-manager') {
    const text = info.selectionText;
    if (text && text.trim().length > 0) {
      addClipboardItem(text.trim());
    }
  } else if (info.menuItemId === 'search-clipboard-manager') {
    chrome.tabs.create({
      url: `https://clipboardapp.vercel.app/?search=${encodeURIComponent('')}`
    });
  }
});

// Update badge with item count
function updateBadge() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const items = result[STORAGE_KEY] || [];
    const count = items.length;
    if (count > 0) {
      chrome.action.setBadgeText({ text: count > 99 ? '99+' : count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#ff69b4' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  });
}

// Start clipboard monitoring - Enhanced for automatic capture
function startMonitoring() {
  if (isMonitoring) return;
  isMonitoring = true;
  
  // Check settings for auto-capture
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || {};
    const autoCapture = settings.autoCapture !== false; // Default to true
    
    if (!autoCapture) {
      console.log('Auto-capture is disabled in settings');
      return;
    }
    
    // Primary method: Listen for copy events from content scripts
    // This is handled by the message listener below
    
    // Enhanced fallback: More frequent polling to catch all clipboard changes
    // This helps capture clipboard changes from outside the browser and missed events
    setInterval(async () => {
      try {
        // Check active tab first (most likely to have recent copy)
        const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTabs[0]) {
          try {
            const text = await getClipboardText(activeTabs[0].id);
            if (text && text !== lastClipboardText && text.trim().length > 0) {
              lastClipboardText = text;
              await addClipboardItem(text);
            }
          } catch (error) {
            // Tab might not have content script or clipboard access denied
          }
        }
        
        // Also check other visible tabs (up to 3) for clipboard changes
        const visibleTabs = await chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
        for (const tab of visibleTabs.slice(0, 3)) {
          if (tab.id !== activeTabs[0]?.id) {
            try {
              chrome.tabs.sendMessage(tab.id, { action: 'checkClipboard' }, (response) => {
                // Response handled by content script
              });
            } catch (error) {
              // Tab might not have content script, skip
            }
          }
        }
      } catch (error) {
        // Silently fail - clipboard access is limited
      }
    }, 300); // Check every 300ms for very responsive capture
  });
}

// Get clipboard text (fallback method) - Enhanced
async function getClipboardText(tabId = null) {
  try {
    // If tabId provided, use it directly
    if (tabId) {
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { action: 'getClipboard' }, (response) => {
          if (chrome.runtime.lastError) {
            resolve('');
          } else {
            resolve(response?.text || '');
          }
        });
      });
    }
    
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

// Add clipboard item to storage - Enhanced with settings check
async function addClipboardItem(text) {
  return new Promise((resolve) => {
    // Check settings first
    chrome.storage.local.get(['settings', STORAGE_KEY], (result) => {
      const settings = result.settings || {};
      const autoCapture = settings.autoCapture !== false; // Default to true
      const ignoreDuplicates = settings.ignoreDuplicates === true;
      const minLength = settings.minLength || 1;
      
      // Check if auto-capture is enabled
      if (!autoCapture) {
        resolve();
        return;
      }
      
      // Check minimum length
      if (text.trim().length < minLength) {
        resolve();
        return;
      }
      
      let items = result[STORAGE_KEY] || [];
      
      // Check for duplicates
      const isDuplicate = items.some(item => item.text === text);
      if (ignoreDuplicates && isDuplicate) {
        resolve();
        return;
      }
      
      // Remove duplicate if exists (move to top)
      items = items.filter(item => item.text !== text);
      
      // Add new item at the beginning
      const newItem = {
        id: Date.now().toString(),
        text: text,
        timestamp: Date.now(),
        preview: text.substring(0, 100),
        copyCount: 0,
        isFavorite: false,
        tags: [],
        type: detectItemType(text),
        wordCount: countWords(text),
        charCount: text.length
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
                // Update badge
                updateBadge();
                resolve();
              });
    });
  });
}

// Helper functions for item enhancement
function detectItemType(text) {
  if (!text) return 'text';
  const urlPattern = /^https?:\/\/.+/i;
  if (urlPattern.test(text.trim())) return 'url';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailPattern.test(text.trim())) return 'email';
  if (text.includes('function') || text.includes('const ') || text.includes('var ') || 
      (text.includes('{') && text.includes('}'))) return 'code';
  try {
    JSON.parse(text);
    return 'json';
  } catch {}
  if (/^\d+$/.test(text.trim())) return 'number';
  return 'text';
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Handle commands (keyboard shortcuts)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'quick-copy') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('quick-copy.html'),
      active: true
    });
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle copy events from content scripts - Enhanced
  if (request.action === 'clipboardCopied') {
    const text = request.text;
    if (text && text !== lastClipboardText && text.trim().length > 0) {
      lastClipboardText = text;
      addClipboardItem(text).then(() => {
        sendResponse({ success: true });
      });
      return true; // Keep channel open for async response
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
        updateBadge();
        sendResponse({ success: true });
      });
    });
    return true;
  }
  
  if (request.action === 'clearAll') {
    chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
      updateBadge();
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
  
  if (request.action === 'updateItem') {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      let items = result[STORAGE_KEY] || [];
      const index = items.findIndex(item => item.id === request.item.id);
      if (index !== -1) {
        items[index] = request.item;
      } else {
        items.push(request.item);
      }
      chrome.storage.local.set({ [STORAGE_KEY]: items }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});

// Start monitoring on startup
chrome.runtime.onStartup.addListener(() => {
  startMonitoring();
});

startMonitoring();


