// Clipboard Manager Popup Script - Enhanced Version
let clipboardItems = [];
let filteredItems = [];
let selectedItems = new Set();
let sortMode = 'newest';
let filterMode = 'all';
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let currentItemId = null;

// DOM Elements
const clipboardList = document.getElementById('clipboardList');
const searchInput = document.getElementById('searchInput');
const itemCount = document.getElementById('itemCount');
const clearAllBtn = document.getElementById('clearAll');
const addManualBtn = document.getElementById('addManual');
const syncBtn = document.getElementById('syncBtn');
const settingsBtn = document.getElementById('settingsBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const sortSelect = document.getElementById('sortSelect');
const filterSelect = document.getElementById('filterSelect');
const bulkActionsBar = document.getElementById('bulkActionsBar');
const selectAllBtn = document.getElementById('selectAllBtn');
const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
const favoritesBtn = document.getElementById('favoritesBtn');
const statsBtn = document.getElementById('statsBtn');
const addModal = document.getElementById('addModal');
const itemModal = document.getElementById('itemModal');
const settingsModal = document.getElementById('settingsModal');
const statsModal = document.getElementById('statsModal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadItems();
  setupEventListeners();
  setupKeyboardShortcuts();
  
  // Listen for updates from background
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'clipboardUpdated') {
      loadItems();
    }
  });
});

// Initialize theme
function initTheme() {
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
  }
  if (darkModeToggle) {
    darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
  }
}

// Toggle dark mode
function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDarkMode);
  if (darkModeToggle) {
    darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
  }
  showToast(`Switched to ${isDarkMode ? 'dark' : 'light'} mode`, 'info');
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + F: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      searchInput?.focus();
      return;
    }
    
    // Escape: Close modals
    if (e.key === 'Escape') {
      closeAllModals();
      clearSelection();
      return;
    }
    
    // Arrow keys: Navigate items
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      navigateItems(e.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    
    // Enter: Copy selected item
    if (e.key === 'Enter' && document.activeElement === searchInput) {
      const firstItem = clipboardList.querySelector('.clipboard-item');
      if (firstItem) {
        copyItem(firstItem.dataset.id);
      }
      return;
    }
    
    // Delete: Delete selected items
    if (e.key === 'Delete' && selectedItems.size > 0) {
      bulkDelete();
      return;
    }
  });
}

// Navigate items with arrow keys
function navigateItems(direction) {
  const items = Array.from(clipboardList.querySelectorAll('.clipboard-item'));
  const currentIndex = items.findIndex(item => item.classList.contains('focused'));
  let nextIndex = currentIndex + direction;
  
  if (nextIndex < 0) nextIndex = items.length - 1;
  if (nextIndex >= items.length) nextIndex = 0;
  
  items.forEach(item => item.classList.remove('focused'));
  if (items[nextIndex]) {
    items[nextIndex].classList.add('focused');
    items[nextIndex].scrollIntoView({ block: 'nearest' });
  }
}

// Close all modals
function closeAllModals() {
  document.querySelectorAll('.modal.show').forEach(modal => {
    modal.classList.remove('show');
  });
}

// Setup event listeners
function setupEventListeners() {
  searchInput?.addEventListener('input', debounce(handleSearch, 300));
  clearAllBtn?.addEventListener('click', handleClearAll);
  addManualBtn?.addEventListener('click', () => showModal('addModal'));
  syncBtn?.addEventListener('click', handleSync);
  settingsBtn?.addEventListener('click', () => showModal('settingsModal'));
  darkModeToggle?.addEventListener('click', toggleDarkMode);
  sortSelect?.addEventListener('change', handleSortChange);
  filterSelect?.addEventListener('change', handleFilterChange);
  selectAllBtn?.addEventListener('click', selectAll);
  bulkDeleteBtn?.addEventListener('click', bulkDelete);
  favoritesBtn?.addEventListener('click', showFavorites);
  statsBtn?.addEventListener('click', showStats);
  
  // Modal close buttons
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  
  // Close modals on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('show');
    });
  });
  
  // Add item modal
  document.getElementById('saveAdd')?.addEventListener('click', handleSaveAdd);
  document.getElementById('cancelAdd')?.addEventListener('click', () => closeAllModals());
  
  // Item detail modal
  document.getElementById('copyDetailBtn')?.addEventListener('click', handleCopyDetail);
  document.getElementById('deleteDetailBtn')?.addEventListener('click', handleDeleteDetail);
  document.getElementById('favoriteDetailBtn')?.addEventListener('click', toggleFavorite);
  document.getElementById('addTagBtn')?.addEventListener('click', addTagToItem);
  
  // Settings
  document.getElementById('saveSettings')?.addEventListener('click', saveSettings);
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Enhance item with additional properties
function enhanceItem(item) {
  if (!item.copyCount) item.copyCount = 0;
  if (!item.isFavorite) item.isFavorite = false;
  if (!item.tags) item.tags = [];
  if (!item.type) item.type = detectItemType(item.text);
  if (!item.wordCount) item.wordCount = countWords(item.text);
  if (!item.charCount) item.charCount = item.text.length;
  return item;
}

// Detect item type
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

// Count words
function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Get type icon
function getTypeIcon(type) {
  const icons = { url: '🔗', email: '📧', code: '💻', json: '📄', number: '🔢', text: '📝' };
  return icons[type] || '📝';
}

// Load items from storage
function loadItems() {
  chrome.runtime.sendMessage({ action: 'getItems' }, (response) => {
    if (response && response.items) {
      clipboardItems = response.items.map(item => enhanceItem(item));
      filteredItems = clipboardItems;
      applySortAndFilter();
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
  
  clipboardList.innerHTML = filteredItems.map(item => {
    const isSelected = selectedItems.has(item.id);
    const typeIcon = getTypeIcon(item.type);
    
    return `
      <div class="clipboard-item ${isSelected ? 'selected' : ''} ${item.isFavorite ? 'favorite' : ''}" 
           data-id="${item.id}" data-type="${item.type}">
        <div class="item-header">
          <div class="item-type-icon">${typeIcon}</div>
          <input type="checkbox" class="item-checkbox" ${isSelected ? 'checked' : ''} 
                 data-id="${item.id}" onchange="toggleSelection('${item.id}')">
          <button class="item-favorite-btn" data-id="${item.id}" title="${item.isFavorite ? 'Unfavorite' : 'Favorite'}">
            ${item.isFavorite ? '⭐' : '☆'}
          </button>
        </div>
        <div class="item-preview">${escapeHtml(item.preview)}${item.text.length > 100 ? '...' : ''}</div>
        ${item.tags && item.tags.length > 0 ? `<div class="item-tags-mini">${item.tags.slice(0, 2).map(tag => `<span class="tag-mini">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        <div class="item-meta">
          <div class="item-info">
            <span>${formatTime(item.timestamp)}</span>
            <span class="item-stats-mini">${item.copyCount || 0} copies</span>
          </div>
          <div class="item-actions">
            <button class="item-action copy" data-id="${item.id}" title="Copy">📋</button>
            <button class="item-action favorite-toggle" data-id="${item.id}" title="Favorite">${item.isFavorite ? '⭐' : '☆'}</button>
            <button class="item-action delete" data-id="${item.id}" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  setupItemEventListeners();
  updateBulkActionsBar();
}

// Setup item event listeners
function setupItemEventListeners() {
  clipboardList.querySelectorAll('.clipboard-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.item-action') && !e.target.closest('.item-checkbox') && !e.target.closest('.item-favorite-btn')) {
        const id = item.dataset.id;
        showItemDetail(id);
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
  
  clipboardList.querySelectorAll('.item-action.favorite-toggle, .item-favorite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(btn.dataset.id);
    });
  });
  
  clipboardList.querySelectorAll('.item-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      toggleSelection(checkbox.dataset.id);
    });
  });
}

// Toggle selection
function toggleSelection(id) {
  if (selectedItems.has(id)) {
    selectedItems.delete(id);
  } else {
    selectedItems.add(id);
  }
  renderItems();
}

// Select all
function selectAll() {
  if (selectedItems.size === filteredItems.length) {
    selectedItems.clear();
  } else {
    filteredItems.forEach(item => selectedItems.add(item.id));
  }
  renderItems();
  showToast(selectedItems.size > 0 ? `${selectedItems.size} items selected` : 'Selection cleared', 'info');
}

// Clear selection
function clearSelection() {
  selectedItems.clear();
  renderItems();
  if (bulkActionsBar) bulkActionsBar.classList.remove('show');
}

// Bulk delete
function bulkDelete() {
  if (selectedItems.size === 0) return;
  if (confirm(`Delete ${selectedItems.size} selected item(s)?`)) {
    selectedItems.forEach(id => {
      chrome.runtime.sendMessage({ action: 'deleteItem', id: id }, () => {});
    });
    selectedItems.clear();
    loadItems();
    showToast('Items deleted', 'success');
  }
}

// Update bulk actions bar
function updateBulkActionsBar() {
  if (!bulkActionsBar) return;
  if (selectedItems.size > 0) {
    bulkActionsBar.classList.add('show');
    document.getElementById('selectedCount').textContent = selectedItems.size;
  } else {
    bulkActionsBar.classList.remove('show');
  }
}

// Show item detail
function showItemDetail(id) {
  const item = clipboardItems.find(i => i.id === id);
  if (!item) return;
  
  currentItemId = id;
  const modal = itemModal;
  if (!modal) return;
  
  document.getElementById('itemDetailText').value = item.text;
  document.getElementById('itemTime').textContent = formatTime(item.timestamp);
  document.getElementById('itemType').textContent = item.type.toUpperCase();
  document.getElementById('itemStats').textContent = `${item.wordCount} words • ${item.charCount} chars • ${item.copyCount} copies`;
  document.getElementById('itemTags').innerHTML = item.tags.map(tag => 
    `<span class="tag">${escapeHtml(tag)} <button onclick="removeTag('${id}', '${tag}')">×</button></span>`
  ).join('');
  document.getElementById('favoriteDetailBtn').textContent = item.isFavorite ? '⭐' : '☆';
  
  modal.classList.add('show');
}

// Copy item
function copyItem(id) {
  const item = clipboardItems.find(i => i.id === id);
  if (!item) return;
  
  // Update copy count
  item.copyCount = (item.copyCount || 0) + 1;
  chrome.runtime.sendMessage({ action: 'updateItem', item: item }, () => {});
  
  chrome.runtime.sendMessage({ action: 'copyItem', text: item.text }, (response) => {
    if (response && response.success) {
      const itemEl = document.querySelector(`[data-id="${id}"]`);
      if (itemEl) {
        itemEl.classList.add('selected');
        setTimeout(() => itemEl.classList.remove('selected'), 500);
      }
      showToast('Copied to clipboard!', 'success');
      loadItems();
    }
  });
}

// Handle copy detail
function handleCopyDetail() {
  if (currentItemId) copyItem(currentItemId);
}

// Delete item
function deleteItem(id) {
  if (confirm('Are you sure you want to delete this item?')) {
    chrome.runtime.sendMessage({ action: 'deleteItem', id: id }, (response) => {
      if (response && response.success) {
        selectedItems.delete(id);
        loadItems();
        showToast('Item deleted', 'success');
        if (itemModal?.classList.contains('show') && currentItemId === id) {
          itemModal.classList.remove('show');
        }
      }
    });
  }
}

// Handle delete detail
function handleDeleteDetail() {
  if (currentItemId) deleteItem(currentItemId);
}

// Toggle favorite
function toggleFavorite(id) {
  if (!id) id = currentItemId;
  const item = clipboardItems.find(i => i.id === id);
  if (!item) return;
  
  item.isFavorite = !item.isFavorite;
  chrome.runtime.sendMessage({ action: 'updateItem', item: item }, () => {
    loadItems();
    if (itemModal?.classList.contains('show')) {
      showItemDetail(id);
    }
    showToast(item.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'info');
  });
}

// Add tag to item
function addTagToItem() {
  if (!currentItemId) return;
  const tagInput = document.getElementById('newTagInput');
  const tag = tagInput?.value.trim();
  if (!tag) return;
  
  const item = clipboardItems.find(i => i.id === currentItemId);
  if (!item) return;
  
  if (!item.tags) item.tags = [];
  if (!item.tags.includes(tag)) {
    item.tags.push(tag);
    chrome.runtime.sendMessage({ action: 'updateItem', item: item }, () => {
      showItemDetail(currentItemId);
      showToast('Tag added', 'success');
    });
  }
  if (tagInput) tagInput.value = '';
}

// Remove tag
function removeTag(id, tag) {
  const item = clipboardItems.find(i => i.id === id);
  if (!item || !item.tags) return;
  
  item.tags = item.tags.filter(t => t !== tag);
  chrome.runtime.sendMessage({ action: 'updateItem', item: item }, () => {
    showItemDetail(id);
    showToast('Tag removed', 'info');
  });
}

// Handle search
function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  
  if (query === '') {
    filteredItems = clipboardItems;
  } else {
    filteredItems = clipboardItems.filter(item => 
      item.text.toLowerCase().includes(query) ||
      item.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }
  
  applySortAndFilter();
  renderItems();
}

// Handle sort change
function handleSortChange(e) {
  sortMode = e.target.value;
  applySortAndFilter();
  renderItems();
}

// Handle filter change
function handleFilterChange(e) {
  filterMode = e.target.value;
  applySortAndFilter();
  renderItems();
}

// Apply sort and filter
function applySortAndFilter() {
  let items = [...clipboardItems];
  
  // Apply filters
  if (filterMode === 'favorites') {
    items = items.filter(item => item.isFavorite);
  } else if (filterMode === 'urls') {
    items = items.filter(item => item.type === 'url');
  } else if (filterMode === 'emails') {
    items = items.filter(item => item.type === 'email');
  } else if (filterMode === 'code') {
    items = items.filter(item => item.type === 'code' || item.type === 'json');
  }
  
  // Apply sort
  if (sortMode === 'newest') {
    items.sort((a, b) => b.timestamp - a.timestamp);
  } else if (sortMode === 'oldest') {
    items.sort((a, b) => a.timestamp - b.timestamp);
  } else if (sortMode === 'alphabetical') {
    items.sort((a, b) => a.text.localeCompare(b.text));
  } else if (sortMode === 'length') {
    items.sort((a, b) => b.text.length - a.text.length);
  } else if (sortMode === 'usage') {
    items.sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0));
  } else if (sortMode === 'favorites') {
    items.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return b.timestamp - a.timestamp;
    });
  }
  
  filteredItems = items;
}

// Show favorites
function showFavorites() {
  filterMode = 'favorites';
  if (filterSelect) filterSelect.value = 'favorites';
  applySortAndFilter();
  renderItems();
  showToast('Showing favorites', 'info');
}

// Show stats
function showStats() {
  const modal = statsModal;
  if (!modal) return;
  
  const total = clipboardItems.length;
  const favorites = clipboardItems.filter(item => item.isFavorite).length;
  const totalCopies = clipboardItems.reduce((sum, item) => sum + (item.copyCount || 0), 0);
  
  document.getElementById('statsTotal').textContent = total;
  document.getElementById('statsFavorites').textContent = favorites;
  document.getElementById('statsCopies').textContent = totalCopies;
  
  modal.classList.add('show');
}

// Show modal
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    if (modalId === 'addModal') {
      document.getElementById('addItemText')?.focus();
    }
  }
}

// Save added item
function handleSaveAdd() {
  const text = document.getElementById('addItemText')?.value.trim();
  if (!text) {
    showToast('Please enter some text', 'error');
    return;
  }
  
  chrome.runtime.sendMessage({ action: 'addItem', text: text }, (response) => {
    if (response && response.success) {
      closeAllModals();
      loadItems();
      showToast('Item added', 'success');
    }
  });
}

// Save settings
function saveSettings() {
  const settings = {
    autoCapture: document.getElementById('autoCapture')?.checked ?? true,
    ignoreDuplicates: document.getElementById('ignoreDuplicates')?.checked ?? false,
    minLength: parseInt(document.getElementById('minLength')?.value) || 1
  };
  
  chrome.storage.local.set({ settings: settings }, () => {
    showToast('Settings saved', 'success');
    closeAllModals();
  });
}

// Load settings
function loadSettings() {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || {};
    if (document.getElementById('autoCapture')) {
      document.getElementById('autoCapture').checked = settings.autoCapture !== false;
    }
    if (document.getElementById('ignoreDuplicates')) {
      document.getElementById('ignoreDuplicates').checked = settings.ignoreDuplicates === true;
    }
    if (document.getElementById('minLength')) {
      document.getElementById('minLength').value = settings.minLength || 1;
    }
  });
}

// Clear all items
function handleClearAll() {
  if (confirm('Are you sure you want to clear all clipboard items? This cannot be undone.')) {
    chrome.runtime.sendMessage({ action: 'clearAll' }, (response) => {
      if (response && response.success) {
        selectedItems.clear();
        loadItems();
        showToast('All items cleared', 'success');
      }
    });
  }
}

// Handle sync
function handleSync() {
  chrome.runtime.sendMessage({ action: 'exportData' }, (response) => {
    if (response && response.data) {
      const data = encodeURIComponent(JSON.stringify(response.data));
      chrome.tabs.create({ 
        url: `https://clipboardapp.vercel.app/?data=${data}` 
      });
    }
  });
}

// Update item count
function updateItemCount() {
  if (itemCount) {
    itemCount.textContent = `${clipboardItems.length} / 5000 items`;
  }
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

// Enhanced toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Make functions globally available
window.toggleSelection = toggleSelection;
window.removeTag = removeTag;
window.clearSelection = clearSelection;

// Load settings on init
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(loadSettings, 100);
});

