const BASE_URL = 'http://localhost:3000';

async function testValidCouponOrder() {
  console.log('=== TEST: Create order with valid coupon for fresh phone ===');

  // Login as admin to check admin view before and after
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode: 'mc@admin#2026!' }),
  });
  const cookie = loginRes.headers.get('set-cookie');
  const authHeaders = { Cookie: cookie.match(/mc_admin_session=([^;]+)/)[0] };

  const adminBeforeRes = await fetch(`${BASE_URL}/api/admin/orders`, { headers: authHeaders });
  const adminBefore = await adminBeforeRes.json();
  console.log('Admin orders count before:', adminBefore.total, adminBefore.data?.length);

  // Submit order as public customer with a FRESH test phone
  const testPhone = `98765${Math.floor(10000 + Math.random() * 90000)}`;
  console.log('Submitting public order with fresh phone:', testPhone);

  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'QA Test Customer',
      phone: testPhone,
      address: 'Test Reef Villa, Suite 101',
      city: 'Kolkata',
      pincode: '700001',
      couponCode: 'WELCOME100',
      items: [
        {
          id: 'blue-treasure-probiotic-salt-10kg',
          quantity: 1,
        },
      ],
    }),
  });

  const data = await res.json();
  console.log('POST /api/orders status:', res.status, data);

  if (data.success) {
    const createdId = data.data.id;
    console.log('Created Order ID:', createdId);
    console.log('Coupon snapshot:', data.data.coupon);
    console.log('Total Amount:', data.data.totalAmount, '(Subtotal:', data.data.subtotal, ')');

    // Now check if Admin Orders API retrieves it
    const adminAfterRes = await fetch(`${BASE_URL}/api/admin/orders`, { headers: authHeaders });
    const adminAfter = await adminAfterRes.json();
    console.log('Admin orders count after:', adminAfter.total, adminAfter.data?.length);

    const foundInAdmin = adminAfter.data?.find((o) => o.id === createdId);
    console.log('Found in admin orders API?', Boolean(foundInAdmin));
    if (foundInAdmin) {
      console.log('Admin order details:', {
        id: foundInAdmin.id,
        customerName: foundInAdmin.customerName,
        totalAmount: foundInAdmin.totalAmount,
        coupon: foundInAdmin.coupon,
        currentStep: foundInAdmin.currentStep,
      });
    }

    // Now clean up this test order so we do not pollute database
    const { default: mongoose } = await import('mongoose');
    const fs = await import('fs');
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const match = envContent.match(/MONGODB_URI=(.*)/);
    let uri = match[1].trim();
    if (uri.startsWith('"') && uri.endsWith('"')) uri = uri.slice(1, -1);
    await mongoose.connect(uri);
    await mongoose.connection.db.collection('orders').deleteOne({ id: createdId });
    await mongoose.connection.db.collection('couponredemptions').deleteOne({ orderId: createdId });
    await mongoose.connection.db.collection('coupons').updateOne({ code: 'WELCOME100' }, { $inc: { totalRedemptions: -1, totalDiscountGranted: -100 } });
    console.log('Cleaned up test order and reverted redemption.');
    await mongoose.disconnect();
  }
}

testValidCouponOrder().catch(console.error);

