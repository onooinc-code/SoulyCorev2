import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
    try {
        const { filename } = params;
        
        // Security: Prevent directory traversal
        if (filename.includes('..')) {
            return new NextResponse('Invalid filename', { status: 400 });
        }

        // FIX: Replaced `process.cwd()` with `path.resolve()` to avoid Node.js-specific types that cause build errors.
        const filePath = path.join(path.resolve(), 'reports', filename);
        const fileContent = await fs.readFile(filePath, 'utf-8');

        return new NextResponse(fileContent, {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
        });

    } catch (error) {
        // FIX: Changed type from Node-specific `NodeJS.ErrnoException` to a generic object to ensure compatibility and fix build errors.
        if ((error as { code?: string }).code === 'ENOENT') {
             return new NextResponse('Report not found', { status: 404 });
        }
        console.error(`Failed to read report ${params.filename}:`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
