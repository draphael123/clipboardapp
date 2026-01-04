# Clipboard Manager Extension

A powerful clipboard manager browser extension that can store up to 5000 clipboard items with a beautiful web interface for management.

## Features

- 📋 **Store up to 5000 clipboard items** - Never lose your copied text again
- 🔍 **Search functionality** - Quickly find items in your clipboard history
- 🌐 **Web interface** - Manage your clipboard from a beautiful web dashboard
- 🔄 **Sync between extension and web** - Seamlessly sync data between the extension and web interface
- 📥 **Import/Export** - Backup and restore your clipboard data
- ⚡ **Real-time monitoring** - Automatically captures clipboard changes
- 🎨 **Modern UI** - Beautiful, responsive design

## Installation

### Browser Extension

1. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the folder containing the extension files
5. The extension icon should now appear in your browser toolbar

### Web Interface

Simply open `index.html` in your web browser. The web interface works standalone and can sync with the extension.

## Usage

### Extension

1. Click the extension icon in your browser toolbar
2. Your clipboard history will automatically appear as you copy text
3. Click any item to copy it again
4. Use the search bar to find specific items
5. Click the sync button (🌐) to open the web interface with your data

### Web Interface

1. Open `index.html` in your browser
2. Use the sync button in the extension to transfer data, or import from a file
3. Search, view, copy, and manage all your clipboard items
4. Export your data for backup

## File Structure

```
Clipboard Extension/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker
├── popup.html             # Extension popup UI
├── popup.css              # Extension popup styles
├── popup.js               # Extension popup logic
├── content.js             # Content script for clipboard access
├── index.html             # Web interface
├── styles.css             # Web interface styles
├── app.js                 # Web interface logic
└── README.md             # This file
```

## Permissions

The extension requires the following permissions:
- `clipboardRead` - To monitor clipboard changes
- `clipboardWrite` - To copy items to clipboard
- `storage` - To store clipboard items locally
- `activeTab` - To access clipboard in active tabs

## Storage

- Extension uses Chrome's `chrome.storage.local` API
- Web interface uses browser's `localStorage`
- Maximum capacity: 5000 items
- Items are stored with metadata (id, text, timestamp, preview)

## Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Development

### Extension Files
- `manifest.json` - Extension configuration
- `background.js` - Handles clipboard monitoring and storage
- `popup.html/js/css` - Extension popup interface
- `content.js` - Content script for enhanced clipboard access

### Web Interface Files
- `index.html` - Main web interface
- `styles.css` - Web interface styling
- `app.js` - Web interface functionality

## Notes

- Clipboard monitoring runs every 500ms to detect changes
- Duplicate items are automatically removed (newest kept)
- Items are sorted by most recent first
- The extension works best with text content

## Deployment

### Deploy Web Interface to Vercel

The web interface can be easily deployed to Vercel:

1. **Push to GitHub** (see `DEPLOY.md` for instructions)

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Click "Deploy" (Vercel auto-detects static sites)

3. Your web interface will be live at: `https://your-project.vercel.app`

For detailed deployment instructions, see [`DEPLOY.md`](DEPLOY.md).

## License

This project is open source and available for personal and commercial use.

## Support

For issues or questions, please check the code comments or create an issue in the repository.

