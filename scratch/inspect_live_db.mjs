import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const envPath = fs.existsSync(path.resolve(process.cwd(), '.env.local'))
  ? path.resolve(process.cwd(), '.env.local')
  : path.resolve(process.cwd(), 'marine-creatures', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

async function inspect() {
  console.log('====================================================');
  console.log(' STRICTLY READ-ONLY LIVE DATABASE VERIFICATION');
  console.log('====================================================\n');

  await mongoose.connect(MONGODB_URI, { dbName: 'marine-creatures' });
  const db = mongoose.connection.db;

  // 1. Indexes on product_reviews
  console.log('--- 1. product_reviews Indexes ---');
  const revIndexes = await db.collection('product_reviews').indexes();
  console.log(JSON.stringify(revIndexes, null, 2));

  // 2. Indexes on review_invitations
  console.log('\n--- 2. review_invitations Indexes ---');
  const invIndexes = await db.collection('review_invitations').indexes();
  console.log(JSON.stringify(invIndexes, null, 2));

  // 3. Count documents
  const revCount = await db.collection('product_reviews').countDocuments();
  const invCount = await db.collection('review_invitations').countDocuments();
  const ordersCount = await db.collection('orders').countDocuments();
  const productsCount = await db.collection('products').countDocuments();
  const mediaCount = await db.collection('media').countDocuments();

  console.log('\n--- 3. Document Counts ---');
  console.log(`  product_reviews:    ${revCount}`);
  console.log(`  review_invitations: ${invCount}`);
  console.log(`  orders:             ${ordersCount}`);
  console.log(`  products:           ${productsCount}`);
  console.log(`  media:              ${mediaCount}`);

  // 4. Check for duplicate review records (orderId + productId)
  console.log('\n--- 4. Checking for Duplicate Review Records ---');
  const dups = await db.collection('product_reviews').aggregate([
    { $group: { _id: { orderId: '$orderId', productId: '$productId' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  console.log(`  Duplicate (orderId, productId) groups: ${dups.length}`);

  // 5. Check for raw invitation tokens stored
  console.log('\n--- 5. Checking for Raw Invitation Tokens ---');
  // Raw tokens are 64 hex chars of crypto.randomBytes(32), but stored field must be named tokenHash and be a 64 hex char SHA-256 hash
  const invDocs = await db.collection('review_invitations').find({}).toArray();
  let hasRawTokenField = false;
  let nonHashTokens = 0;
  for (const inv of invDocs) {
    if (inv.token || inv.rawToken) {
      hasRawTokenField = true;
    }
    if (!inv.tokenHash || !/^[0-9a-f]{64}$/i.test(inv.tokenHash)) {
      nonHashTokens++;
    }
  }
  console.log(`  Documents with raw token fields: ${hasRawTokenField ? 'YES (VIOLATION)' : 'NONE (SAFE)'}`);
  console.log(`  Documents with non-SHA-256 tokenHash: ${nonHashTokens}`);

  // 6. Check for leftover test records
  console.log('\n--- 6. Checking for Leftover Test Records ---');
  const testOrders = await db.collection('orders').countDocuments({ id: { $regex: '^MC-TEST' } });
  const testReviews = await db.collection('product_reviews').countDocuments({ id: { $regex: 'test' } });
  const testInvs = await db.collection('review_invitations').countDocuments({ orderId: { $regex: '^MC-TEST' } });
  const testMedia = await db.collection('media').countDocuments({ id: { $regex: 'test' } });

  console.log(`  MC-TEST Orders:    ${testOrders}`);
  console.log(`  Test Reviews:      ${testReviews}`);
  console.log(`  Test Invitations:  ${testInvs}`);
  console.log(`  Test Media:        ${testMedia}`);

  // 7. Check historical seed orders integrity
  console.log('\n--- 7. Historical Orders Integrity ---');
  const mc8921 = await db.collection('orders').findOne({ id: 'MC-8921' });
  const mc8922 = await db.collection('orders').findOne({ id: 'MC-8922' });
  console.log(`  MC-8921 exists: ${Boolean(mc8921)} (customer: ${mc8921?.customerName}, currentStep: ${mc8921?.currentStep}, isApproved: ${mc8921?.isApproved})`);
  console.log(`  MC-8922 exists: ${Boolean(mc8922)} (customer: ${mc8922?.customerName}, currentStep: ${mc8922?.currentStep}, isApproved: ${mc8922?.isApproved})`);

  await mongoose.disconnect();
}

inspect().catch(console.error);

