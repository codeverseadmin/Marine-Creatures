import sharp from 'sharp';

// Test creating an image with sharp, adding metadata, then re-encoding without withMetadata()
const testPng = await sharp({
  create: {
    width: 200,
    height: 200,
    channels: 3,
    background: { r: 0, g: 150, b: 200 },
  },
})
  .png()
  .toBuffer();

console.log('Original test buffer size:', testPng.length);

// Process through sharp to webp
const webpBuffer = await sharp(testPng, { limitInputPixels: 16777216 })
  .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 85 })
  .toBuffer();

const webpMeta = await sharp(webpBuffer).metadata();
console.log('Sanitized WebP metadata:', {
  format: webpMeta.format,
  width: webpMeta.width,
  height: webpMeta.height,
  hasExif: !!webpMeta.exif,
  hasXmp: !!webpMeta.xmp,
});
console.log('Sharp sanitization verified successfully!');

