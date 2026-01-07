# Auto-Update Setup Guide

## How Auto-Updates Work

Once you install the extension from the hosted package, Chrome will automatically check for updates every few hours and install them when available. You'll see an "Update" button in `chrome://extensions/` when an update is available, or Chrome will update it automatically in the background.

## For Users: Installing with Auto-Updates

### First-Time Installation (One-Time Setup)

1. **Download the Extension**
   - Visit: https://clipboardapp.vercel.app/clipboard-extension.zip
   - Or click "Download Extension" on the website

2. **Install in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - **Important**: Instead of "Load unpacked", drag and drop the downloaded `clipboard-extension.zip` file onto the extensions page
   - OR extract the zip and use "Load unpacked" (but this won't enable auto-updates)

3. **Verify Installation**
   - The extension should appear in your extensions list
   - The extension will now check for updates automatically!

### After Installation

- **Automatic Updates**: Chrome checks for updates every few hours
- **Manual Update Check**: Go to `chrome://extensions/` and click "Update" button (appears when updates are available)
- **No Re-download Needed**: Updates happen automatically in the background

## For Developers: Updating the Extension

### Quick Update Process

1. **Make your changes** to the extension files

2. **Update the version** in `manifest.json`:
   ```json
   "version": "1.0.1"
   ```

3. **Package and deploy**:
   ```bash
   npm run package
   git add -A
   git commit -m "Update extension to version X.X.X"
   git push
   ```

4. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

5. **That's it!** Users will get the update automatically within a few hours, or they can click "Update" in `chrome://extensions/`

### Automated Script

You can also use the deploy script:
```bash
npm run deploy
```

This will package, commit, and push. Then just run `vercel --prod` to deploy.

## How It Works

1. **Update URL**: The `manifest.json` includes an `update_url` pointing to `https://clipboardapp.vercel.app/updates.xml`

2. **Update Manifest**: The `updates.xml` file (generated automatically) tells Chrome:
   - Current version number
   - Where to download the new version
   - Extension ID for identification

3. **Chrome Checks**: Chrome periodically checks the update URL and compares versions

4. **Auto-Update**: If a newer version is found, Chrome downloads and installs it automatically

## Troubleshooting

### Extension Not Updating?

1. **Check version number**: Make sure you incremented the version in `manifest.json`
2. **Verify update manifest**: Check that `public/updates.xml` was generated and deployed
3. **Check Vercel deployment**: Ensure the files are live at the URLs
4. **Manual update**: Users can click "Update" in `chrome://extensions/`

### Still Using Unpacked Extension?

If you're still using "Load unpacked", you won't get auto-updates. You need to:
1. Remove the unpacked extension
2. Install from the hosted `.zip` file instead
3. Then you'll get auto-updates!

## Notes

- **Version Format**: Use semantic versioning (e.g., 1.0.0, 1.0.1, 1.1.0)
- **Update Frequency**: Chrome checks every few hours, but you can force a check by clicking "Update"
- **No Data Loss**: Updates preserve all your clipboard data and settings
- **Rollback**: If needed, you can install an older version by downloading a previous release



