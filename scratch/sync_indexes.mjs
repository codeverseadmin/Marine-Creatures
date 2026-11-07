import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const envPath = fs.existsSync(path.resolve(process.cwd(), '.env.local'))
  ? path.resolve(process.cwd(), '.env.local')
  : path.resolve(process.cwd(), 'marine-creatures', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

async function sync() {
  await mongoose.connect(MONGODB_URI, { dbName: 'marine-creatures' });
  const db = mongoose.connection.db;

  // Purge any orphan test documents from interrupted runs
  await db.collection('product_reviews').deleteMany({ orderId: { $regex: '^MC-TEST' } });
  await db.collection('orders').deleteMany({ id: { $regex: '^MC-TEST' } });
  await db.collection('review_invitations').deleteMany({ orderId: { $regex: '^MC-TEST' } });
  await db.collection('media').deleteMany({ id: { $regex: '^review-test' } });

  console.log('Ensuring unique compound index on product_reviews...');
  await db.collection('product_reviews').createIndex(
    { orderId: 1, productId: 1 },
    { unique: true, name: 'orderId_1_productId_1' }
  );
  await db.collection('product_reviews').createIndex(
    { id: 1 },
    { unique: true, name: 'id_1' }
  );
  await db.collection('product_reviews').createIndex(
    { productId: 1, status: 1 },
    { name: 'productId_1_status_1' }
  );
  await db.collection('product_reviews').createIndex(
    { status: 1, submittedAt: -1 },
    { name: 'status_1_submittedAt_-1' }
  );

  console.log('Ensuring unique index on review_invitations...');
  await db.collection('review_invitations').createIndex(
    { tokenHash: 1 },
    { unique: true, name: 'tokenHash_1' }
  );
  await db.collection('review_invitations').createIndex(
    { orderId: 1, productId: 1 },
    { name: 'orderId_1_productId_1' }
  );
  await db.collection('review_invitations').createIndex(
    { isUsed: 1, expiresAt: 1 },
    { name: 'isUsed_1_expiresAt_1' }
  );
  await db.collection('review_invitations').createIndex(
    { expiresAt: 1 },
    { name: 'expiresAt_1' }
  );

  console.log('\nUpdated product_reviews indexes:');
  console.log(await db.collection('product_reviews').indexes());

  console.log('\nUpdated review_invitations indexes:');
  console.log(await db.collection('review_invitations').indexes());

  await mongoose.disconnect();
}

sync().catch(console.error);
