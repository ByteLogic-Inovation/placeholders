const express = require('express');
const { createCanvas } = require('canvas');
const sharp = require('sharp');
const colornames = require('colornames');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const randomText = (length) => {
  const baseText = `Software documentation is crucial because it can assist users understand how to use your software, it can provide developers and other technical stakeholders with information about the technical aspects of your software, and it can help ensure that the software development process is consistent and repeatable. Additionally, well-written software documentation can help improve the overall quality and user experience of your software. The thing is, as beneficial as software documentation is, many software engineers and developers tend not to create any documentation for their software projects either due to lack of time, lack of expertise, lack of writing abilities, lack of incentive, or lack of tools and resources. All these factors can make it challenging for developers to create high-quality documentation, and they may instead focus on writing code and developing the software.`;

  let text = '';
  //   split by space
  let words = baseText.split(' ');
  for (let i = 0; i < length; i++) {
    text += words[Math.floor(Math.random() * words.length)] + ' ';
  }
  return text;
};

// Function to generate a random hex color
const randomColor = () =>
  `#${Math.floor(Math.random() * 16777215).toString(16)}`;

// Function to parse color input
const parseColor = (color) => {
  if (!color || color === 'random') return randomColor();
  if (color.startsWith('#')) return color;
  if (color.startsWith('rgb')) return color;
  const namedColor = colornames(color);
  return namedColor || '#000000'; // Default to black if invalid
};

// Function to draw text on the canvas
const drawText = (ctx, text, width, height, textColor, size) => {
  ctx.fillStyle = textColor;
  ctx.font = `bold ${size}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
};

app.use(express.static(path.join(__dirname, 'public')));

// Route for image generation
app.get('/:height/:width.:extension', async (req, res) => {
  let { height, width, extension } = req.params;
  let {
    text = '',
    color = 'random',
    background = 'random',
    size = 20,
  } = req.query;

  if (text == 'random') {
    text = randomText(Math.floor(Math.random() * 5) + 1);
  }

  // Validate dimensions
  height =
    height === 'random'
      ? Math.floor(Math.random() * 500) + 100
      : parseInt(height);
  width =
    width === 'random'
      ? Math.floor(Math.random() * 500) + 100
      : parseInt(width);
  if (isNaN(height) || isNaN(width) || height <= 0 || width <= 0) {
    return res.status(400).send('Invalid dimensions.');
  }

  // Process colors
  color = parseColor(color);
  background = parseColor(background);

  if (extension === 'svg') {
    // Generate SVG Image
    const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="${background}" />
                <text x="50%" y="50%"  font-family="Arial" font-size="${size}" fill="${color}" text-anchor="middle" dominant-baseline="middle">
                    ${text}
                </text>
            </svg>
        `;
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(svg);
  } else {
    // Create Canvas for Raster Images
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    // Draw text
    if (text) drawText(ctx, text, width, height, color, size);

    // Convert to desired format
    const formats = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    if (!formats.includes(extension)) {
      return res.status(400).send('Unsupported file format.');
    }

    const buffer = await sharp(canvas.toBuffer())
      .toFormat(extension === 'jpg' ? 'jpeg' : extension)
      .toBuffer();

    res.setHeader('Content-Type', `image/${extension}`);
    res.send(buffer);
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
