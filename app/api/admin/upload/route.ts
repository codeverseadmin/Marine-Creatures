import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaModel } from '@/models/Media';
import { isAdminRequest, getAdminPasscode } from '@/lib/auth';

// 25 MB max upload limit for specimen photos/videos
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate admin
    const passcodeHeader = req.headers.get('x-admin-passcode') || req.headers.get('x-admin-secret');
    const isAuthed = isAdminRequest(req) || (passcodeHeader && passcodeHeader.trim() === getAdminPasscode());

    if (!isAuthed) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const requestedType = (formData.get('type') as string) || 'image';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'File exceeds 25MB maximum limit' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || (requestedType === 'video' ? 'video/mp4' : 'image/jpeg');

    // 3. Option A: Cloudinary CDN Direct Upload (if environment variables configured)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      try {
        const timestamp = Math.round(Date.now() / 1000);
        const signaturePayload = `timestamp=${timestamp}${apiSecret}`;
        
        // SHA-1 signature
        const crypto = await import('crypto');
        const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

        const cloudFormData = new FormData();
        cloudFormData.append('file', new Blob([buffer], { type: contentType }));
        cloudFormData.append('api_key', apiKey);
        cloudFormData.append('timestamp', timestamp.toString());
        cloudFormData.append('signature', signature);
        cloudFormData.append('folder', 'marine-creatures');

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/${requestedType === 'video' ? 'video' : 'image'}/upload`,
          {
            method: 'POST',
            body: cloudFormData,
          }
        );

        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          return NextResponse.json({
            success: true,
            provider: 'cloudinary',
            url: cloudData.secure_url || cloudData.url,
            filename: file.name,
            size: file.size,
            type: requestedType,
          });
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload fallback to MongoDB store:', cloudErr);
      }
    }

    // 4. Option B: High-Performance MongoDB Atlas Binary Storage
    await connectToDatabase();

    const extMatch = file.name.match(/\.([0-9a-z]+)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : (requestedType === 'video' ? 'mp4' : 'jpg');
    const mediaId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await MediaModel.create({
      id: mediaId,
      filename: file.name,
      contentType,
      size: file.size,
      data: buffer,
      type: requestedType === 'video' ? 'video' : 'image',
    });

    const permanentUrl = `/api/media/${mediaId}.${ext}`;

    return NextResponse.json({
      success: true,
      provider: 'mongodb-binary',
      url: permanentUrl,
      mediaId,
      filename: file.name,
      size: file.size,
      type: requestedType,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Admin media upload failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 });
  }
}
