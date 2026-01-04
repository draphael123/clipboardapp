// Script to generate update manifest for Chrome extension auto-updates
// Run this after packaging the extension to update the manifest

const fs = require('fs');
const path = require('path');

// Read version from manifest.json
const manifestPath = path.join(__dirname, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;

// Generate a consistent extension ID based on the update URL
// Chrome uses this to identify the extension
const crypto = require('crypto');
const updateUrl = 'https://clipboardapp.vercel.app/updates.xml';
const extensionId = crypto.createHash('sha256')
  .update(updateUrl)
  .digest('hex')
  .substring(0, 32)
  .split('')
  .map((char, i) => i === 8 || i === 13 || i === 18 || i === 23 ? '-' : char)
  .join('');

const downloadUrl = `https://clipboardapp.vercel.app/clipboard-extension.zip`;

// Generate update manifest XML (Chrome format)
const updateManifest = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${extensionId}'>
    <updatecheck codebase='${downloadUrl}' version='${version}' />
  </app>
</gupdate>`;

// Write update manifest to both public and root
const updateManifestPath = path.join(__dirname, 'public', 'updates.xml');
const rootManifestPath = path.join(__dirname, 'updates.xml');
const publicDir = path.join(__dirname, 'public');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(updateManifestPath, updateManifest, 'utf8');
fs.writeFileSync(rootManifestPath, updateManifest, 'utf8');
console.log('✅ Update manifest generated!');
console.log(`📄 Version: ${version}`);
console.log(`🆔 Extension ID: ${extensionId}`);
console.log(`🔗 Update URL: ${updateUrl}`);
console.log(`📦 Download URL: ${downloadUrl}`);

