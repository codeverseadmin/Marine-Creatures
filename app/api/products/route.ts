import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { PRODUCTS } from '@/lib/data/products';

export async function GET() {
  try {
    await connectToDatabase();
    let products = await ProductModel.find({}).sort({ createdAt: -1 }).lean();

    // Auto-seed if collection is empty
    if (!products || products.length === 0) {
      console.log('🌱 Seeding initial products catalog into MongoDB Atlas...');
      try {
        await ProductModel.insertMany(PRODUCTS, { ordered: false });
        products = await ProductModel.find({}).sort({ createdAt: -1 }).lean();
      } catch (seedErr) {
        console.warn('Auto-seed partial insert or notice:', seedErr);
        products = await ProductModel.find({}).sort({ createdAt: -1 }).lean();
      }
    }

    return NextResponse.json({ success: true, count: products.length, data: products });
  } catch (error: any) {
    console.error('Failed to fetch products from MongoDB:', error.message);
    // Fallback gracefully to bundled products if DB is unreachable
    return NextResponse.json({
      success: false,
      fallback: true,
      data: PRODUCTS,
      error: error.message,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.id || !body.name || !body.price || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Missing required product fields (id, name, price, category)' },
        { status: 400 }
      );
    }

    const newProduct = await ProductModel.create(body);
    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product id is required' }, { status: 400 });
    }

    const updated = await ProductModel.findOneAndUpdate({ id }, updates, {
      new: true,
      upsert: true,
    }).lean();

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product id parameter is required' }, { status: 400 });
    }

    await ProductModel.deleteOne({ id });
    return NextResponse.json({ success: true, message: `Product ${id} removed` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
