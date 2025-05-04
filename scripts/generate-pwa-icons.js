const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Define icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate icons
sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Draw background
  ctx.fillStyle = '#4CAF50'; // Green background
  ctx.fillRect(0, 0, size, size);

  // Draw text
  const fontSize = Math.floor(size * 0.5);
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TP', size / 2, size / 2);

  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), buffer);
  console.log(`Generated icon-${size}x${size}.png`);
});

console.log('All PWA icons generated successfully!');