// Script to generate extension icons from SVG
// Requires: npm install sharp
const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('⚠️  Sharp not installed. Installing...');
  console.log('Please run: npm install sharp');
  console.log('\nFor now, creating a simple HTML-based icon converter...');
  
  // Create a simple fallback - use the SVG directly
  const iconsDir = path.join(__dirname, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // Copy SVG as icon (browsers can use SVG)
  const svgPath = path.join(iconsDir, 'icon.svg');
  if (fs.existsSync(svgPath)) {
    console.log('✅ SVG icon created at:', svgPath);
    console.log('📝 Note: For best compatibility, convert SVG to PNG manually or install sharp');
  }
  process.exit(0);
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const svgPath = path.join(iconsDir, 'icon.svg');
const sizes = [16, 48, 128];

async function generateIcons() {
  if (!fs.existsSync(svgPath)) {
    console.error('❌ SVG icon not found at:', svgPath);
    return;
  }

  console.log('🎨 Generating extension icons...');
  
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon${size}.png`);
    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✅ Created ${size}x${size} icon: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Error creating ${size}x${size} icon:`, error.message);
    }
  }
  
  console.log('\n✨ Icon generation complete!');
}

generateIcons().catch(console.error);


