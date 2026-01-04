# Installation Guide

## Download the Extension

### Option 1: Download from GitHub (Recommended)

1. Click the "Download Extension" button on the web interface, or
2. Go to: https://github.com/draphael123/clipboardapp/archive/refs/heads/main.zip
3. Extract the zip file
4. Navigate to the extracted folder

### Option 2: Clone from GitHub

```bash
git clone https://github.com/draphael123/clipboardapp.git
cd clipboardapp
```

## Install in Chrome/Edge

1. Open Chrome or Edge browser
2. Navigate to:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. Enable **Developer mode** (toggle in the top right corner)
4. Click **"Load unpacked"**
5. Select the folder containing these files:
   - `manifest.json`
   - `background.js`
   - `content.js`
   - `popup.html`
   - `popup.css`
   - `popup.js`
   - `icons/` folder (optional)

6. The extension icon should now appear in your browser toolbar!

## Install in Other Chromium Browsers

The same process works for:
- Brave
- Opera
- Vivaldi
- Any Chromium-based browser

Just navigate to `[browser]://extensions/` and follow the same steps.

## Verify Installation

1. Click the extension icon in your toolbar
2. You should see the Clipboard Manager popup
3. Start copying text - it will automatically be saved!

## Troubleshooting

### Extension not loading?
- Make sure all required files are in the folder
- Check that `manifest.json` is valid JSON
- Look for errors in the browser console (F12)

### Clipboard not working?
- Make sure you've granted clipboard permissions
- Try refreshing the extension
- Check browser console for errors

### Need help?
- Check the [README.md](README.md) for more information
- Open an issue on GitHub: https://github.com/draphael123/clipboardapp/issues

