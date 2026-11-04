import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { OrderModel } from '@/models/Order';
import { CustomerModel } from '@/models/Customer';
import { InquiryModel } from '@/models/Inquiry';
import { ClientProjectModel } from '@/models/ClientProject';
import { CaseStudyModel } from '@/models/CaseStudy';
import { requirePermission, requireAuthenticatedEmployee } from '@/lib/rbac/guard';

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requireAuthenticatedEmployee(req);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, count: 0, results: [] });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [products, orders, customers, enquiries, projects, caseStudies] = await Promise.all([
      ProductModel.find(
        { $or: [{ id: regex }, { name: regex }, { scientificName: regex }, { brand: regex }] },
        { id: 1, name: 1, price: 1, categoryLabel: 1 }
      ).limit(5).lean(),

      OrderModel.find(
        { $or: [{ id: regex }, { customerName: regex }, { phone: regex }, { awbNumber: regex }] },
        { id: 1, customerName: 1, totalAmount: 1, currentStep: 1 }
      ).limit(5).lean(),

      CustomerModel.find(
        { $or: [{ name: regex }, { phone: regex }, { city: regex }, { id: regex }] },
        { id: 1, name: 1, phone: 1, city: 1 }
      ).limit(5).lean(),

      InquiryModel.find(
        { $or: [{ id: regex }, { name: regex }, { phone: regex }, { serviceType: regex }] },
        { id: 1, name: 1, phone: 1, serviceType: 1, status: 1 }
      ).limit(5).lean(),

      ClientProjectModel.find(
        { $or: [{ id: regex }, { projectName: regex }, { city: regex }] },
        { id: 1, projectName: 1, city: 1, status: 1 }
      ).limit(5).lean(),

      CaseStudyModel.find(
        { $or: [{ id: regex }, { title: regex }, { slug: regex }] },
        { id: 1, title: 1, slug: 1, status: 1 }
      ).limit(5).lean(),
    ]);

    const results: Array<{
      type: 'product' | 'order' | 'customer' | 'enquiry' | 'project' | 'case_study';
      id: string;
      title: string;
      subtitle: string;
      meta?: string;
      targetTab: string;
    }> = [];

    products.forEach((p) => {
      results.push({
        type: 'product',
        id: p.id,
        title: p.name,
        subtitle: `${p.categoryLabel || 'Catalog'} • ₹${p.price?.toLocaleString('en-IN') || '0'}`,
        targetTab: 'catalog',
      });
    });

    orders.forEach((o) => {
      results.push({
        type: 'order',
        id: o.id,
        title: `Order ${o.id}`,
        subtitle: `${o.customerName} • ₹${o.totalAmount?.toLocaleString('en-IN')} (${o.currentStep.toUpperCase()})`,
        targetTab: 'sales',
      });
    });

    customers.forEach((c) => {
      results.push({
        type: 'customer',
        id: c.id,
        title: c.name,
        subtitle: `${c.phone} • ${c.city}`,
        targetTab: 'sales',
      });
    });

    enquiries.forEach((e) => {
      results.push({
        type: 'enquiry',
        id: e.id,
        title: `Enquiry: ${e.name}`,
        subtitle: `${e.serviceType || 'Consultation'} (${e.status.toUpperCase()})`,
        targetTab: 'sales',
      });
    });

    projects.forEach((pr) => {
      results.push({
        type: 'project',
        id: pr.id,
        title: pr.projectName,
        subtitle: `${pr.city} • ${pr.status.toUpperCase()}`,
        targetTab: 'worlds',
      });
    });

    caseStudies.forEach((cs) => {
      results.push({
        type: 'case_study',
        id: cs.id,
        title: cs.title,
        subtitle: `Case Study • ${cs.status.toUpperCase()}`,
        targetTab: 'worlds',
      });
    });

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
