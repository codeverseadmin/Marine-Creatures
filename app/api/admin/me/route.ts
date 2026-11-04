import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthContext } from '@/lib/rbac/guard';
import { SYSTEM_ROLES } from '@/lib/rbac/permissions';
import { RoleModel } from '@/models/Role';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthContext(req);

    if (!auth.authenticated) {
      return NextResponse.json(
        { authenticated: false, error: auth.error },
        { status: auth.statusCode }
      );
    }

    let roleName = auth.roleId;
    if (SYSTEM_ROLES[auth.roleId]) {
      roleName = SYSTEM_ROLES[auth.roleId].name;
    } else {
      await connectToDatabase();
      const customRole = await RoleModel.findOne({ id: auth.roleId });
      if (customRole) {
        roleName = customRole.name;
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: auth.actorId,
        name: auth.actorName,
        email: auth.actorEmail,
        roleId: auth.roleId,
        roleName,
        permissions: Array.from(auth.permissions),
        isOwner: auth.isOwner,
        isBootstrap: auth.type === 'bootstrap_owner',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: 'Internal authorization error' },
      { status: 500 }
    );
  }
}

