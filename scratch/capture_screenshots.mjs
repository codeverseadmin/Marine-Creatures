import mongoose from 'mongoose';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/MONGODB_URI=(.*)/);
const uri = match ? match[1].trim() : process.env.MONGODB_URI;

await mongoose.connect(uri);
const db = mongoose.connection.db;

const order = await db.collection('orders').findOne({ currentStep: 'delivered' });
const orderId = order ? order.id : 'MC-8922';
const item = order?.items?.[0] || { id: 'emperor-angelfish-juvenile', name: 'Emperor Angelfish (Juvenile)' };
const productId = item.id.split('__')[0];

const rawToken = 'testtoken_' + crypto.randomBytes(24).toString('hex');
const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

await db.collection('review_invitations').insertOne({
  tokenHash,
  orderId,
  productId,
  productName: item.name,
  customerName: order ? order.customerName : 'Dr. Ananya Sen',
  customerPhone: order ? order.phone : '+91 98765 43210',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  isUsed: false,
  createdBy: 'Screenshot Generator',
  createdAt: new Date(),
});

console.log(`Created invitation token: ${rawToken}`);

const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\4b21e052-1863-4d03-9ca4-5042477119bc';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const reviewUrl = `http://localhost:3000/review?token=${rawToken}`;
const desktopShot = path.join(artifactDir, 'review_page_desktop.png');
const mobileShot = path.join(artifactDir, 'review_page_mobile.png');

console.log('Capturing Desktop Review Page Screenshot...');
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${desktopShot}" --window-size=1280,1080 "${reviewUrl}"`, { stdio: 'ignore' });

console.log('Capturing Mobile Review Page Screenshot...');
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${mobileShot}" --window-size=390,844 "${reviewUrl}"`, { stdio: 'ignore' });

// Also screenshot product detail reviews section
const productUrl = `http://localhost:3000/marketplace/${productId}`;
const prodShot = path.join(artifactDir, 'product_detail_reviews_desktop.png');
console.log('Capturing Product Detail Page Screenshot...');
execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${prodShot}" --window-size=1280,1200 "${productUrl}"`, { stdio: 'ignore' });

// Clean up token
await db.collection('review_invitations').deleteOne({ tokenHash });
console.log('Cleaned up invitation token.');

await mongoose.disconnect();
console.log('Screenshots captured successfully!');

