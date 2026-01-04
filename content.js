// Content script for clipboard access - Enhanced
// This runs in the context of web pages to capture all clipboard operations

let lastCopiedText = '';
let lastClipboardCheck = '';

// Enhanced copy event listener
document.addEventListener('copy', (e) => {
  // Get selected text immediately
  const selection = window.getSelection().toString();
  
  if (selection && selection.trim().length > 0 && selection !== lastCopiedText) {
    lastCopiedText = selection;
    // Notify background script immediately
    chrome.runtime.sendMessage({
      action: 'clipboardCopied',
      text: selection
    }).catch(() => {});
  }
  
  // Also try to read from clipboard after a short delay (for cases where selection doesn't work)
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
  }, 50);
});

// Listen for Ctrl+C / Cmd+C keyboard shortcut
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.target.matches('input, textarea, [contenteditable]')) {
    // Multiple attempts to catch the copied text
    setTimeout(() => {
      // Method 1: Get selection
      const selection = window.getSelection().toString();
      if (selection && selection.trim().length > 0 && selection !== lastCopiedText) {
        lastCopiedText = selection;
        chrome.runtime.sendMessage({
          action: 'clipboardCopied',
          text: selection
        }).catch(() => {});
        return;
      }
      
      // Method 2: Try clipboard API
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
    }, 100);
  }
});

// Also listen for right-click copy
document.addEventListener('contextmenu', (e) => {
  // If user right-clicks and might copy, prepare to capture
  const selection = window.getSelection().toString();
  if (selection && selection.trim().length > 0) {
    // Store potential copy target
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
    }, 200);
  }
});

// Periodic clipboard check as fallback (for system-wide copies)
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
    }).catch(() => {});
  }
}, 1000); // Check every second

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
});

