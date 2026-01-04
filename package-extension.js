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
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`✅ Extension packaged successfully!`);
  console.log(`📦 File: ${outputPath}`);
  console.log(`📊 Size: ${(archive.pointer() / 1024).toFixed(2)} KB`);
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

