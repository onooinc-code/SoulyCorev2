import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const file = req.body || '';
  const filename = req.headers.get('x-vercel-filename') || 'file';
  const contentType = req.headers.get('content-type') || 'application/octet-stream';
  const fileSize = req.headers.get('content-length');

  try {
    const blob = await put(filename, file, {
      contentType,
      access: 'public',
    });

    // Store metadata in the database
    await sql`
        INSERT INTO documents (filename, mime_type, storage_url, size_bytes)
        VALUES (${filename}, ${contentType}, ${blob.url}, ${fileSize ? parseInt(fileSize, 10) : null});
    `;

    return NextResponse.json(blob);

  } catch (error) {
    console.error("Error in file upload API:", error);
    const message = (error as Error).message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
