// Script to package the extension files into a zip
// Run with: node package-extension.js

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const extensionFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.css',
  'popup.js',
  'icons'
];

const outputPath = path.join(__dirname, 'clipboard-extension.zip');
const publicDir = path.join(__dirname, 'public');
const publicZipPath = path.join(publicDir, 'clipboard-extension.zip');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`✅ Extension packaged successfully!`);
  console.log(`📦 File: ${outputPath}`);
  console.log(`📊 Size: ${(archive.pointer() / 1024).toFixed(2)} KB`);
  
  // Copy to public directory for hosting
  fs.copyFileSync(outputPath, publicZipPath);
  console.log(`📤 Copied to public directory for hosting`);
  
  // Also copy to root for Vercel (serves from root)
  const rootZipPath = path.join(__dirname, 'clipboard-extension.zip');
  if (outputPath !== rootZipPath) {
    fs.copyFileSync(outputPath, rootZipPath);
  }
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Add extension files
extensionFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      archive.directory(filePath, file);
      console.log(`📁 Added directory: ${file}`);
    } else {
      archive.file(filePath, { name: file });
      console.log(`📄 Added file: ${file}`);
    }
  } else {
    console.warn(`⚠️  File not found: ${file}`);
  }
});

archive.finalize();

