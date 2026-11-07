import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

async function updateMongoLighting() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const totalBefore = await db.collection('products').countDocuments();
  console.log(`Total products before: ${totalBefore}`);

  // 1. S Flora Series: luminous-aqua-ocean-blue
  const sFloraVariants = [
    {
      id: 'q30',
      name: 'Luminous Aqua Q30 (30 cm tank)',
      price: 2500,
      inStock: true,
      specs: {
        'Tank Fit': '30 cm',
        'Approx Length': '250 mm',
        'Selling Price': '₹2,500',
        'Compare-at': '₹3,000'
      }
    },
    {
      id: 'q60',
      name: 'Luminous Aqua Q60 (60 cm tank)',
      price: 3500,
      inStock: true,
      specs: {
        'Tank Fit': '60 cm',
        'Approx Length': '570 mm',
        'Selling Price': '₹3,500',
        'Compare-at': '₹4,000'
      }
    },
    {
      id: 'q75',
      name: 'Luminous Aqua Q75 (75 cm tank)',
      price: 3500,
      inStock: true,
      specs: {
        'Tank Fit': '75 cm',
        'Approx Length': '700 mm',
        'Selling Price': '₹3,500',
        'Compare-at': '₹4,000'
      }
    },
    {
      id: 'q90',
      name: 'Luminous Aqua Q90 (90 cm tank)',
      price: 4500,
      inStock: true,
      specs: {
        'Tank Fit': '90 cm',
        'Approx Length': '860 mm',
        'Selling Price': '₹4,500',
        'Compare-at': '₹5,000'
      }
    },
    {
      id: 'q120',
      name: 'Luminous Aqua Q120 (120 cm tank)',
      price: 5500,
      inStock: true,
      specs: {
        'Tank Fit': '120 cm',
        'Approx Length': '1,000 mm',
        'Selling Price': '₹5,500',
        'Compare-at': '₹6,000'
      }
    }
  ];

  const sFloraUpdateRes = await db.collection('products').updateOne(
    { id: 'luminous-aqua-ocean-blue' },
    {
      $set: {
        price: 2500,
        compareAtPrice: 3000,
        originalPrice: 3000,
        variants: sFloraVariants,
        updatedAt: new Date(),
      }
    }
  );
  console.log('S Flora update result:', sFloraUpdateRes.modifiedCount);

  // 2. E-Series: nemo-extreme-led
  const nemoVariants = [
    {
      id: 'e450',
      name: 'Nemo E450 (45–60 cm / 24W)',
      price: 6000,
      inStock: true,
      specs: {
        'Tank Range': '45–60 cm',
        'Power': '24W',
        'Control': 'Bluetooth App Control',
        'Selling Price': '₹6,000',
        'Compare-at': '₹7,000'
      }
    },
    {
      id: 'e600',
      name: 'Nemo E600 (60–80 cm / 36W)',
      price: 7500,
      inStock: true,
      specs: {
        'Tank Range': '60–80 cm',
        'Power': '36W',
        'Control': 'Bluetooth App Control',
        'Selling Price': '₹7,500',
        'Compare-at': '₹8,500'
      }
    },
    {
      id: 'e900',
      name: 'Nemo E900 (90–110 cm / 60W)',
      price: 11000,
      inStock: true,
      specs: {
        'Tank Range': '90–110 cm',
        'Power': '60W',
        'Control': 'Bluetooth App Control',
        'Selling Price': '₹11,000',
        'Compare-at': '₹12,500'
      }
    },
    {
      id: 'e1200',
      name: 'Nemo E1200 (120–140 cm / 72W)',
      price: 13000,
      inStock: true,
      specs: {
        'Tank Range': '120–140 cm',
        'Power': '72W',
        'Control': 'Bluetooth App Control',
        'Selling Price': '₹13,000',
        'Compare-at': '₹15,000'
      }
    }
  ];

  const nemoUpdateRes = await db.collection('products').updateOne(
    { id: 'nemo-extreme-led' },
    {
      $set: {
        price: 6000,
        compareAtPrice: 7500,
        originalPrice: 7500,
        variants: nemoVariants,
        updatedAt: new Date(),
      }
    }
  );
  console.log('Nemo update result:', nemoUpdateRes.modifiedCount);

  // 3. Verification
  const totalAfter = await db.collection('products').countDocuments();
  console.log(`Total products after: ${totalAfter}`);

  const sFloraDoc = await db.collection('products').findOne({ id: 'luminous-aqua-ocean-blue' });
  console.log('Verified S Flora in DB:');
  console.log(`  Base Price: ₹${sFloraDoc.price}`);
  sFloraDoc.variants.forEach(v => console.log(`  - ${v.id.toUpperCase()}: ₹${v.price} (${v.name})`));

  const nemoDoc = await db.collection('products').findOne({ id: 'nemo-extreme-led' });
  console.log('Verified Nemo in DB:');
  console.log(`  Base Price: ₹${nemoDoc.price}`);
  nemoDoc.variants.forEach(v => console.log(`  - ${v.id.toUpperCase()}: ₹${v.price} (${v.name})`));

  await mongoose.disconnect();
}

updateMongoLighting().catch(console.error);

