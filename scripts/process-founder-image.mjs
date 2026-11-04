import sharp from 'sharp';
import fs from 'fs';

const inputPath = 'C:/Users/User/.gemini/antigravity/brain/4b21e052-1863-4d03-9ca4-5042477119bc/.user_uploaded/media_1793771521349_7a547f46.jpg';
const outputPath = 'public/images/founder/suraj-shasmal.jpg';

// Original: 768w x 1024h
// Let's create an editorial crop:
// Crop out the bright car headlights at the bottom (y > 800) so Suraj and the festive canopy lights are the focal point.
// Crop dimensions:
// top: 50, left: 24, width: 720, height: 780 (aspect ratio ~ 0.92) or 720w x 900h (4:5 ratio)
// Let's test keeping top: 40, height: 800, width: 720, left: 24:
// That removes the lower headlights while keeping the lamp post and festive lights!

await sharp(inputPath)
  .extract({
    left: 20,
    top: 30,
    width: 728,
    height: 800,
  })
  // Subtle contrast and restrained tonal balance
  .modulate({
    brightness: 0.98,
    saturation: 1.02,
  })
  .jpeg({
    quality: 92,
    mozjpeg: true,
  })
  .toFile(outputPath);

console.log('Successfully generated editorial crop at', outputPath);

// Also copy to artifact dir so we can preview it with read_file
const artifactPreview = 'C:/Users/User/.gemini/antigravity/brain/4b21e052-1863-4d03-9ca4-5042477119bc/founder_portrait_crop.jpg';
fs.copyFileSync(outputPath, artifactPreview);
console.log('Copied preview to', artifactPreview);
