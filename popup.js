// Clipboard Manager Popup Script
let clipboardItems = [];
let filteredItems = [];

// DOM Elements
const clipboardList = document.getElementById('clipboardList');
const searchInput = document.getElementById('searchInput');
const itemCount = document.getElementById('itemCount');
const clearAllBtn = document.getElementById('clearAll');
const addManualBtn = document.getElementById('addManual');
const syncBtn = document.getElementById('syncBtn');
const settingsBtn = document.getElementById('settingsBtn');
const addModal = document.getElementById('addModal');
const addItemText = document.getElementById('addItemText');
const saveAddBtn = document.getElementById('saveAdd');
const cancelAddBtn = document.getElementById('cancelAdd');
const closeModal = document.querySelector('.close-modal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadItems();
  setupEventListeners();
  
  // Listen for updates from background
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'clipboardUpdated') {
      loadItems();
    }
  });
});

// Setup event listeners
function setupEventListeners() {
  searchInput.addEventListener('input', handleSearch);
  clearAllBtn.addEventListener('click', handleClearAll);
  addManualBtn.addEventListener('click', () => showModal());
  syncBtn.addEventListener('click', handleSync);
  settingsBtn.addEventListener('click', handleSettings);
  saveAddBtn.addEventListener('click', handleSaveAdd);
  cancelAddBtn.addEventListener('click', hideModal);
  closeModal.addEventListener('click', hideModal);
  
  // Close modal on outside click
  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) hideModal();
  });
}

// Load items from storage
function loadItems() {
  chrome.runtime.sendMessage({ action: 'getItems' }, (response) => {
    if (response && response.items) {
      clipboardItems = response.items;
      filteredItems = clipboardItems;
      updateItemCount();
      renderItems();
    }
  });
}

// Render clipboard items
function renderItems() {
  if (filteredItems.length === 0) {
    clipboardList.innerHTML = `
      <div class="empty-state">
        <p>📋 No clipboard items found</p>
        <p class="hint">Start copying text or add items manually!</p>
      </div>
    `;
    return;
  }
  
  clipboardList.innerHTML = filteredItems.map(item => `
    <div class="clipboard-item" data-id="${item.id}">
      <div class="item-preview">${escapeHtml(item.preview)}${item.text.length > 100 ? '...' : ''}</div>
      <div class="item-meta">
        <span>${formatTime(item.timestamp)}</span>
        <div class="item-actions">
          <button class="item-action copy" data-id="${item.id}">📋 Copy</button>
          <button class="item-action delete" data-id="${item.id}">🗑️ Delete</button>
        </div>
      </div>
    </div>
  `).join('');
  
  // Add event listeners to items
  clipboardList.querySelectorAll('.clipboard-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('item-action')) {
        const id = item.dataset.id;
        copyItem(id);
      }
    });
  });
  
  clipboardList.querySelectorAll('.item-action.copy').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyItem(btn.dataset.id);
    });
  });
  
  clipboardList.querySelectorAll('.item-action.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteItem(btn.dataset.id);
    });
  });
}

// Copy item to clipboard
function copyItem(id) {
  const item = clipboardItems.find(i => i.id === id);
  if (!item) return;
  
  chrome.runtime.sendMessage({ 
    action: 'copyItem', 
    text: item.text 
  }, (response) => {
    if (response && response.success) {
      // Visual feedback
      const itemEl = document.querySelector(`[data-id="${id}"]`);
      if (itemEl) {
        itemEl.classList.add('selected');
        setTimeout(() => itemEl.classList.remove('selected'), 500);
      }
      
      // Show notification
      showNotification('Copied to clipboard!');
    }
  });
}

// Delete item
function deleteItem(id) {
  if (confirm('Are you sure you want to delete this item?')) {
    chrome.runtime.sendMessage({ 
      action: 'deleteItem', 
      id: id 
    }, (response) => {
      if (response && response.success) {
        loadItems();
        showNotification('Item deleted');
      }
    });
  }
}

// Clear all items
function handleClearAll() {
  if (confirm('Are you sure you want to clear all clipboard items? This cannot be undone.')) {
    chrome.runtime.sendMessage({ action: 'clearAll' }, (response) => {
      if (response && response.success) {
        loadItems();
        showNotification('All items cleared');
      }
    });
  }
}

// Handle search
function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  
  if (query === '') {
    filteredItems = clipboardItems;
  } else {
    filteredItems = clipboardItems.filter(item => 
      item.text.toLowerCase().includes(query)
    );
  }
  
  renderItems();
}

// Show modal
function showModal() {
  addModal.classList.add('show');
  addItemText.value = '';
  addItemText.focus();
}

// Hide modal
function hideModal() {
  addModal.classList.remove('show');
}

// Save added item
function handleSaveAdd() {
  const text = addItemText.value.trim();
  if (text === '') {
    alert('Please enter some text');
    return;
  }
  
  chrome.runtime.sendMessage({ 
    action: 'addItem', 
    text: text 
  }, (response) => {
    if (response && response.success) {
      hideModal();
      loadItems();
      showNotification('Item added');
    }
  });
}

// Handle sync
function handleSync() {
  chrome.runtime.sendMessage({ action: 'exportData' }, (response) => {
    if (response && response.data) {
      // Open web interface in new tab
      const data = encodeURIComponent(JSON.stringify(response.data));
      chrome.tabs.create({ 
        url: `index.html?data=${data}` 
      });
    }
  });
}

// Handle settings
function handleSettings() {
  showNotification('Settings coming soon!');
}

// Update item count
function updateItemCount() {
  itemCount.textContent = `${clipboardItems.length} / 5000 items`;
}

// Format timestamp
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString();
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show notification
function showNotification(message) {
  // Simple notification (could be enhanced)
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #667eea;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    font-size: 14px;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

