// Quick Copy Menu Script
let clipboardItems = [];
let filteredItems = [];
let focusedIndex = 0;

const searchInput = document.getElementById('searchInput');
const itemsList = document.getElementById('itemsList');

// Load items
chrome.runtime.sendMessage({ action: 'getItems' }, (response) => {
  if (response && response.items) {
    clipboardItems = response.items;
    filteredItems = clipboardItems.slice(0, 10); // Show top 10
    renderItems();
  }
});

// Handle search
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  
  if (query === '') {
    filteredItems = clipboardItems.slice(0, 10);
  } else {
    filteredItems = clipboardItems.filter(item => 
      item.text.toLowerCase().includes(query) ||
      item.tags?.some(tag => tag.toLowerCase().includes(query))
    ).slice(0, 20);
  }
  
  focusedIndex = 0;
  renderItems();
});

// Keyboard navigation
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    focusedIndex = Math.min(focusedIndex + 1, filteredItems.length - 1);
    renderItems();
    scrollToFocused();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    focusedIndex = Math.max(focusedIndex - 1, 0);
    renderItems();
    scrollToFocused();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (filteredItems[focusedIndex]) {
      copyAndClose(filteredItems[focusedIndex].id);
    }
  } else if (e.key === 'Escape') {
    window.close();
  }
});

// Render items
function renderItems() {
  if (filteredItems.length === 0) {
    itemsList.innerHTML = '<div class="empty-state">🐹 No items found! 💖</div>';
    return;
  }
  
  itemsList.innerHTML = filteredItems.map((item, index) => {
    const isFocused = index === focusedIndex;
    return `
      <div class="quick-item ${isFocused ? 'focused' : ''}" data-id="${item.id}" data-index="${index}">
        <div class="quick-item-preview">${escapeHtml(item.preview || item.text.substring(0, 100))}${item.text.length > 100 ? '...' : ''}</div>
        <div class="quick-item-meta">
          <span>${formatTime(item.timestamp)}</span>
          <span>${item.type || 'text'}</span>
        </div>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  itemsList.querySelectorAll('.quick-item').forEach(item => {
    item.addEventListener('click', () => {
      copyAndClose(item.dataset.id);
    });
  });
}

function scrollToFocused() {
  const focused = itemsList.querySelector('.quick-item.focused');
  if (focused) {
    focused.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function copyAndClose(id) {
  const item = clipboardItems.find(i => i.id === id);
  if (item) {
    chrome.runtime.sendMessage({ action: 'copyItem', text: item.text }, () => {
      window.close();
    });
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


