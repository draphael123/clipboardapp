// Content script for clipboard access
// This runs in the context of web pages

let lastCopiedText = '';

// Listen for copy events
document.addEventListener('copy', (e) => {
  // Get selected text
  const selection = window.getSelection().toString();
  if (selection && selection.trim().length > 0 && selection !== lastCopiedText) {
    lastCopiedText = selection;
    // Notify background script
    chrome.runtime.sendMessage({
      action: 'clipboardCopied',
      text: selection
    }).catch(() => {});
  }
});

// Also listen for Ctrl+C / Cmd+C
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    // Small delay to let copy complete
    setTimeout(() => {
      const selection = window.getSelection().toString();
      if (selection && selection.trim().length > 0 && selection !== lastCopiedText) {
        lastCopiedText = selection;
        chrome.runtime.sendMessage({
          action: 'clipboardCopied',
          text: selection
        }).catch(() => {});
      }
    }, 100);
  }
});

// Listen for messages from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getClipboard') {
    // Try to read clipboard
    navigator.clipboard.readText().then(text => {
      sendResponse({ text: text });
    }).catch(() => {
      sendResponse({ text: '' });
    });
    return true;
  }
});

