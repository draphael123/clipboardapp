// Content script for clipboard access - Enhanced
// This runs in the context of web pages to capture all clipboard operations

let lastCopiedText = '';
let lastClipboardCheck = '';
let copyTimeout = null;

// Enhanced copy event listener - PRIMARY METHOD
document.addEventListener('copy', (e) => {
  // Method 1: Get selected text immediately (fastest)
  const selection = window.getSelection().toString();
  
  if (selection && selection.trim().length > 0 && selection !== lastCopiedText) {
    lastCopiedText = selection;
    lastClipboardCheck = selection;
    // Notify background script immediately
    chrome.runtime.sendMessage({
      action: 'clipboardCopied',
      text: selection
    }).catch(() => {});
    return;
  }
  
  // Method 2: Read from clipboard after copy event (more reliable)
  // Clear any pending timeout
  if (copyTimeout) clearTimeout(copyTimeout);
  
  copyTimeout = setTimeout(() => {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(text => {
        if (text && text.trim().length > 0 && text !== lastCopiedText && text !== lastClipboardCheck) {
          lastCopiedText = text;
          lastClipboardCheck = text;
          chrome.runtime.sendMessage({
            action: 'clipboardCopied',
            text: text
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, 100); // Slightly longer delay to ensure clipboard is updated
});

// Listen for Ctrl+C / Cmd+C keyboard shortcut - ENHANCED
document.addEventListener('keydown', (e) => {
  // Capture Ctrl+C / Cmd+C (even in input fields for better coverage)
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    // Get selection first (works even in input fields)
    const selection = window.getSelection().toString();
    const activeElement = document.activeElement;
    let textToCopy = '';
    
    // Try to get text from input/textarea if selection is empty
    if (!selection && activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      const start = activeElement.selectionStart || 0;
      const end = activeElement.selectionEnd || 0;
      textToCopy = activeElement.value.substring(start, end);
    } else {
      textToCopy = selection;
    }
    
    // If we have text, send it immediately
    if (textToCopy && textToCopy.trim().length > 0 && textToCopy !== lastCopiedText) {
      lastCopiedText = textToCopy;
      lastClipboardCheck = textToCopy;
      chrome.runtime.sendMessage({
        action: 'clipboardCopied',
        text: textToCopy
      }).catch(() => {});
    }
    
    // Also check clipboard after a delay as backup
    setTimeout(() => {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
          if (text && text.trim().length > 0 && text !== lastCopiedText && text !== lastClipboardCheck) {
            lastCopiedText = text;
            lastClipboardCheck = text;
            chrome.runtime.sendMessage({
              action: 'clipboardCopied',
              text: text
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    }, 150);
  }
});

// Also listen for right-click copy - Enhanced
document.addEventListener('contextmenu', (e) => {
  // Store selection when right-click happens (user might copy)
  const selection = window.getSelection().toString();
  if (selection && selection.trim().length > 0) {
    // Check clipboard after right-click (user might have copied)
    setTimeout(() => {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
          if (text && text.trim().length > 0 && text !== lastCopiedText && text !== lastClipboardCheck) {
            lastCopiedText = text;
            lastClipboardCheck = text;
            chrome.runtime.sendMessage({
              action: 'clipboardCopied',
              text: text
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    }, 300); // Longer delay for right-click copy
  }
});

// Also intercept clipboard write operations directly
const originalWrite = navigator.clipboard?.writeText;
if (originalWrite) {
  navigator.clipboard.writeText = function(text) {
    // Call original function
    const result = originalWrite.call(this, text);
    
    // Also capture the text
    if (text && text.trim().length > 0 && text !== lastCopiedText) {
      lastCopiedText = text;
      lastClipboardCheck = text;
      chrome.runtime.sendMessage({
        action: 'clipboardCopied',
        text: text
      }).catch(() => {});
    }
    
    return result;
  };
}

// Periodic clipboard check as fallback (for system-wide copies and missed events)
// More frequent checking for better reliability
setInterval(() => {
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(text => {
      if (text && text.trim().length > 0 && text !== lastCopiedText && text !== lastClipboardCheck) {
        lastCopiedText = text;
        lastClipboardCheck = text;
        chrome.runtime.sendMessage({
          action: 'clipboardCopied',
          text: text
        }).catch(() => {});
      }
    }).catch(() => {
      // Clipboard access denied - this is normal for some pages
    });
  }
}, 500); // Check every 500ms for more responsive capture

// Listen for messages from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getClipboard') {
    // Try to read clipboard
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(text => {
        sendResponse({ text: text });
      }).catch(() => {
        sendResponse({ text: '' });
      });
    } else {
      sendResponse({ text: '' });
    }
    return true;
  }

  if (request.action === 'checkClipboard') {
    // Background script asking us to check clipboard
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(text => {
        if (text && text.trim().length > 0 && text !== lastCopiedText && text !== lastClipboardCheck) {
          lastCopiedText = text;
          lastClipboardCheck = text;
          chrome.runtime.sendMessage({
            action: 'clipboardCopied',
            text: text
          }).catch(() => {});
        }
        sendResponse({ success: true });
      }).catch(() => {
        sendResponse({ success: false });
      });
    } else {
      sendResponse({ success: false });
    }
    return true;
  }

  if (request.action === 'exportData') {
    // Website requesting data - forward to background
    chrome.runtime.sendMessage({ action: 'exportData' }, (response) => {
      if (response && response.data) {
        // Send data back to website via postMessage
        window.postMessage({
          type: 'CLIPBOARD_MANAGER_SYNC_RESPONSE',
          source: 'clipboard-manager-extension',
          data: response.data
        }, '*');
      }
      sendResponse({ success: true });
    });
    return true;
  }
});

// Listen for sync requests from website
window.addEventListener('message', (event) => {
  // Handle sync request from website (any request type)
  if (event.data && (event.data.type === 'CLIPBOARD_MANAGER_SYNC_REQUEST' || 
      event.data.type === 'CLIPBOARD_MANAGER_REQUEST_SYNC')) {
    console.log('[Clipboard Manager] Sync request received from website');
    
    // First check if we have sync data in storage (from large dataset sync)
    chrome.storage.local.get(['syncData', 'syncTimestamp'], (result) => {
      if (result.syncData && result.syncTimestamp) {
        const age = Date.now() - result.syncTimestamp;
        if (age < 60000) { // Within last 60 seconds
          console.log('[Clipboard Manager] Using stored sync data:', result.syncData.length, 'items');
          window.postMessage({
            type: 'CLIPBOARD_MANAGER_SYNC_DATA',
            source: 'clipboard-manager-extension',
            data: result.syncData
          }, '*');
          // Clear the sync data after use
          chrome.storage.local.remove(['syncData', 'syncTimestamp']);
          return;
        }
      }
      
      // Otherwise, request fresh data from background script
      chrome.runtime.sendMessage({ action: 'exportData' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Clipboard Manager] Error getting data:', chrome.runtime.lastError);
          return;
        }
        if (response && response.data) {
          console.log('[Clipboard Manager] Sending data to website:', response.data.length, 'items');
          window.postMessage({
            type: 'CLIPBOARD_MANAGER_SYNC_DATA',
            source: 'clipboard-manager-extension',
            data: response.data
          }, '*');
        }
      });
    });
  }
});

// Listen for messages from background script to forward sync data
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'syncDataToPage' && request.data) {
    window.postMessage({
      type: 'CLIPBOARD_MANAGER_SYNC_DATA',
      data: request.data
    }, '*');
    sendResponse({ success: true });
  }
  return true;
});

