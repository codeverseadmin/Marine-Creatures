import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const envPath = fs.existsSync(path.resolve(process.cwd(), '.env.local'))
  ? path.resolve(process.cwd(), '.env.local')
  : path.resolve(process.cwd(), 'marine-creatures', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

async function verify() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const ordersCount = await db.collection('orders').countDocuments();
  const productsCount = await db.collection('products').countDocuments();
  const reviewsCount = await db.collection('product_reviews').countDocuments();
  const invitationsCount = await db.collection('review_invitations').countDocuments();
  const mediaCount = await db.collection('media').countDocuments();
  const testOrders = await db.collection('orders').find({ customerName: { $regex: 'Test|Malicious|Price Hacker' } }).toArray();

  console.log('--- DATABASE STATE VERIFICATION ---');
  console.log('Orders Count:', ordersCount);
  console.log('Products Count:', productsCount);
  console.log('Reviews Count:', reviewsCount);
  console.log('Invitations Count:', invitationsCount);
  console.log('Media Count:', mediaCount);
  console.log('Stray Test Orders Found:', testOrders.length);

  const order8921 = await db.collection('orders').findOne({ id: 'MC-8921' });
  const order8922 = await db.collection('orders').findOne({ id: 'MC-8922' });
  console.log('MC-8921 verified intact:', Boolean(order8921), order8921?.customerName);
  console.log('MC-8922 verified intact:', Boolean(order8922), order8922?.customerName);

  await mongoose.disconnect();
}

verify().catch(console.error);

