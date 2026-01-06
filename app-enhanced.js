// Clipboard Manager Web App - Enhanced Version
let clipboardItems = [];
let filteredItems = [];
let currentItemId = null;
let selectedItems = new Set();
let sortMode = 'newest';
let filterMode = 'all';
let currentTags = [];
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// State
let isLoading = false;
let viewMode = 'grid'; // grid or list

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
const darkModeToggle = document.getElementById('darkModeToggle');
const sortSelect = document.getElementById('sortSelect');
const filterSelect = document.getElementById('filterSelect');
const bulkActionsBar = document.getElementById('bulkActionsBar');
const selectAllBtn = document.getElementById('selectAllBtn');
const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
const bulkExportBtn = document.getElementById('bulkExportBtn');
const favoritesBtn = document.getElementById('favoritesBtn');
const tagsInput = document.getElementById('tagsInput');
const statsModal = document.getElementById('statsModal');
const statsBtn = document.getElementById('statsBtn');
const duplicateBtn = document.getElementById('duplicateBtn');
const fileInput = document.getElementById('fileInput');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initVisualEffects();
  loadFromStorage();
  setupEventListeners();
  setupKeyboardShortcuts();
  checkForDuplicates();
  
  // Check for data in URL (from extension sync)
  const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get('data');
  const syncParam = urlParams.get('sync');
  
  if (dataParam) {
    try {
      const data = JSON.parse(decodeURIComponent(dataParam));
      clipboardItems = data.map(item => enhanceItem(item));
      filteredItems = clipboardItems;
      applySortAndFilter();
      updateStats();
      saveToStorage();
      renderItems();
      showToast(`✨ Successfully synced ${data.length} items from extension! 💖`, 'success');
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Error parsing sync data:', error);
      showToast('❌ Error syncing data: ' + error.message, 'error');
    }
  } else if (syncParam === 'true') {
    // Wait for sync data from extension
    showToast('🔄 Waiting for sync data...', 'info');
    
    // Listen for sync data message
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CLIPBOARD_MANAGER_SYNC_DATA') {
        try {
          const data = event.data.data;
          clipboardItems = data.map(item => enhanceItem(item));
          filteredItems = clipboardItems;
          applySortAndFilter();
          updateStats();
          saveToStorage();
          renderItems();
          showToast(`✨ Successfully synced ${data.length} items from extension! 💖`, 'success');
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('Error processing sync data:', error);
          showToast('❌ Error processing sync data: ' + error.message, 'error');
        }
      }
    });
    
    // Also check chrome.storage for sync data (for large datasets)
    setTimeout(() => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['syncData', 'syncTimestamp'], (result) => {
          if (result.syncData && result.syncTimestamp) {
            // Only use if timestamp is recent (within last 30 seconds)
            const age = Date.now() - result.syncTimestamp;
            if (age < 30000) {
              try {
                const data = result.syncData;
                clipboardItems = data.map(item => enhanceItem(item));
                filteredItems = clipboardItems;
                applySortAndFilter();
                updateStats();
                saveToStorage();
                renderItems();
                showToast(`✨ Successfully synced ${data.length} items from extension! 💖`, 'success');
                chrome.storage.local.remove(['syncData', 'syncTimestamp']);
                window.history.replaceState({}, document.title, window.location.pathname);
              } catch (error) {
                console.error('Error processing sync data:', error);
                showToast('❌ Error processing sync data: ' + error.message, 'error');
              }
            } else {
              // Timestamp too old, clear it
              chrome.storage.local.remove(['syncData', 'syncTimestamp']);
            }
          }
        });
      }
    }, 1000);
  }
});

// Initialize visual effects
function initVisualEffects() {
  // Add sparkle effect on button clicks
  document.querySelectorAll('.btn, .btn-primary, .btn-secondary, .btn-danger, .btn-download').forEach(btn => {
    btn.addEventListener('click', function(e) {
      createSparkleEffect(e.target, e.clientX, e.clientY);
    });
  });

  // Add hover ripple effect to cards
  document.addEventListener('mouseover', function(e) {
    if (e.target.closest('.clipboard-card, .benefit-card')) {
      const card = e.target.closest('.clipboard-card, .benefit-card');
      if (!card.dataset.rippleAdded) {
        card.addEventListener('mouseenter', function(ev) {
          createRippleEffect(ev.currentTarget, ev.clientX, ev.clientY);
        });
        card.dataset.rippleAdded = 'true';
      }
    }
  });

  // Add floating particles on scroll
  let lastScrollTime = 0;
  window.addEventListener('scroll', function() {
    const now = Date.now();
    if (now - lastScrollTime > 100) {
      createFloatingParticle();
      lastScrollTime = now;
    }
  });
}

// Create sparkle effect
function createSparkleEffect(element, x, y) {
  const sparkles = ['✨', '💫', '⭐', '💖', '🌸'];
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const sparkle = document.createElement('div');
      sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
      sparkle.style.position = 'fixed';
      sparkle.style.left = x + 'px';
      sparkle.style.top = y + 'px';
      sparkle.style.fontSize = '20px';
      sparkle.style.pointerEvents = 'none';
      sparkle.style.zIndex = '10000';
      sparkle.style.animation = 'sparkle-fly 1s ease-out forwards';
      document.body.appendChild(sparkle);
      
      const angle = (Math.PI * 2 * i) / 5;
      const distance = 50 + Math.random() * 30;
      const finalX = x + Math.cos(angle) * distance;
      const finalY = y + Math.sin(angle) * distance;
      
      sparkle.style.setProperty('--final-x', finalX + 'px');
      sparkle.style.setProperty('--final-y', finalY + 'px');
      
      setTimeout(() => sparkle.remove(), 1000);
    }, i * 50);
  }
  
  // Add CSS animation if not already added
  if (!document.getElementById('sparkle-fly-style')) {
    const style = document.createElement('style');
    style.id = 'sparkle-fly-style';
    style.textContent = `
      @keyframes sparkle-fly {
        0% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(calc(var(--final-x) - var(--start-x, 0)), calc(var(--final-y) - var(--start-y, 0))) scale(0);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Create ripple effect
function createRippleEffect(element, x, y) {
  const ripple = document.createElement('div');
  ripple.style.position = 'absolute';
  ripple.style.left = (x - element.getBoundingClientRect().left) + 'px';
  ripple.style.top = (y - element.getBoundingClientRect().top) + 'px';
  ripple.style.width = '0';
  ripple.style.height = '0';
  ripple.style.borderRadius = '50%';
  ripple.style.background = 'rgba(255, 182, 193, 0.3)';
  ripple.style.transform = 'translate(-50%, -50%)';
  ripple.style.pointerEvents = 'none';
  ripple.style.zIndex = '1';
  element.style.position = 'relative';
  element.appendChild(ripple);
  
  requestAnimationFrame(() => {
    ripple.style.transition = 'width 0.6s, height 0.6s, opacity 0.6s';
    ripple.style.width = '200px';
    ripple.style.height = '200px';
    ripple.style.opacity = '0';
  });
  
  setTimeout(() => ripple.remove(), 600);
}

// Create floating particle
function createFloatingParticle() {
  const particles = ['✨', '💖', '⭐', '🌸', '💫'];
  const particle = document.createElement('div');
  particle.textContent = particles[Math.floor(Math.random() * particles.length)];
  particle.style.position = 'fixed';
  particle.style.left = Math.random() * window.innerWidth + 'px';
  particle.style.top = window.innerHeight + 'px';
  particle.style.fontSize = (12 + Math.random() * 8) + 'px';
  particle.style.pointerEvents = 'none';
  particle.style.zIndex = '0';
  particle.style.opacity = '0.6';
  particle.style.animation = 'float-up 3s ease-out forwards';
  document.body.appendChild(particle);
  
  setTimeout(() => particle.remove(), 3000);
  
  // Add CSS animation if not already added
  if (!document.getElementById('float-up-style')) {
    const style = document.createElement('style');
    style.id = 'float-up-style';
    style.textContent = `
      @keyframes float-up {
        0% {
          transform: translateY(0) translateX(0) rotate(0deg);
          opacity: 0.6;
        }
        100% {
          transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px) rotate(360deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
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

// Initialize theme
function initTheme() {
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
  }
  if (darkModeToggle) {
    darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
    darkModeToggle.setAttribute('aria-label', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

// Toggle dark mode
function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDarkMode);
  if (darkModeToggle) {
    darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
    darkModeToggle.setAttribute('aria-label', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
  }
  showToast(`Switched to ${isDarkMode ? 'dark' : 'light'} mode`, 'info');
}

// Keyboard navigation state
let focusedCardIndex = -1;

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput?.focus();
      focusedCardIndex = -1;
      return;
    }
    
    // Arrow keys: Navigate cards
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !e.target.matches('input, textarea')) {
      e.preventDefault();
      navigateCards(e.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    
    // Enter: Copy focused card
    if (e.key === 'Enter' && focusedCardIndex >= 0 && !e.target.matches('input, textarea')) {
      e.preventDefault();
      const cards = Array.from(clipboardGrid.querySelectorAll('.clipboard-card'));
      if (cards[focusedCardIndex]) {
        const id = cards[focusedCardIndex].dataset.id;
        copyItem(id);
      }
      return;
    }
    
    // Delete: Delete focused/selected cards
    if (e.key === 'Delete' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      if (selectedItems.size > 0) {
        bulkDelete();
      } else if (focusedCardIndex >= 0) {
        const cards = Array.from(clipboardGrid.querySelectorAll('.clipboard-card'));
        if (cards[focusedCardIndex]) {
          const id = cards[focusedCardIndex].dataset.id;
          deleteItem(id);
        }
      }
      return;
    }
    
    // Escape: Clear selection and focus
    if (e.key === 'Escape') {
      focusedCardIndex = -1;
      clearSelection();
      searchInput?.blur();
      return;
    }
    
    // Escape: Close modals, clear selection
    if (e.key === 'Escape') {
      closeAllModals();
      clearSelection();
      return;
    }
    
    // Delete: Delete selected items
    if (e.key === 'Delete' && selectedItems.size > 0) {
      bulkDelete();
      return;
    }
    
    // Ctrl/Cmd + A: Select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      selectAll();
      return;
    }
    
    // Ctrl/Cmd + D: Duplicate detection
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      showDuplicateModal();
      return;
    }
    
    // Ctrl/Cmd + E: Export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      handleExport();
      return;
    }
    
    // Ctrl/Cmd + I: Import
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      fileInput?.click();
      return;
    }
  });
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
  importBtn?.addEventListener('click', showImportModal);
  fileInput?.addEventListener('change', handleFileImport);
  exportBtn?.addEventListener('click', () => showExportModal());
  clearAllBtn?.addEventListener('click', handleClearAll);
  syncBtn?.addEventListener('click', handleSync);
  darkModeToggle?.addEventListener('click', toggleDarkMode);
  sortSelect?.addEventListener('change', handleSortChange);
  filterSelect?.addEventListener('change', handleFilterChange);
  selectAllBtn?.addEventListener('click', selectAll);
  bulkDeleteBtn?.addEventListener('click', bulkDelete);
  bulkExportBtn?.addEventListener('click', () => bulkExport());
  favoritesBtn?.addEventListener('click', showFavorites);
  duplicateBtn?.addEventListener('click', showDuplicateModal);
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
  
  // Item modal actions
  document.getElementById('copyDetailBtn')?.addEventListener('click', handleCopyDetail);
  document.getElementById('deleteDetailBtn')?.addEventListener('click', handleDeleteDetail);
  document.getElementById('favoriteDetailBtn')?.addEventListener('click', toggleFavorite);
  document.getElementById('addTagBtn')?.addEventListener('click', addTagToItem);
  
  // Import modal
  document.getElementById('confirmImport')?.addEventListener('click', handleConfirmImport);
  document.getElementById('cancelImport')?.addEventListener('click', () => {
    document.getElementById('importModal')?.classList.remove('show');
  });
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

// Load from localStorage
function loadFromStorage() {
  const stored = localStorage.getItem('clipboardItems');
  if (stored) {
    try {
      const items = JSON.parse(stored);
      clipboardItems = items.map(item => enhanceItem(item));
      filteredItems = clipboardItems;
      applySortAndFilter();
      updateStats();
      renderItems();
    } catch (error) {
      console.error('Error loading from storage:', error);
      showToast('Error loading data', 'error');
    }
  }
}

// Save to localStorage
function saveToStorage() {
  localStorage.setItem('clipboardItems', JSON.stringify(clipboardItems));
  updateStats();
}

// Detect item type
function detectItemType(text) {
  if (!text) return 'text';
  
  // URL detection
  const urlPattern = /^https?:\/\/.+/i;
  if (urlPattern.test(text.trim())) return 'url';
  
  // Email detection
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailPattern.test(text.trim())) return 'email';
  
  // Code detection (basic)
  if (text.includes('function') || text.includes('const ') || text.includes('var ') || 
      text.includes('{') && text.includes('}') || text.includes('()')) {
    return 'code';
  }
  
  // JSON detection
  try {
    JSON.parse(text);
    return 'json';
  } catch {}
  
  // Number detection
  if (/^\d+$/.test(text.trim())) return 'number';
  
  return 'text';
}

// Count words
function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Get type icon
function getTypeIcon(type) {
  const icons = {
    url: '🔗',
    email: '📧',
    code: '💻',
    json: '📄',
    number: '🔢',
    text: '📝'
  };
  return icons[type] || '📝';
}

// Render items with virtual scrolling
function renderItems() {
  if (isLoading) {
    clipboardGrid.innerHTML = Array(8).fill(0).map((_, i) => `
      <div class="clipboard-card skeleton" style="animation-delay: ${i * 0.1}s">
        <div class="skeleton-header">
          <div class="skeleton-icon"></div>
          <div class="skeleton-checkbox"></div>
        </div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-meta">
          <div class="skeleton-line tiny"></div>
          <div class="skeleton-line tiny"></div>
        </div>
      </div>
    `).join('');
    return;
  }
  
  if (filteredItems.length === 0) {
    const isSearching = searchQuery.length > 0;
    clipboardGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${isSearching ? '🔍' : '🐹'}</div>
        <h2>${isSearching ? 'No Results Found' : 'No Clipboard Items Yet!'}</h2>
        <p>${isSearching ? `No items match "${searchQuery}"` : 'Your clipboard history will appear here'}</p>
        <p class="hint">${isSearching ? 'Try a different search term or clear the search' : '✨ Sync from extension, import data, or start copying to get started! 💖'}</p>
        ${!isSearching ? `
        <div class="empty-actions">
          <button class="btn btn-primary" onclick="document.getElementById('importBtn').click()">📥 Import Data</button>
          <button class="btn btn-secondary" onclick="document.getElementById('syncBtn').click()">🔄 Sync Extension</button>
        </div>
        <div class="empty-tips">
          <h3>💡 Quick Tips:</h3>
          <ul>
            <li>📋 Copy text anywhere and it will be saved automatically!</li>
            <li>🔍 Use Ctrl+K to search your clipboard history</li>
            <li>⭐ Mark important items as favorites</li>
            <li>🏷️ Add tags to organize your clips</li>
            <li>⌨️ Use arrow keys to navigate, Enter to copy</li>
          </ul>
        </div>
        ` : ''}
      </div>
    `;
    return;
  }
  
  clipboardGrid.innerHTML = filteredItems.map(item => {
    const isSelected = selectedItems.has(item.id);
    const typeIcon = getTypeIcon(item.type);
    
    return `
      <div class="clipboard-card ${isSelected ? 'selected' : ''} ${item.isFavorite ? 'favorite' : ''}" 
           data-id="${item.id}" 
           data-type="${item.type}"
           draggable="true">
        <div class="card-header">
          <div class="card-type">${typeIcon}</div>
          <div class="card-favorite" data-id="${item.id}">
            ${item.isFavorite ? '⭐' : '☆'}
          </div>
          <input type="checkbox" class="card-checkbox" ${isSelected ? 'checked' : ''} 
                 data-id="${item.id}" onchange="toggleSelection('${item.id}')">
        </div>
        <div class="card-preview" data-full-text="${escapeHtml(item.text)}" title="${escapeHtml(item.text)}">${searchQuery ? highlightSearchMatch(item.preview, searchQuery) : escapeHtml(item.preview)}${item.text.length > 100 ? '...' : ''}</div>
        ${item.tags.length > 0 ? `<div class="card-tags">${item.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        <div class="card-meta">
          <div class="card-info">
            <span class="card-time">${formatTime(item.timestamp)}</span>
            <span class="card-stats">📊 ${item.copyCount} copies • ${item.wordCount} words</span>
          </div>
          <div class="card-actions">
            <button class="card-action copy" data-id="${item.id}" title="Copy">📋</button>
            <button class="card-action favorite-toggle" data-id="${item.id}" title="Favorite">${item.isFavorite ? '⭐' : '☆'}</button>
            <button class="card-action delete" data-id="${item.id}" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Add event listeners
  setupCardEventListeners();
  setupDragAndDrop();
  setupCardTooltips();
  updateBulkActionsBar();
  focusedCardIndex = -1; // Reset focus on render
}

// Navigate cards with keyboard
function navigateCards(direction) {
  const cards = Array.from(clipboardGrid.querySelectorAll('.clipboard-card'));
  if (cards.length === 0) return;
  
  focusedCardIndex += direction;
  if (focusedCardIndex < 0) focusedCardIndex = cards.length - 1;
  if (focusedCardIndex >= cards.length) focusedCardIndex = 0;
  
  cards.forEach((card, index) => {
    card.classList.toggle('focused', index === focusedCardIndex);
  });
  
  if (cards[focusedCardIndex]) {
    cards[focusedCardIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// Setup card tooltips for enhanced preview
function setupCardTooltips() {
  clipboardGrid.querySelectorAll('.card-preview').forEach(preview => {
    const fullText = preview.dataset.fullText;
    if (fullText && fullText.length > 100) {
      preview.addEventListener('mouseenter', function(e) {
        showTooltip(e.target, fullText);
      });
      preview.addEventListener('mouseleave', function() {
        hideTooltip();
      });
    }
  });
}

let tooltipElement = null;

function showTooltip(element, text) {
  hideTooltip();
  tooltipElement = document.createElement('div');
  tooltipElement.className = 'card-tooltip';
  tooltipElement.textContent = text;
  document.body.appendChild(tooltipElement);
  
  const rect = element.getBoundingClientRect();
  tooltipElement.style.left = rect.left + 'px';
  tooltipElement.style.top = (rect.top - tooltipElement.offsetHeight - 10) + 'px';
  
  // Adjust if tooltip goes off screen
  if (tooltipElement.offsetLeft + tooltipElement.offsetWidth > window.innerWidth) {
    tooltipElement.style.left = (window.innerWidth - tooltipElement.offsetWidth - 10) + 'px';
  }
  if (tooltipElement.offsetTop < 0) {
    tooltipElement.style.top = (rect.bottom + 10) + 'px';
  }
}

function hideTooltip() {
  if (tooltipElement) {
    tooltipElement.remove();
    tooltipElement = null;
  }
}
}

// Setup card event listeners
function setupCardEventListeners() {
  clipboardGrid.querySelectorAll('.clipboard-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.card-action') && !e.target.closest('.card-checkbox') && !e.target.closest('.card-favorite')) {
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
  
  clipboardGrid.querySelectorAll('.card-action.favorite-toggle, .card-favorite').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(btn.dataset.id);
    });
  });
  
  clipboardGrid.querySelectorAll('.card-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      toggleSelection(checkbox.dataset.id);
    });
  });
}

// Setup drag and drop
function setupDragAndDrop() {
  let draggedElement = null;
  
  clipboardGrid.querySelectorAll('.clipboard-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedElement = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedElement = null;
    });
    
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const afterElement = getDragAfterElement(clipboardGrid, e.clientY);
      if (afterElement == null) {
        clipboardGrid.appendChild(draggedElement);
      } else {
        clipboardGrid.insertBefore(draggedElement, afterElement);
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.clipboard-card:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
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
}

// Bulk delete
function bulkDelete() {
  if (selectedItems.size === 0) return;
  
  if (confirm(`Delete ${selectedItems.size} selected item(s)?`)) {
    clipboardItems = clipboardItems.filter(item => !selectedItems.has(item.id));
    filteredItems = filteredItems.filter(item => !selectedItems.has(item.id));
    selectedItems.clear();
    saveToStorage();
    applySortAndFilter();
    renderItems();
    showToast(`${selectedItems.size} items deleted`, 'success');
  }
}

// Bulk export
function bulkExport() {
  if (selectedItems.size === 0) return;
  const selected = clipboardItems.filter(item => selectedItems.has(item.id));
  showExportModal(selected);
}

// Update bulk actions bar
function updateBulkActionsBar() {
  if (!bulkActionsBar) return;
  
  if (selectedItems.size > 0) {
    bulkActionsBar.classList.add('show');
    document.getElementById('selectedCount')?.textContent = selectedItems.size;
  } else {
    bulkActionsBar.classList.remove('show');
  }
}

// Show item detail
function showItemDetail(id) {
  const item = clipboardItems.find(i => i.id === id);
  if (!item) return;
  
  currentItemId = id;
  const modal = document.getElementById('itemModal');
  if (!modal) return;
  
  document.getElementById('itemDetailText').value = item.text;
  document.getElementById('itemTime').textContent = formatTime(item.timestamp);
  document.getElementById('itemType').textContent = item.type.toUpperCase();
  document.getElementById('itemStats').textContent = `${item.wordCount} words • ${item.charCount} characters • ${item.copyCount} copies`;
  document.getElementById('itemTags').innerHTML = item.tags.map(tag => 
    `<span class="tag">${escapeHtml(tag)} <button onclick="removeTag('${id}', '${tag}')">×</button></span>`
  ).join('');
  document.getElementById('favoriteDetailBtn').textContent = item.isFavorite ? '⭐ Unfavorite' : '☆ Favorite';
  
  modal.classList.add('show');
}

// Copy item
function copyItem(id) {
  const item = clipboardItems.find(i => i.id === id);
  if (!item) return;
  
  item.copyCount = (item.copyCount || 0) + 1;
  saveToStorage();
  
  navigator.clipboard.writeText(item.text).then(() => {
    showToast('Copied to clipboard!', 'success');
    updateStats();
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = item.text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Copied to clipboard!', 'success');
    updateStats();
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
    selectedItems.delete(id);
    saveToStorage();
    applySortAndFilter();
    renderItems();
    showToast('Item deleted', 'success');
    
    const modal = document.getElementById('itemModal');
    if (modal?.classList.contains('show') && currentItemId === id) {
      modal.classList.remove('show');
    }
  }
}

// Handle delete detail
function handleDeleteDetail() {
  if (currentItemId) {
    deleteItem(currentItemId);
  }
}

// Toggle favorite
function toggleFavorite(id) {
  if (!id) id = currentItemId;
  const item = clipboardItems.find(i => i.id === id);
  if (!item) return;
  
  item.isFavorite = !item.isFavorite;
  saveToStorage();
  applySortAndFilter();
  renderItems();
  
  if (document.getElementById('itemModal')?.classList.contains('show')) {
    showItemDetail(id);
  }
  
  showToast(item.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'info');
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
    saveToStorage();
    showItemDetail(currentItemId);
    showToast('Tag added', 'success');
  }
  if (tagInput) tagInput.value = '';
}

// Remove tag
function removeTag(id, tag) {
  const item = clipboardItems.find(i => i.id === id);
  if (!item || !item.tags) return;
  
  item.tags = item.tags.filter(t => t !== tag);
  saveToStorage();
  showItemDetail(id);
  showToast('Tag removed', 'info');
}

// Handle search with highlighting
let searchQuery = '';

function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase().trim();
  
  if (searchQuery === '') {
    filteredItems = clipboardItems;
  } else {
    filteredItems = clipboardItems.filter(item => 
      item.text.toLowerCase().includes(searchQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery)) ||
      item.type?.toLowerCase().includes(searchQuery) ||
      item.preview?.toLowerCase().includes(searchQuery)
    );
  }
  
  applySortAndFilter();
  renderItems();
}

// Highlight search matches in text
function highlightSearchMatch(text, query) {
  if (!query || !text) return escapeHtml(text);
  const escapedText = escapeHtml(text);
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  
  // Apply search filter first
  if (searchQuery) {
    items = items.filter(item => 
      item.text.toLowerCase().includes(searchQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery)) ||
      item.type?.toLowerCase().includes(searchQuery) ||
      item.preview?.toLowerCase().includes(searchQuery)
    );
  }
  
  // Apply type filters
  if (filterMode === 'favorites') {
    items = items.filter(item => item.isFavorite);
  } else if (filterMode === 'urls') {
    items = items.filter(item => item.type === 'url');
  } else if (filterMode === 'emails') {
    items = items.filter(item => item.type === 'email');
  } else if (filterMode === 'code') {
    items = items.filter(item => item.type === 'code');
  } else if (filterMode === 'json') {
    items = items.filter(item => item.type === 'json');
  } else if (filterMode === 'numbers') {
    items = items.filter(item => item.type === 'number');
  } else if (filterMode === 'recent') {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    items = items.filter(item => item.timestamp > oneDayAgo);
  } else if (filterMode === 'long') {
    items = items.filter(item => item.text.length > 200);
  } else if (filterMode === 'short') {
    items = items.filter(item => item.text.length <= 50);
  }
  
  // Apply tags filter
  if (currentTags.length > 0) {
    items = items.filter(item => 
      item.tags && currentTags.some(tag => item.tags.includes(tag))
    );
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

// Show export modal
function showExportModal(items = null) {
  const modal = document.getElementById('exportModal');
  if (!modal) {
    // Fallback to direct export
    handleExport(items);
    return;
  }
  modal.classList.add('show');
}

// Handle export
function handleExport(items = null) {
  const data = items || clipboardItems;
  const format = document.getElementById('exportFormat')?.value || 'json';
  
  let content, mimeType, extension;
  
  switch (format) {
    case 'csv':
      content = 'Text,Timestamp,Type,Tags,Copy Count\n';
      data.forEach(item => {
        const text = `"${item.text.replace(/"/g, '""')}"`;
        const timestamp = new Date(item.timestamp).toISOString();
        const type = item.type || 'text';
        const tags = (item.tags || []).join(';');
        const copyCount = item.copyCount || 0;
        content += `${text},${timestamp},${type},${tags},${copyCount}\n`;
      });
      mimeType = 'text/csv';
      extension = 'csv';
      break;
      
    case 'txt':
      content = data.map((item, index) => 
        `--- Item ${index + 1} ---\n${item.text}\n\n`
      ).join('');
      mimeType = 'text/plain';
      extension = 'txt';
      break;
      
    case 'md':
      content = '# Clipboard Export\n\n';
      data.forEach((item, index) => {
        content += `## Item ${index + 1}\n\n`;
        content += `**Type:** ${item.type}\n`;
        content += `**Date:** ${new Date(item.timestamp).toLocaleString()}\n`;
        if (item.tags && item.tags.length > 0) {
          content += `**Tags:** ${item.tags.join(', ')}\n`;
        }
        content += `\n\`\`\`\n${item.text}\n\`\`\`\n\n---\n\n`;
      });
      mimeType = 'text/markdown';
      extension = 'md';
      break;
      
    default: // JSON
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      extension = 'json';
  }
  
  const dataBlob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `clipboard-export-${Date.now()}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  const modal = document.getElementById('exportModal');
  if (modal) modal.classList.remove('show');
  
  showToast(`Exported ${data.length} items as ${format.toUpperCase()}!`, 'success');
}

// Show import modal
function showImportModal() {
  const modal = document.getElementById('importModal');
  if (modal) {
    modal.classList.add('show');
    document.getElementById('importText')?.focus();
  } else {
    // Fallback: trigger file input if modal doesn't exist
    fileInput?.click();
  }
}

// Handle file import
function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  isLoading = true;
  renderItems();
  showToast('📥 Importing file...', 'info');
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const text = event.target.result;
      let data;
      
      if (file.name.endsWith('.csv')) {
        data = parseCSV(text);
      } else if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else {
        // Plain text - split by double newlines or lines
        data = text.split(/\n\n+/).filter(line => line.trim()).map((text, index) => ({
          id: Date.now().toString() + index,
          text: text.trim(),
          timestamp: Date.now(),
          preview: text.trim().substring(0, 100)
        }));
      }
      
      if (Array.isArray(data) && data.length > 0) {
        importData(data);
      } else {
        throw new Error('Invalid data format or empty file');
      }
    } catch (error) {
      console.error('Import error:', error);
      showToast('❌ Error importing file: ' + error.message, 'error');
      isLoading = false;
      renderItems();
    }
  };
  
  reader.onerror = () => {
    showToast('❌ Error reading file', 'error');
    isLoading = false;
    renderItems();
  };
  
  reader.readAsText(file);
  // Reset file input so same file can be imported again
  if (fileInput) fileInput.value = '';
}

// Parse CSV
function parseCSV(text) {
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values[0]) {
      data.push({
        id: Date.now() + i,
        text: values[0],
        timestamp: values[1] ? new Date(values[1]).getTime() : Date.now(),
        type: values[2] || 'text',
        tags: values[3] ? values[3].split(';').filter(t => t) : [],
        copyCount: parseInt(values[4]) || 0,
        preview: values[0].substring(0, 100)
      });
    }
  }
  
  return data;
}

// Handle text import
function handleConfirmImport() {
  const text = document.getElementById('importText')?.value.trim();
  if (text === '') {
    showToast('Please enter JSON data', 'error');
    return;
  }
  
  isLoading = true;
  renderItems();
  showToast('Importing data...', 'info');
  
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data) && data.length > 0) {
      importData(data);
      document.getElementById('importModal')?.classList.remove('show');
      document.getElementById('importText').value = '';
    } else {
      throw new Error('Invalid data format - must be a non-empty array');
    }
  } catch (error) {
    console.error('Import error:', error);
    showToast('Error importing data: ' + error.message, 'error');
    isLoading = false;
    renderItems();
  }
}

// Import data
function importData(data) {
  try {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }
    
    const existingIds = new Set(clipboardItems.map(item => item.id));
    const newItems = data
      .filter(item => item && (item.text || item.id)) // Validate item structure
      .map(item => {
        // Ensure item has required fields
        const enhanced = enhanceItem({
          id: item.id || Date.now().toString() + Math.random(),
          text: item.text || '',
          timestamp: item.timestamp || Date.now(),
          preview: item.preview || (item.text ? item.text.substring(0, 100) : ''),
          copyCount: item.copyCount || 0,
          isFavorite: item.isFavorite || false,
          tags: item.tags || [],
          type: item.type,
          wordCount: item.wordCount,
          charCount: item.charCount
        });
        return enhanced;
      })
      .filter(item => !existingIds.has(item.id)); // Remove duplicates
    
    if (newItems.length === 0) {
      showToast('No new items to import (all items already exist)', 'info');
      isLoading = false;
      renderItems();
      return;
    }
    
    clipboardItems = [...newItems, ...clipboardItems];
    
    if (clipboardItems.length > 5000) {
      const removed = clipboardItems.length - 5000;
      clipboardItems = clipboardItems.slice(0, 5000);
      showToast(`Imported ${newItems.length} items! (${removed} oldest items removed to stay under 5000 limit)`, 'warning');
    } else {
      showToast(`✨ Successfully imported ${newItems.length} new items! 💖`, 'success');
    }
    
    filteredItems = clipboardItems;
    applySortAndFilter();
    saveToStorage();
    updateStats();
    isLoading = false;
    renderItems();
  } catch (error) {
    console.error('Import data error:', error);
    showToast('Error importing data: ' + error.message, 'error');
    isLoading = false;
    renderItems();
  }
}

// Handle clear all
function handleClearAll() {
  if (confirm('Are you sure you want to clear all clipboard items? This cannot be undone.')) {
    clipboardItems = [];
    filteredItems = [];
    selectedItems.clear();
    saveToStorage();
    renderItems();
    showToast('All items cleared', 'success');
  }
}

// Handle sync
function handleSync() {
  // Check if we're in a browser extension context
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    // We're in the extension context, get data directly
    chrome.runtime.sendMessage({ action: 'exportData' }, (response) => {
      if (chrome.runtime.lastError) {
        showToast('Error connecting to extension: ' + chrome.runtime.lastError.message, 'error');
        return;
      }
      if (response && response.data) {
        clipboardItems = response.data.map(item => enhanceItem(item));
        filteredItems = clipboardItems;
        applySortAndFilter();
        updateStats();
        renderItems();
        saveToStorage();
        showToast(`Synced ${clipboardItems.length} items from extension!`, 'success');
      } else {
        showToast('No data found in extension', 'info');
      }
    });
  } else {
    // We're on the website - try to detect and communicate with extension
    detectAndSyncFromExtension();
  }
}

// Detect extension and attempt to sync
function detectAndSyncFromExtension() {
  // Try to detect if extension is installed by checking for a known element or message
  // Since we can't directly access extension storage from a web page,
  // we'll show instructions and also try to use postMessage if extension injects a script
  
  // Check if extension has injected a bridge script
  if (window.clipboardManagerExtension) {
    // Extension bridge is available
    window.clipboardManagerExtension.getData((data) => {
      if (data && data.length > 0) {
        clipboardItems = data.map(item => enhanceItem(item));
        filteredItems = clipboardItems;
        applySortAndFilter();
        updateStats();
        renderItems();
        saveToStorage();
        showToast(`Synced ${clipboardItems.length} items from extension!`, 'success');
      } else {
        showSyncInstructions();
      }
    });
  } else {
    // Try to request data via postMessage (if extension listens for it)
    window.postMessage({ 
      type: 'CLIPBOARD_MANAGER_SYNC_REQUEST',
      source: 'clipboard-manager-web'
    }, '*');
    
    // Listen for response
    const messageListener = (event) => {
      if (event.data && event.data.type === 'CLIPBOARD_MANAGER_SYNC_RESPONSE' && event.data.source === 'clipboard-manager-extension') {
        window.removeEventListener('message', messageListener);
        if (event.data.data && event.data.data.length > 0) {
          clipboardItems = event.data.data.map(item => enhanceItem(item));
          filteredItems = clipboardItems;
          applySortAndFilter();
          updateStats();
          renderItems();
          saveToStorage();
          showToast(`Synced ${clipboardItems.length} items from extension!`, 'success');
        } else {
          showSyncInstructions();
        }
      }
    };
    
    window.addEventListener('message', messageListener);
    
    // Show instructions after a short delay if no response
    setTimeout(() => {
      window.removeEventListener('message', messageListener);
      showSyncInstructions();
    }, 1000);
  }
}

// Show sync instructions
function showSyncInstructions() {
  const instructions = `
    <div style="text-align: left; padding: 20px;">
      <h3 style="margin-bottom: 15px; color: #ff69b4;">📋 How to Sync from Extension</h3>
      <ol style="line-height: 2; margin-left: 20px; font-size: 15px;">
        <li style="margin-bottom: 10px;">Click the <strong>Clipboard Manager</strong> extension icon in your browser toolbar</li>
        <li style="margin-bottom: 10px;">Click the <strong>🌐 Sync</strong> button in the extension popup</li>
        <li style="margin-bottom: 10px;">This will automatically open this page with all your clipboard data!</li>
      </ol>
      <div style="background: linear-gradient(135deg, rgba(255, 240, 250, 0.95) 0%, rgba(255, 228, 245, 0.95) 100%); padding: 15px; border-radius: 12px; margin-top: 20px; border: 2px solid rgba(255, 182, 193, 0.4);">
        <p style="margin: 0; color: #666; font-size: 14px;">
          <strong>💡 Tip:</strong> The extension sync button automatically transfers your data to this page. No manual copying needed!
        </p>
      </div>
    </div>
  `;
  
  // Create a modal with instructions
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h2>🔄 Sync from Extension</h2>
        <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        ${instructions}
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Got it! ✨</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  // Close on Escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

// Check for duplicates
function checkForDuplicates() {
  const textMap = new Map();
  const duplicates = [];
  
  clipboardItems.forEach(item => {
    const normalized = item.text.trim().toLowerCase();
    if (textMap.has(normalized)) {
      duplicates.push({ original: textMap.get(normalized), duplicate: item });
    } else {
      textMap.set(normalized, item);
    }
  });
  
  return duplicates;
}

// Show duplicate modal
function showDuplicateModal() {
  const duplicates = checkForDuplicates();
  const modal = document.getElementById('duplicateModal');
  if (!modal) return;
  
  if (duplicates.length === 0) {
    showToast('No duplicates found!', 'success');
    return;
  }
  
  const list = document.getElementById('duplicateList');
  if (list) {
    list.innerHTML = duplicates.map((dup, index) => `
      <div class="duplicate-item">
        <input type="checkbox" id="dup-${index}" checked>
        <label for="dup-${index}">
          <strong>Original:</strong> ${escapeHtml(dup.original.preview)}...<br>
          <strong>Duplicate:</strong> ${escapeHtml(dup.duplicate.preview)}...
        </label>
      </div>
    `).join('');
  }
  
  document.getElementById('mergeDuplicatesBtn')?.addEventListener('click', () => {
    const checkboxes = list?.querySelectorAll('input[type="checkbox"]:checked');
    if (!checkboxes) return;
    
    checkboxes.forEach((cb, index) => {
      const dup = duplicates[index];
      if (dup) {
        clipboardItems = clipboardItems.filter(item => item.id !== dup.duplicate.id);
      }
    });
    
    saveToStorage();
    applySortAndFilter();
    renderItems();
    modal.classList.remove('show');
    showToast(`${checkboxes.length} duplicates removed`, 'success');
  });
  
  modal.classList.add('show');
}

// Show stats
function showStats() {
  const modal = document.getElementById('statsModal');
  if (!modal) return;
  
  const total = clipboardItems.length;
  const favorites = clipboardItems.filter(item => item.isFavorite).length;
  const totalCopies = clipboardItems.reduce((sum, item) => sum + (item.copyCount || 0), 0);
  const totalWords = clipboardItems.reduce((sum, item) => sum + (item.wordCount || 0), 0);
  const typeCounts = {};
  clipboardItems.forEach(item => {
    typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
  });
  
  document.getElementById('statsTotal').textContent = total;
  document.getElementById('statsFavorites').textContent = favorites;
  document.getElementById('statsCopies').textContent = totalCopies;
  document.getElementById('statsWords').textContent = totalWords.toLocaleString();
  document.getElementById('statsTypes').innerHTML = Object.entries(typeCounts)
    .map(([type, count]) => `<div><strong>${type}:</strong> ${count}</div>`)
    .join('');
  
  modal.classList.add('show');
}

// Update stats
function updateStats() {
  if (!totalCount || !storageCount || !lastUpdated) return;
  
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

// Enhanced toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Make functions globally available
window.toggleSelection = toggleSelection;
window.removeTag = removeTag;


