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
});

