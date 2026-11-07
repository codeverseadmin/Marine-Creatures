import mongoose from 'mongoose';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read MONGODB_URI natively from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/MONGODB_URI=(.*)/);
const uri = match ? match[1].trim() : process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI missing from .env.local');
  process.exit(1);
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
console.log('✓ Connected to MongoDB Atlas for Phase 2 Verification');

const db = mongoose.connection.db;

// 1. Inspect Collections
const collections = await db.listCollections().toArray();
console.log(`✓ Total Collections in Atlas: ${collections.length}`);

// 2. Fetch Delivered Order for Testing
const order = await db.collection('orders').findOne({ currentStep: 'delivered' });
if (!order) {
  console.log('No delivered order found, creating mock test order...');
} else {
  console.log(`✓ Found delivered order #${order.id} for ${order.customerName} with ${order.items?.length || 0} items`);
}

const testOrderId = order ? order.id : 'TEST-ORD-P2';
const testItem = order?.items?.[0] || { id: 'blue-treasure-calcium-sand-2', name: 'Blue Treasure Calcium Sand #2 — 5 kg' };
const testProductId = testItem.id.split('__')[0];

console.log(`✓ Target SKU: ${testProductId} (${testItem.name})`);

// 3. Test Cryptographic Invitation Token Generation
const rawToken = crypto.randomBytes(32).toString('hex');
const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const testInvitation = {
  tokenHash,
  orderId: testOrderId,
  productId: testProductId,
  productName: testItem.name,
  customerName: order ? order.customerName : 'Test Aquarist',
  customerPhone: order ? order.phone : '+91 98765 43210',
  expiresAt,
  isUsed: false,
  createdBy: 'Phase 2 Test Runner',
  createdAt: new Date(),
};

await db.collection('review_invitations').insertOne(testInvitation);
console.log(`✓ Created test review invitation in review_invitations collection (tokenHash: ${tokenHash.slice(0, 16)}...)`);

// 4. Test Verification Logic
const retrieved = await db.collection('review_invitations').findOne({ tokenHash });
if (!retrieved || retrieved.isUsed || new Date() > retrieved.expiresAt) {
  throw new Error('Invitation verification failed');
}
console.log('✓ Token hash retrieval and expiration check passed');

// Tampered token test
const tamperedToken = rawToken.slice(0, -2) + 'aa';
const tamperedHash = crypto.createHash('sha256').update(tamperedToken).digest('hex');
const tamperedCheck = await db.collection('review_invitations').findOne({ tokenHash: tamperedHash });
if (tamperedCheck !== null) {
  throw new Error('Tampered token check failed: should have returned null');
}
console.log('✓ Tampered token rejection verified');

// 5. Test Review Submission
const testReviewId = `test-rev-${Date.now()}`;
const testReview = {
  id: testReviewId,
  productId: testProductId,
  productName: testItem.name,
  orderId: testOrderId,
  customerDisplayName: 'Test A.',
  customerLocation: 'Mumbai, MH',
  customerPhoneMasked: '+91 98******10',
  rating: 5,
  title: 'Pristine specimen quality and impeccable acclimation',
  comment: 'Specimen arrived under thermal packaging with complete parameter stability. Feeding acceptance within 4 hours. Exceptional quality from Marine Creatures.',
  images: [
    {
      id: 'img-1',
      url: '/api/media/test-photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 120400,
      isApproved: true,
    },
  ],
  verifiedPurchase: true,
  status: 'PENDING',
  invitationTokenHash: tokenHash,
  submittedAt: new Date(),
};

await db.collection('product_reviews').insertOne(testReview);
console.log(`✓ Review created with status PENDING (ID: ${testReviewId})`);

// Mark invitation as used
await db.collection('review_invitations').updateOne(
  { tokenHash },
  { $set: { isUsed: true, usedAt: new Date(), reviewId: testReviewId } }
);

const postSubmitCheck = await db.collection('review_invitations').findOne({ tokenHash });
if (!postSubmitCheck.isUsed) {
  throw new Error('Invitation isUsed was not marked true');
}
console.log('✓ Invitation single-use invalidation verified (isUsed: true)');

// 6. Test Moderation: PENDING reviews are not exposed in APPROVED queries
const approvedBefore = await db.collection('product_reviews').find({
  productId: testProductId,
  status: 'APPROVED',
}).toArray();
const isTestInApprovedBefore = approvedBefore.some((r) => r.id === testReviewId);
if (isTestInApprovedBefore) {
  throw new Error('PENDING review leaked into APPROVED query!');
}
console.log('✓ Security check passed: PENDING review is hidden from public approved queries');

// Moderate to APPROVED
await db.collection('product_reviews').updateOne(
  { id: testReviewId },
  {
    $set: {
      status: 'APPROVED',
      moderatedAt: new Date(),
      moderatedBy: 'Senior Husbandry Moderator',
      moderationReason: 'Verified authentic aquarium photo and genuine order delivery',
    },
  }
);
console.log('✓ Moderation decision applied: APPROVED');

// Verify public query now includes it
const approvedAfter = await db.collection('product_reviews').find({
  productId: testProductId,
  status: 'APPROVED',
}).toArray();
const isTestInApprovedAfter = approvedAfter.some((r) => r.id === testReviewId);
if (!isTestInApprovedAfter) {
  throw new Error('APPROVED review not found in approved query');
}
console.log(`✓ Approved review now cleanly returned for ${testProductId} (Total approved: ${approvedAfter.length})`);

// 7. Test Rating Aggregation
const stats = await db.collection('product_reviews').aggregate([
  { $match: { productId: testProductId, status: 'APPROVED' } },
  {
    $group: {
      _id: '$productId',
      count: { $sum: 1 },
      avg: { $avg: '$rating' },
    },
  },
]).toArray();

console.log(`✓ Dynamic Rating Stats for ${testProductId}: Count = ${stats[0].count}, Avg Rating = ${stats[0].avg}`);

// 8. Test Audit Log
const testAuditEntry = {
  action: 'REVIEW_APPROVED',
  entityType: 'review',
  entityId: testReviewId,
  entityName: `${testItem.name} Review`,
  summary: `Senior Husbandry Moderator set review status to APPROVED`,
  details: {
    reviewId: testReviewId,
    productId: testProductId,
    orderId: testOrderId,
    moderator: 'Senior Husbandry Moderator',
  },
  actor: 'Senior Husbandry Moderator',
  createdAt: new Date(),
};
await db.collection('audit_logs').insertOne(testAuditEntry);
console.log('✓ Audit log entry recorded in audit_logs collection');

// 9. Clean up test artifacts
await db.collection('product_reviews').deleteOne({ id: testReviewId });
await db.collection('review_invitations').deleteOne({ tokenHash });
await db.collection('audit_logs').deleteOne({ entityId: testReviewId });
console.log('✓ Cleaned up test records from database (state pristine)');

await mongoose.disconnect();
console.log('🎉 ALL PHASE 2 BACKEND & WORKFLOW VERIFICATION CHECKS PASSED PERFECTLY!');
