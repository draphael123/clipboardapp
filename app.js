// Clipboard Manager Web App
let clipboardItems = [];
let filteredItems = [];
let currentItemId = null;

// DOM Elements
const clipboardGrid = document.getElementById('clipboardGrid');
const searchInput = document.getElementById('searchInput');
const totalCount = document.getElementById('totalCount');
const storageCount = document.getElementById('storageCount');
const lastUpdated = document.getElementById('lastUpdated');
const importBtn = document.getElementById('importBtn');
const exportBtn = document.getElementById('exportBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const syncBtn = document.getElementById('syncBtn');
const itemModal = document.getElementById('itemModal');
const importModal = document.getElementById('importModal');
const itemDetailText = document.getElementById('itemDetailText');
const itemTime = document.getElementById('itemTime');
const copyDetailBtn = document.getElementById('copyDetailBtn');
const deleteDetailBtn = document.getElementById('deleteDetailBtn');
const importText = document.getElementById('importText');
const confirmImport = document.getElementById('confirmImport');
const cancelImport = document.getElementById('cancelImport');
const fileInput = document.getElementById('fileInput');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check for data in URL (from extension sync)
  const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get('data');
  
  if (dataParam) {
    try {
      const data = JSON.parse(decodeURIComponent(dataParam));
      clipboardItems = data;
      filteredItems = clipboardItems;
      updateStats();
      renderItems();
      showNotification('Data synced from extension!');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Error parsing sync data:', error);
    }
  } else {
    // Load from localStorage
    loadFromStorage();
  }
  
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  searchInput.addEventListener('input', handleSearch);
  importBtn.addEventListener('click', () => {
    fileInput.click();
  });
  fileInput.addEventListener('change', handleFileImport);
  exportBtn.addEventListener('click', handleExport);
  clearAllBtn.addEventListener('click', handleClearAll);
  syncBtn.addEventListener('click', handleSync);
  
  // Modal close buttons
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      itemModal.classList.remove('show');
      importModal.classList.remove('show');
    });
  });
  
  // Item modal actions
  copyDetailBtn.addEventListener('click', handleCopyDetail);
  deleteDetailBtn.addEventListener('click', handleDeleteDetail);
  
  // Import modal
  confirmImport.addEventListener('click', handleConfirmImport);
  cancelImport.addEventListener('click', () => {
    importModal.classList.remove('show');
  });
  
  // Close modals on outside click
  itemModal.addEventListener('click', (e) => {
    if (e.target === itemModal) itemModal.classList.remove('show');
  });
  
  importModal.addEventListener('click', (e) => {
    if (e.target === importModal) importModal.classList.remove('show');
  });
}

// Load from localStorage
function loadFromStorage() {
  const stored = localStorage.getItem('clipboardItems');
  if (stored) {
    try {
      clipboardItems = JSON.parse(stored);
      filteredItems = clipboardItems;
      updateStats();
      renderItems();
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }
}

// Save to localStorage
function saveToStorage() {
  localStorage.setItem('clipboardItems', JSON.stringify(clipboardItems));
  updateStats();
}

// Render items
function renderItems() {
  if (filteredItems.length === 0) {
    clipboardGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h2>No Clipboard Items</h2>
        <p>Your clipboard history will appear here</p>
        <p class="hint">Sync from extension or import data to get started</p>
      </div>
    `;
    return;
  }
  
  clipboardGrid.innerHTML = filteredItems.map(item => `
    <div class="clipboard-card" data-id="${item.id}">
      <div class="card-preview">${escapeHtml(item.preview)}${item.text.length > 100 ? '...' : ''}</div>
      <div class="card-meta">
        <span class="card-time">${formatTime(item.timestamp)}</span>
        <div class="card-actions">
          <button class="card-action copy" data-id="${item.id}">📋</button>
          <button class="card-action delete" data-id="${item.id}">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');
  
  // Add event listeners
  clipboardGrid.querySelectorAll('.clipboard-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('card-action')) {
        const id = card.dataset.id;
        showItemDetail(id);
      }
    });
  });
  
  clipboardGrid.querySelectorAll('.card-action.copy').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyItem(btn.dataset.id);
    });
  });
  
  clipboardGrid.querySelectorAll('.card-action.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteItem(btn.dataset.id);
    });
  });
}

// Show item detail
function showItemDetail(id) {
  const item = clipboardItems.find(i => i.id === id);
  if (!item) return;
  
  currentItemId = id;
  itemDetailText.value = item.text;
  itemTime.textContent = formatTime(item.timestamp);
  itemModal.classList.add('show');
}

// Copy item
function copyItem(id) {
  const item = clipboardItems.find(i => i.id === id);
  if (!item) return;
  
  navigator.clipboard.writeText(item.text).then(() => {
    showNotification('Copied to clipboard!');
  }).catch(() => {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = item.text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showNotification('Copied to clipboard!');
  });
}

// Handle copy detail
function handleCopyDetail() {
  if (currentItemId) {
    copyItem(currentItemId);
  }
}

// Delete item
function deleteItem(id) {
  if (confirm('Are you sure you want to delete this item?')) {
    clipboardItems = clipboardItems.filter(item => item.id !== id);
    filteredItems = filteredItems.filter(item => item.id !== id);
    saveToStorage();
    renderItems();
    showNotification('Item deleted');
    
    if (itemModal.classList.contains('show') && currentItemId === id) {
      itemModal.classList.remove('show');
    }
  }
}

// Handle delete detail
function handleDeleteDetail() {
  if (currentItemId) {
    deleteItem(currentItemId);
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

// Handle export
function handleExport() {
  const dataStr = JSON.stringify(clipboardItems, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `clipboard-export-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showNotification('Data exported!');
}

// Handle file import
function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (Array.isArray(data)) {
        importData(data);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      alert('Error importing file: ' + error.message);
    }
  };
  reader.readAsText(file);
  fileInput.value = '';
}

// Handle text import
function handleConfirmImport() {
  const text = importText.value.trim();
  if (text === '') {
    alert('Please enter JSON data');
    return;
  }
  
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      importData(data);
      importModal.classList.remove('show');
      importText.value = '';
    } else {
      throw new Error('Invalid data format');
    }
  } catch (error) {
    alert('Error importing data: ' + error.message);
  }
}

// Import data
function importData(data) {
  // Merge with existing items, avoiding duplicates
  const existingIds = new Set(clipboardItems.map(item => item.id));
  const newItems = data.filter(item => !existingIds.has(item.id));
  
  clipboardItems = [...newItems, ...clipboardItems];
  
  // Limit to 5000 items
  if (clipboardItems.length > 5000) {
    clipboardItems = clipboardItems.slice(0, 5000);
  }
  
  filteredItems = clipboardItems;
  saveToStorage();
  renderItems();
  showNotification(`Imported ${newItems.length} new items!`);
}

// Handle clear all
function handleClearAll() {
  if (confirm('Are you sure you want to clear all clipboard items? This cannot be undone.')) {
    clipboardItems = [];
    filteredItems = [];
    saveToStorage();
    renderItems();
    showNotification('All items cleared');
  }
}

// Handle sync
function handleSync() {
  showNotification('To sync from extension, use the sync button in the extension popup!');
}

// Update stats
function updateStats() {
  totalCount.textContent = clipboardItems.length;
  storageCount.textContent = `${clipboardItems.length} / 5000`;
  
  if (clipboardItems.length > 0) {
    const latest = clipboardItems[0];
    lastUpdated.textContent = formatTime(latest.timestamp);
  } else {
    lastUpdated.textContent = 'Never';
  }
}

// Format time
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

