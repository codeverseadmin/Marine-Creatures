const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('=== TEST 1: Validate WELCOME100 without phone (Cart Step 1) ===');
  const resCart = await fetch(`${BASE_URL}/api/promotions/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: 'WELCOME100',
      items: [
        {
          id: 'blue-treasure-probiotic-salt-10kg',
          name: 'Blue Treasure Probiotic Reef Salt — 10 kg',
          price: 2800,
          quantity: 1,
          category: 'salt-chemistry',
        },
      ],
    }),
  });
  const dataCart = await resCart.json();
  console.log('Cart step validate status:', resCart.status, dataCart);

  console.log('\n=== TEST 2: Validate WELCOME100 with phone having past orders (9330555589) ===');
  const resExisting = await fetch(`${BASE_URL}/api/promotions/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: 'WELCOME100',
      items: [
        {
          id: 'blue-treasure-probiotic-salt-10kg',
          name: 'Blue Treasure Probiotic Reef Salt — 10 kg',
          price: 2800,
          quantity: 1,
          category: 'salt-chemistry',
        },
      ],
      customerPhone: '9330555589',
    }),
  });
  const dataExisting = await resExisting.json();
  console.log('Existing customer validate status:', resExisting.status, dataExisting);

  console.log('\n=== TEST 3: Attempt POST /api/orders with existing customer phone (9330555589) ===');
  const resOrderExisting = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Soumartha Bose',
      phone: '9330555589',
      address: 'C-20/1 Chirantani Park, Bansdroni',
      city: 'Kolkata',
      pincode: '700070',
      couponCode: 'WELCOME100',
      items: [
        {
          id: 'blue-treasure-probiotic-salt-10kg',
          quantity: 1,
        },
      ],
    }),
  });
  const dataOrderExisting = await resOrderExisting.json();
  console.log('Order creation with existing customer status:', resOrderExisting.status, dataOrderExisting);
}

main().catch(console.error);

