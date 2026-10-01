import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';
import CaseStudyModel from '@/models/CaseStudy';
import ClientProjectModel from '@/models/ClientProject';
import { recordAuditLog } from '@/lib/audit';
import { ensureWorldsSeeded } from '@/lib/data/worlds';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Valid Control OS admin session required' },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    await ensureWorldsSeeded();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const section = searchParams.get('section') || 'all';
    const status = searchParams.get('status') || 'all';
    const publicationState = searchParams.get('publication') || 'all';

    // 1. Calculate Real Database-Backed Metrics
    const [
      totalCaseStudies,
      publishedCaseStudies,
      draftCaseStudies,
      archivedCaseStudies,
      totalProjects,
      activeProjects,
      completedProjects,
      archivedProjects,
      galleryCount,
      mediaReviewCount,
    ] = await Promise.all([
      CaseStudyModel.countDocuments({}),
      CaseStudyModel.countDocuments({ published: true, isArchived: { $ne: true } }),
      CaseStudyModel.countDocuments({ published: false, isArchived: { $ne: true } }),
      CaseStudyModel.countDocuments({ isArchived: true }),
      ClientProjectModel.countDocuments({}),
      ClientProjectModel.countDocuments({
        status: { $in: ['lead', 'planning', 'design', 'fabrication', 'installation'] },
        isArchived: { $ne: true },
      }),
      ClientProjectModel.countDocuments({ status: 'completed', isArchived: { $ne: true } }),
      ClientProjectModel.countDocuments({ isArchived: true }),
      CaseStudyModel.countDocuments({ 'gallery.0': { $exists: true } }),
      CaseStudyModel.countDocuments({ imageStatus: { $in: ['NEEDS_REVIEW', 'FALLBACK'] } }),
    ]);

    const metrics = {
      caseStudies: {
        total: totalCaseStudies,
        published: publishedCaseStudies,
        draft: draftCaseStudies,
        archived: archivedCaseStudies,
      },
      clientProjects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        archived: archivedProjects,
      },
      media: {
        projectsWithGallery: galleryCount,
        needsMediaReview: mediaReviewCount,
      },
    };

    // 2. Query Case Studies if requested
    let caseStudies: any[] = [];
    if (section === 'all' || section === 'case_studies') {
      const csQuery: any = {};

      if (publicationState === 'published') {
        csQuery.published = true;
        csQuery.isArchived = { $ne: true };
      } else if (publicationState === 'draft') {
        csQuery.published = false;
        csQuery.isArchived = { $ne: true };
      } else if (publicationState === 'archived') {
        csQuery.isArchived = true;
      }

      if (status !== 'all') {
        csQuery.status = status;
      }

      if (search) {
        csQuery.$or = [
          { title: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } },
          { space: { $regex: search, $options: 'i' } },
          { aquariumVolume: { $regex: search, $options: 'i' } },
          { biome: { $regex: search, $options: 'i' } },
          { designIntent: { $regex: search, $options: 'i' } },
        ];
      }

      caseStudies = await CaseStudyModel.find(csQuery).sort({ updatedAt: -1 }).lean();
    }

    // 3. Query Client Projects if requested
    let clientProjects: any[] = [];
    if (section === 'all' || section === 'client_projects') {
      const cpQuery: any = {};

      if (status !== 'all') {
        cpQuery.status = status;
      }

      if (publicationState === 'archived') {
        cpQuery.isArchived = true;
      } else if (publicationState !== 'all') {
        cpQuery.isArchived = { $ne: true };
      }

      if (search) {
        cpQuery.$or = [
          { projectName: { $regex: search, $options: 'i' } },
          { id: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { clientName: { $regex: search, $options: 'i' } },
          { aquariumVolume: { $regex: search, $options: 'i' } },
        ];
      }

      clientProjects = await ClientProjectModel.find(cpQuery).sort({ updatedAt: -1 }).lean();
    }

    return NextResponse.json({
      success: true,
      metrics,
      caseStudies,
      clientProjects,
    });
  } catch (err: any) {
    console.error('[AdminWorlds] GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Valid Control OS admin session required' },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    const body = await req.json();
    const entity = body.entity || 'case_study';

    // -----------------------------------------------------------------
    // CASE STUDY CREATION
    // -----------------------------------------------------------------
    if (entity === 'case_study') {
      if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
        return NextResponse.json({ success: false, error: 'Case Study title is required.' }, { status: 400 });
      }

      const cleanTitle = body.title.trim();
      let slug = (body.slug || body.id || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (!slug) {
        slug = cleanTitle
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      // Verify slug uniqueness
      const existing = await CaseStudyModel.findOne({ $or: [{ id: slug }, { slug }] }).lean();
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Slug "${slug}" is already in use by "${existing.title}". Specify a unique slug.` },
          { status: 409 }
        );
      }

      const caseStudyDoc = await CaseStudyModel.create({
        id: slug,
        slug,
        title: cleanTitle,
        subtitle: body.subtitle?.trim(),
        eyebrow: body.eyebrow?.trim(),
        projectId: body.projectId?.trim(),
        status: body.status || 'draft',
        published: body.published === true,
        publishedAt: body.published ? new Date() : undefined,
        featured: body.featured === true,
        space: body.space?.trim() || 'Private Residence',
        clientContext: body.clientContext?.trim(),
        scale: body.scale?.trim() || 'Bespoke Architectural Installation',
        aquariumVolume: body.aquariumVolume?.trim(),
        aquariumType: body.aquariumType?.trim(),
        biome: body.biome?.trim(),
        image: body.image?.trim() || 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
        gallery: Array.isArray(body.gallery) ? body.gallery : [],
        beforeAfter: body.beforeAfter || undefined,
        imageStatus: body.imageStatus || 'VERIFIED',
        designIntent: body.designIntent?.trim() || '',
        result: body.result?.trim() || '',
        materials: Array.isArray(body.materials) ? body.materials : [],
        engineering: Array.isArray(body.engineering) ? body.engineering : [],
        marineWorld: body.marineWorld || { biome: '', livestock: '', corals: '' },
        introduction: body.introduction?.trim(),
        challenge: body.challenge?.trim(),
        concept: body.concept?.trim(),
        architecture: body.architecture?.trim(),
        execution: body.execution?.trim(),
        transformation: body.transformation?.trim(),
        conclusion: body.conclusion?.trim(),
        seoTitle: body.seoTitle?.trim(),
        seoDescription: body.seoDescription?.trim(),
        canonicalOverride: body.canonicalOverride?.trim(),
        ogTitle: body.ogTitle?.trim(),
        ogDescription: body.ogDescription?.trim(),
        ogImage: body.ogImage?.trim(),
        noIndex: Boolean(body.noIndex),
      });

      // Link to Client Project if provided
      if (body.projectId) {
        await ClientProjectModel.updateOne(
          { id: body.projectId },
          { $set: { caseStudyId: slug } }
        );
      }

      await recordAuditLog({
        action: 'CASE_STUDY_CREATED',
        entityType: 'case_study',
        entityId: slug,
        entityName: cleanTitle,
        summary: `Created Case Study "${cleanTitle}" [${slug}]`,
        details: { slug, published: body.published },
        req,
      });

      return NextResponse.json({ success: true, data: caseStudyDoc }, { status: 201 });
    }

    // -----------------------------------------------------------------
    // CLIENT PROJECT CREATION
    // -----------------------------------------------------------------
    if (entity === 'client_project') {
      if (!body.projectName || typeof body.projectName !== 'string' || !body.projectName.trim()) {
        return NextResponse.json({ success: false, error: 'Project name is required.' }, { status: 400 });
      }

      const cleanProjectName = body.projectName.trim();
      let projectCode = (body.id || body.projectCode || '').trim().toUpperCase();

      if (!projectCode) {
        const count = await ClientProjectModel.countDocuments({});
        const year = new Date().getFullYear();
        projectCode = `CP-${year}-${String(count + 1).padStart(3, '0')}`;
      }

      const existingProject = await ClientProjectModel.findOne({ id: projectCode }).lean();
      if (existingProject) {
        return NextResponse.json(
          { success: false, error: `Project code "${projectCode}" already exists. Please specify a unique code.` },
          { status: 409 }
        );
      }

      const projectDoc = await ClientProjectModel.create({
        id: projectCode,
        projectName: cleanProjectName,
        status: body.status || 'lead',
        installationStatus: body.installationStatus || 'pending',
        aquariumVolume: body.aquariumVolume?.trim(),
        aquariumType: body.aquariumType?.trim(),
        biome: body.biome?.trim(),
        designStyle: body.designStyle?.trim(),
        materials: Array.isArray(body.materials) ? body.materials : [],
        equipment: Array.isArray(body.equipment) ? body.equipment : [],
        marineLifeNotes: body.marineLifeNotes?.trim(),
        installationDetails: body.installationDetails?.trim(),
        city: body.city?.trim() || 'Kolkata',
        siteType: body.siteType || 'residential',
        privateAddress: body.privateAddress?.trim(),
        clientName: body.clientName?.trim(),
        clientPhone: body.clientPhone?.trim(),
        clientEmail: body.clientEmail?.trim(),
        projectStartDate: body.projectStartDate ? new Date(body.projectStartDate) : undefined,
        projectCompletionDate: body.projectCompletionDate ? new Date(body.projectCompletionDate) : undefined,
        internalNotes: body.internalNotes?.trim(),
        estimatedBudget: typeof body.estimatedBudget === 'number' ? body.estimatedBudget : undefined,
        internalGallery: Array.isArray(body.internalGallery) ? body.internalGallery : [],
      });

      await recordAuditLog({
        action: 'CLIENT_PROJECT_CREATED',
        entityType: 'client_project',
        entityId: projectCode,
        entityName: cleanProjectName,
        summary: `Created Client Project "${cleanProjectName}" [${projectCode}]`,
        details: { projectCode, city: projectDoc.city },
        req,
      });

      return NextResponse.json({ success: true, data: projectDoc }, { status: 201 });
    }

    // -----------------------------------------------------------------
    // CREATE CASE STUDY FROM CLIENT PROJECT (PRIVACY PROTECTED)
    // -----------------------------------------------------------------
    if (entity === 'case_study_from_project') {
      const { projectId } = body;
      if (!projectId) {
        return NextResponse.json({ success: false, error: 'Project ID is required.' }, { status: 400 });
      }

      const project = await ClientProjectModel.findOne({ id: projectId }).lean();
      if (!project) {
        return NextResponse.json({ success: false, error: 'Client project not found.' }, { status: 404 });
      }

      // Generate unique slug
      let baseSlug = project.projectName
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      let candidateSlug = baseSlug;
      let counter = 1;
      while (await CaseStudyModel.findOne({ id: candidateSlug })) {
        candidateSlug = `${baseSlug}-${counter++}`;
      }

      // PRIVACY BOUNDARY: Copies ONLY architectural & biotope specs.
      // NEVER copies clientName, clientPhone, clientEmail, privateAddress, internalNotes, or internal budget!
      const newCaseStudy = await CaseStudyModel.create({
        id: candidateSlug,
        slug: candidateSlug,
        title: project.projectName,
        subtitle: project.designStyle || 'Architectural Marine Living Installation',
        eyebrow: 'CASE STUDY DRAFT',
        projectId: project.id,
        status: 'draft',
        published: false,
        featured: false,
        space: `${project.siteType.charAt(0).toUpperCase() + project.siteType.slice(1)} Space, ${project.city}`,
        scale: project.aquariumVolume || 'Bespoke Scale',
        aquariumVolume: project.aquariumVolume,
        aquariumType: project.aquariumType,
        biome: project.biome,
        image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
        gallery: [],
        imageStatus: 'NEEDS_REVIEW',
        designIntent: `Architectural ocean commission engineered for luxury ${project.siteType} setting.`,
        result: 'Project currently undergoing bespoke design and commissioning stages.',
        materials: project.materials || [],
        engineering: project.equipment || [],
        marineWorld: {
          biome: project.biome || 'Coral Biotope',
          livestock: project.marineLifeNotes || '',
          corals: '',
        },
      });

      // Link back to project
      await ClientProjectModel.updateOne(
        { id: project.id },
        { $set: { caseStudyId: candidateSlug } }
      );

      await recordAuditLog({
        action: 'CLIENT_PROJECT_CASE_STUDY_LINKED',
        entityType: 'case_study',
        entityId: candidateSlug,
        entityName: newCaseStudy.title,
        summary: `Created Draft Case Study "${newCaseStudy.title}" from Project [${project.id}]`,
        details: { projectId: project.id, caseStudyId: candidateSlug },
        req,
      });

      return NextResponse.json({ success: true, data: newCaseStudy }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: 'Invalid entity type specified.' }, { status: 400 });
  } catch (err: any) {
    console.error('[AdminWorlds] POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Valid Control OS admin session required' },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, entity = 'case_study', action } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Identifier (id) is required.' }, { status: 400 });
    }

    // -----------------------------------------------------------------
    // CASE STUDY PATCH OPERATIONS
    // -----------------------------------------------------------------
    if (entity === 'case_study') {
      const existing = await CaseStudyModel.findOne({ $or: [{ id }, { slug: id }] });
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Case Study not found.' }, { status: 404 });
      }

      // Action: Publish
      if (action === 'publish') {
        existing.published = true;
        existing.status = 'published';
        existing.publishedAt = existing.publishedAt || new Date();
        await existing.save();

        await recordAuditLog({
          action: 'CASE_STUDY_PUBLISHED',
          entityType: 'case_study',
          entityId: existing.id,
          entityName: existing.title,
          summary: `Published Case Study "${existing.title}" to public Worlds portfolio`,
          details: { slug: existing.slug },
          req,
        });

        return NextResponse.json({ success: true, data: existing });
      }

      // Action: Unpublish
      if (action === 'unpublish') {
        existing.published = false;
        existing.status = 'draft';
        await existing.save();

        await recordAuditLog({
          action: 'CASE_STUDY_UNPUBLISHED',
          entityType: 'case_study',
          entityId: existing.id,
          entityName: existing.title,
          summary: `Unpublished Case Study "${existing.title}" (moved to draft)`,
          details: { slug: existing.slug },
          req,
        });

        return NextResponse.json({ success: true, data: existing });
      }

      // Action: Archive
      if (action === 'archive') {
        existing.isArchived = true;
        existing.status = 'archived';
        existing.published = false; // Archived items cannot remain publicly published
        existing.archivedAt = new Date();
        await existing.save();

        await recordAuditLog({
          action: 'CASE_STUDY_ARCHIVED',
          entityType: 'case_study',
          entityId: existing.id,
          entityName: existing.title,
          summary: `Archived Case Study "${existing.title}"`,
          details: { slug: existing.slug },
          req,
        });

        return NextResponse.json({ success: true, data: existing });
      }

      // Action: Unarchive
      if (action === 'unarchive') {
        existing.isArchived = false;
        existing.status = 'draft';
        existing.archivedAt = undefined;
        await existing.save();

        await recordAuditLog({
          action: 'CASE_STUDY_UPDATED',
          entityType: 'case_study',
          entityId: existing.id,
          entityName: existing.title,
          summary: `Restored archived Case Study "${existing.title}" to draft`,
          details: { slug: existing.slug },
          req,
        });

        return NextResponse.json({ success: true, data: existing });
      }

      // Action: Duplicate (Safe draft copy)
      if (action === 'duplicate') {
        const copySlug = `${existing.slug}-copy-${Date.now().toString(36)}`;
        const duplicateData: any = existing.toObject();
        delete duplicateData._id;
        delete duplicateData.__v;

        const duplicatedDoc = await CaseStudyModel.create({
          ...duplicateData,
          id: copySlug,
          slug: copySlug,
          title: `${existing.title} (Draft Copy)`,
          status: 'draft',
          published: false,
          publishedAt: undefined,
          isArchived: false,
          archivedAt: undefined,
          projectId: undefined, // Disassociate from active client project
        });

        await recordAuditLog({
          action: 'CASE_STUDY_DUPLICATED',
          entityType: 'case_study',
          entityId: copySlug,
          entityName: duplicatedDoc.title,
          summary: `Duplicated Case Study from "${existing.title}" to "${duplicatedDoc.title}"`,
          details: { sourceSlug: existing.slug, targetSlug: copySlug },
          req,
        });

        return NextResponse.json({ success: true, data: duplicatedDoc }, { status: 201 });
      }

      // Standard Update
      const allowedFields = [
        'title',
        'subtitle',
        'eyebrow',
        'projectId',
        'space',
        'clientContext',
        'scale',
        'aquariumVolume',
        'aquariumType',
        'biome',
        'image',
        'gallery',
        'beforeAfter',
        'imageStatus',
        'designIntent',
        'result',
        'materials',
        'engineering',
        'marineWorld',
        'introduction',
        'challenge',
        'concept',
        'architecture',
        'execution',
        'transformation',
        'conclusion',
        'featured',
        'seoTitle',
        'seoDescription',
        'canonicalOverride',
        'ogTitle',
        'ogDescription',
        'ogImage',
        'noIndex',
      ];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          (existing as any)[field] = body[field];
        }
      }

      await existing.save();

      await recordAuditLog({
        action: 'CASE_STUDY_UPDATED',
        entityType: 'case_study',
        entityId: existing.id,
        entityName: existing.title,
        summary: `Updated Case Study "${existing.title}"`,
        details: { slug: existing.slug },
        req,
      });

      return NextResponse.json({ success: true, data: existing });
    }

    // -----------------------------------------------------------------
    // CLIENT PROJECT PATCH OPERATIONS
    // -----------------------------------------------------------------
    if (entity === 'client_project') {
      const existingProject = await ClientProjectModel.findOne({ id });
      if (!existingProject) {
        return NextResponse.json({ success: false, error: 'Client project not found.' }, { status: 404 });
      }

      if (action === 'archive') {
        existingProject.isArchived = true;
        existingProject.status = 'archived';
        existingProject.archivedAt = new Date();
        await existingProject.save();

        await recordAuditLog({
          action: 'CLIENT_PROJECT_ARCHIVED',
          entityType: 'client_project',
          entityId: existingProject.id,
          entityName: existingProject.projectName,
          summary: `Archived Client Project "${existingProject.projectName}"`,
          details: { projectCode: existingProject.id },
          req,
        });

        return NextResponse.json({ success: true, data: existingProject });
      }

      if (action === 'unarchive') {
        existingProject.isArchived = false;
        existingProject.status = 'lead';
        existingProject.archivedAt = undefined;
        await existingProject.save();

        await recordAuditLog({
          action: 'CLIENT_PROJECT_UPDATED',
          entityType: 'client_project',
          entityId: existingProject.id,
          entityName: existingProject.projectName,
          summary: `Restored Client Project "${existingProject.projectName}" from archive`,
          details: { projectCode: existingProject.id },
          req,
        });

        return NextResponse.json({ success: true, data: existingProject });
      }

      // Standard Project Update
      const allowedProjectFields = [
        'projectName',
        'status',
        'installationStatus',
        'aquariumVolume',
        'aquariumType',
        'biome',
        'designStyle',
        'materials',
        'equipment',
        'marineLifeNotes',
        'installationDetails',
        'city',
        'siteType',
        'privateAddress',
        'clientName',
        'clientPhone',
        'clientEmail',
        'projectStartDate',
        'projectCompletionDate',
        'internalNotes',
        'estimatedBudget',
        'caseStudyId',
        'internalGallery',
      ];

      for (const field of allowedProjectFields) {
        if (body[field] !== undefined) {
          (existingProject as any)[field] = body[field];
        }
      }

      await existingProject.save();

      await recordAuditLog({
        action: 'CLIENT_PROJECT_UPDATED',
        entityType: 'client_project',
        entityId: existingProject.id,
        entityName: existingProject.projectName,
        summary: `Updated Client Project "${existingProject.projectName}"`,
        details: { projectCode: existingProject.id, status: existingProject.status },
        req,
      });

      return NextResponse.json({ success: true, data: existingProject });
    }

    return NextResponse.json({ success: false, error: 'Invalid entity specified.' }, { status: 400 });
  } catch (err: any) {
    console.error('[AdminWorlds] PATCH error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Valid Control OS admin session required' },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const entity = searchParams.get('entity') || 'case_study';
    const confirm = searchParams.get('confirm') === 'true';

    if (!id) {
      return NextResponse.json({ success: false, error: 'Identifier (id) is required.' }, { status: 400 });
    }

    if (!confirm) {
      return NextResponse.json(
        { success: false, error: 'Explicit secondary confirmation parameter (confirm=true) is required.' },
        { status: 400 }
      );
    }

    if (entity === 'case_study') {
      const deleted = await CaseStudyModel.findOneAndDelete({ $or: [{ id }, { slug: id }] });
      if (!deleted) {
        return NextResponse.json({ success: false, error: 'Case Study not found.' }, { status: 404 });
      }

      await recordAuditLog({
        action: 'CASE_STUDY_ARCHIVED',
        entityType: 'case_study',
        entityId: id,
        entityName: deleted.title,
        summary: `Permanently deleted Case Study "${deleted.title}" via secondary confirmation`,
        details: { slug: deleted.slug },
        req,
      });

      return NextResponse.json({ success: true, message: `Case Study "${deleted.title}" deleted.` });
    }

    if (entity === 'client_project') {
      const deletedProject = await ClientProjectModel.findOneAndDelete({ id });
      if (!deletedProject) {
        return NextResponse.json({ success: false, error: 'Client project not found.' }, { status: 404 });
      }

      await recordAuditLog({
        action: 'CLIENT_PROJECT_ARCHIVED',
        entityType: 'client_project',
        entityId: id,
        entityName: deletedProject.projectName,
        summary: `Permanently deleted Client Project "${deletedProject.projectName}" via secondary confirmation`,
        details: { projectCode: id },
        req,
      });

      return NextResponse.json({ success: true, message: `Client project "${deletedProject.projectName}" deleted.` });
    }

    return NextResponse.json({ success: false, error: 'Invalid entity specified.' }, { status: 400 });
  } catch (err: any) {
    console.error('[AdminWorlds] DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
