# MARINE CREATURES — P0 REMEDIATION
## ORDER DATA INTEGRITY & CHECKOUT VALUATION SPECIFICATION

**Document ID:** `MC-REM-P0-004`  
**Date:** November 6, 2026  
**Auditor/Architect:** Principal Enterprise Architect, AppSec & Systems Auditor  
**Domain:** Storefront Checkout, Server-Side Pricing Authority, Database Persistence & Schema Contracts  
**Status:** SPECIFICATION APPROVED FOR REMEDIATION  

---

## 1. OBJECTIVE & ARCHITECTURAL PRINCIPLES

This specification establishes an immutable, cryptographically resilient checkout and valuation lifecycle for Marine Creatures.
The core security and data-integrity principles are:

1. **Zero Client Trust (Server-Side Price Authority):** The client application (browser, cart, mobile WebView) is treated as an untrusted presentation layer. Prices, discounts, totals, and classification flags submitted by the client are never accepted as authoritative.
2. **Server-Side Catalogue Resolution:** When an order is submitted via `POST /api/orders`, the server resolves every item against the authoritative master catalogue. If an item is standard-priced, the official catalogue unit price is enforced. If an item is defined as Price on Request (`priceOnRequest: true`), the server mandates `pricingStatus: 'PENDING_POR'` and flags `hasUnresolvedPorItems: true`.
3. **Financial Finalisation Gating:** An order containing unresolved POR specimens cannot have a final financial total, cannot issue a final invoice, and cannot be approved for air-cargo packing until an authorised concierge negotiates and commits agreed prices.
4. **Catalogue Immutability:** Negotiated prices apply exclusively to the specific order document (`order.items[n].agreedUnitPrice`). The master catalogue (`ProductModel`, `marine-life.ts`, `products.ts`) is strictly read-only and immutable.

---

## 2. THE STOREFRONT-TO-DATABASE LIFECYCLE CONTRACT

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Browser
    participant Cart as Cart Drawer & OrderContext
    participant API as POST /api/orders Handler
    participant Cat as Master Catalogue (DB / Memory)
    participant DB as MongoDB Atlas (OrderModel)

    Customer->>Cart: Clicks "Place Order via WhatsApp / Checkout"
    Note over Cart: Cart constructs payload with items: [{ id, quantity }]
    Cart->>API: POST /api/orders (id, customerName, phone, address, items)
    Note over API: Step 1: Rate Limit & Input Sanitization
    Note over API: Step 2: Server-Side Price & Catalog Lookup
    API->>Cat: Lookup each item.id in Master Catalogue
    Cat-->>API: Return authoritative { name, price, priceOnRequest, category }
    
    alt Client Submitted Tampered Price
        Note over API: Reject client price; enforce authoritative catalogue price
    end

    alt Item is Price on Request (POR)
        Note over API: Set item.price = 0, item.pricingStatus = 'PENDING_POR', order.hasUnresolvedPorItems = true
    else Item is Standard
        Note over API: Set item.price = cat.price, item.pricingStatus = 'STANDARD'
    end

    Note over API: Recalculate Subtotal & Total Amount from authoritative standard items
    API->>DB: Upsert Order document with CSPRNG Token & Status
    DB-->>API: Persisted Order Document
    API-->>Cart: 201 Created (Order Object + Raw Invoice Token)
    Cart->>Customer: Display Success Screen & Trigger WhatsApp URL with Token Link
```

---

## 3. COMPONENT-BY-COMPONENT REMEDIATION SPECIFICATION

### 3.1 Storefront: `marine-creatures/lib/context/OrderContext.tsx`
- **Location:** [marine-creatures/lib/context/OrderContext.tsx#L376-L383](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/context/OrderContext.tsx#L376-L383)
- **Current Defect:**
  ```typescript
  // CURRENT (DEFECTIVE): Omits priceOnRequest and pricingStatus
  items: newOrder.items.map((it) => ({
    id: it.product.id,
    name: it.product.name,
    price: it.product.price,
    quantity: it.quantity,
    image: it.product.images?.[0] || '',
    category: it.product.category,
  })),
  ```
- **Remediation Code Specification:**
  ```typescript
  // PROPOSED CORRECTION:
  items: newOrder.items.map((it) => {
    const isPor = Boolean(it.product.priceOnRequest || it.product.price === 0);
    return {
      id: it.product.id,
      name: it.product.name,
      price: isPor ? 0 : Number(it.product.price || 0),
      quantity: Math.max(1, Math.floor(Number(it.quantity || 1))),
      image: it.product.images?.[0] || '',
      category: it.product.category || 'general',
      priceOnRequest: isPor,
      pricingStatus: isPor ? 'PENDING_POR' : 'STANDARD',
    };
  }),
  hasUnresolvedPorItems: newOrder.items.some(
    (it) => it.product.priceOnRequest || it.product.price === 0
  ),
  pricingStatus: newOrder.items.some((it) => it.product.priceOnRequest || it.product.price === 0)
    ? 'PRICE_ON_REQUEST'
    : 'STANDARD',
  ```

### 3.2 Storefront: `marine-creatures/components/cart/CartDrawer.tsx`
- **Location:** [marine-creatures/components/cart/CartDrawer.tsx#L120-L135](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/components/cart/CartDrawer.tsx#L120-L135)
- **Current Defect:** Submits raw cart items without flagging whether the order contains unresolved POR specimens.
- **Remediation Code Specification:**
  Ensure `createOrder` receives explicit metadata:
  ```typescript
  const hasPorItems = cart.some((i) => i.product.priceOnRequest || i.product.price === 0);
  const newOrder = createOrder({
    customerName: customerName.trim(),
    phone: cleanPhone,
    address: customerAddress.trim(),
    city: customerCity.trim(),
    pincode: customerPincode.trim(),
    orderNotes: orderNotes.trim() || undefined,
    items: cart.map((i) => ({ product: i.product, quantity: i.quantity })),
    subtotal: cartTotal,
    totalAmount: cartTotal,
    hasUnresolvedPorItems: hasPorItems,
    pricingStatus: hasPorItems ? 'PRICE_ON_REQUEST' : 'STANDARD',
    estimatedDelivery: 'Tomorrow via Priority Air Cargo',
  });
  ```

### 3.3 Server Endpoint: `marine-creatures/app/api/orders/route.ts` (POST Handler)
- **Location:** [marine-creatures/app/api/orders/route.ts#L122-L235](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/route.ts#L122-L235)
- **Current Defect:** Blindly trusts `body.subtotal` and `body.totalAmount`, and blindly assigns `...body` without validating against catalogue.
- **Remediation Specification:**
  1. **Catalogue Resolution Engine:** Import `findProductById(id)` from a unified catalog provider.
  2. **Item-by-Item Validation:**
     ```typescript
     let calculatedSubtotal = 0;
     let orderHasUnresolvedPor = false;

     const validatedItems = [];
     for (const rawItem of body.items || []) {
       const catalogItem = await resolveCatalogProduct(rawItem.id);
       if (!catalogItem) {
         return NextResponse.json({ success: false, error: `Invalid product ID: ${rawItem.id}` }, { status: 400 });
       }

       const quantity = Math.max(1, Math.min(100, Math.floor(Number(rawItem.quantity || 1))));
       const isPor = Boolean(catalogItem.priceOnRequest || catalogItem.price === 0);

       if (isPor) {
         orderHasUnresolvedPor = true;
         validatedItems.push({
           id: catalogItem.id,
           name: catalogItem.name,
           price: 0,
           quantity,
           category: catalogItem.category,
           image: catalogItem.images?.[0] || '',
           priceOnRequest: true,
           pricingStatus: 'PENDING_POR',
         });
       } else {
         const unitPrice = Math.round(Number(catalogItem.price) * 100) / 100;
         calculatedSubtotal += unitPrice * quantity;
         validatedItems.push({
           id: catalogItem.id,
           name: catalogItem.name,
           price: unitPrice,
           quantity,
           category: catalogItem.category,
           image: catalogItem.images?.[0] || '',
           priceOnRequest: false,
           pricingStatus: 'STANDARD',
         });
       }
     }
     ```
  3. **Order Total Enforcement:**
     ```typescript
     orderPayload.items = validatedItems;
     orderPayload.subtotal = Math.round(calculatedSubtotal * 100) / 100;
     orderPayload.totalAmount = Math.round(calculatedSubtotal * 100) / 100;
     orderPayload.hasUnresolvedPorItems = orderHasUnresolvedPor;
     orderPayload.pricingStatus = orderHasUnresolvedPor ? 'PRICE_ON_REQUEST' : 'STANDARD';
     ```

---

## 4. DATABASE SCHEMA CONTRACT ENFORCEMENT

The Mongoose models in [`marine-creatures/models/Order.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/models/Order.ts) must be strengthened with strict validation rules:

### 4.1 `OrderItemSchema` Updates
```typescript
const OrderItemSchema = new Schema<IOrderItem>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: {
      type: Number,
      required: true,
      min: [0, 'Item price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    image: { type: String, default: '' },
    category: { type: String, default: 'general' },
    priceOnRequest: { type: Boolean, default: false },
    agreedUnitPrice: {
      type: Number,
      min: [0.01, 'Agreed unit price must be greater than zero'],
      validate: {
        validator: function (val: number) {
          // If pricingStatus is AGREED, agreedUnitPrice must be > 0
          if ((this as any).pricingStatus === 'AGREED') {
            return typeof val === 'number' && val > 0;
          }
          return true;
        },
        message: 'Agreed unit price is mandatory when item is marked AGREED',
      },
    },
    pricingStatus: {
      type: String,
      enum: ['STANDARD', 'PENDING_POR', 'AGREED'],
      default: 'STANDARD',
      required: true,
    },
    pricedAt: { type: String },
    pricedBy: { type: String },
    originalPriceStatus: { type: String },
  },
  { _id: false }
);
```

### 4.2 `OrderSchema` Pre-Save Hook
To guarantee that corrupted payloads can never bypass route logic, add a Mongoose pre-save hook on `OrderSchema`:
```typescript
OrderSchema.pre('save', function (next) {
  // 1. Check if any line item is PENDING_POR or price=0 without an agreed price
  const hasUnresolved = this.items.some(
    (item) => item.pricingStatus === 'PENDING_POR' || (item.priceOnRequest && (!item.agreedUnitPrice || item.agreedUnitPrice <= 0))
  );

  this.hasUnresolvedPorItems = hasUnresolved;

  if (hasUnresolved) {
    this.pricingStatus = 'PRICE_ON_REQUEST';
    // An order with unresolved POR items cannot be marked approved
    if (this.isApproved) {
      return next(new Error('Cannot approve an order with unresolved Price-on-Request specimens'));
    }
  } else if (this.items.some((item) => item.pricingStatus === 'AGREED')) {
    this.pricingStatus = 'AGREED';
  } else {
    this.pricingStatus = 'STANDARD';
  }

  // 2. Validate totalAmount equals sum of line items
  const expectedTotal = this.items.reduce((sum, item) => {
    const unit = item.pricingStatus === 'AGREED' && item.agreedUnitPrice ? item.agreedUnitPrice : item.price;
    return sum + (unit * item.quantity);
  }, 0);

  this.subtotal = Math.round(expectedTotal * 100) / 100;
  this.totalAmount = Math.round(expectedTotal * 100) / 100;

  next();
});
```

---

## 5. EXISTING ORDER RECONCILIATION PROCESS

Live orders `MC-740020EJ` and `MC-429334LH` are currently persisted in MongoDB with `price: 0`, `hasUnresolvedPorItems: false`, and `pricingStatus: "STANDARD"`.

### Strict Rule: Zero Automated Guesswork
- The system must **NEVER** automatically invent or guess an agreed price for existing customer orders.
- The system must **NEVER** overwrite existing documents without a traceable audit trail.

### Safe Reconciliation Plan:
1. **Author a Standalone Dry-Run Diagnostic Script:**
   `scripts/audit-orders-por-status.mjs`
   - Scans MongoDB Atlas `orders` collection.
   - Identifies orders where `items.some(i => i.price === 0 || i.name.toLowerCase().includes('coral') || i.name.toLowerCase().includes('chalice'))` but `hasUnresolvedPorItems === false`.
   - Outputs a reconciliation candidate report without mutating data.
2. **Execute Remediation Flagging Script:**
   `scripts/remediate-por-flags.mjs`
   - Specifically updates `hasUnresolvedPorItems: true` and `items[n].pricingStatus: 'PENDING_POR'` for these identified records.
   - Leaves `totalAmount: 0` until an authorised concierge enters the agreed quotation through the Control OS Sales interface.
   - Creates an `AuditLog` entry: `SYSTEM_RECONCILIATION_FLAGGED` with reference to this health audit.

