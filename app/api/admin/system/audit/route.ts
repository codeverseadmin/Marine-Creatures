import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuditLogModel } from '@/models/AuditLog';
import { requirePermission, requireAuthenticatedEmployee } from '@/lib/rbac/guard';

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'audit.read');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const action = searchParams.get('action') || 'all';
    const entityType = searchParams.get('entityType') || 'all';
    const search = (searchParams.get('search') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0);

    const query: Record<string, any> = {};

    if (action !== 'all') query.action = action;
    if (entityType !== 'all') query.entityType = entityType;

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { entityName: searchRegex },
        { summary: searchRegex },
        { entityId: searchRegex },
        { actor: searchRegex },
      ];
    }

    const [total, logs] = await Promise.all([
      AuditLogModel.countDocuments(query),
      AuditLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    return NextResponse.json({
      success: true,
      total,
      limit,
      skip,
      data: logs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
