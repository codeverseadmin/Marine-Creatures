import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaModel } from '@/models/Media';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse('Media ID required', { status: 400 });
    }

    // Strip optional file extension (e.g. "media-1725...jpg" -> "media-1725...")
    const cleanId = id.replace(/\.[^/.]+$/, '');

    await connectToDatabase();
    const media = await MediaModel.findOne({ id: cleanId }).lean();

    if (!media || !media.data) {
      return new NextResponse('Media not found', { status: 404 });
    }

    // Convert BSON Binary / Buffer into standard Uint8Array
    const rawData = (media.data as any).buffer || media.data;
    const buffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData);

    const isSvg = media.contentType === 'image/svg+xml';
    const headers: Record<string, string> = {
      'Content-Type': media.contentType || 'image/jpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff',
    };

    // If SVG, add strict Content-Security-Policy to neutralize any embedded scripts
    if (isSvg) {
      headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";
      headers['X-Frame-Options'] = 'DENY';
    }

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Failed to stream media:', error);
    return new NextResponse('Failed to retrieve media: ' + error.message, { status: 500 });
  }
}
