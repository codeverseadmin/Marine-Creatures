import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/MONGODB_URI=(.*)/);
const uri = match ? match[1].trim() : process.env.MONGODB_URI;

await mongoose.connect(uri);
console.log('Connected to MongoDB Atlas');

let transactionsSupported = false;
try {
  const session = await mongoose.startSession();
  session.startTransaction();
  console.log('Transaction started successfully');
  await session.abortTransaction();
  await session.endSession();
  transactionsSupported = true;
  console.log('Transaction aborted and session ended successfully');
} catch (err) {
  console.error('Transaction test error:', err.message);
}

await mongoose.disconnect();
console.log('MongoDB Transactions Supported:', transactionsSupported);

