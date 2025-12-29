
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * @handler GET
 * @description Finds and returns the list of available report files.
 * @returns {Promise<NextResponse>} A JSON list of filenames.
 */
export async function GET() {
    try {
        // Fix: Use path.resolve() to get CWD to avoid TypeScript error with process.cwd()
        const dirPath = path.join(path.resolve(), 'reports');

        // Ensure directory exists
        try {
            await fs.access(dirPath);
        } catch {
            return new NextResponse(JSON.stringify([]), { status: 200 }); // Return empty list if dir doesn't exist yet
        }

        const files = await fs.readdir(dirPath);
        
        // FIX: Updated Regex to accept any file starting with "ResponseTemplate-" and ending with ".html"
        // This allows named reports like "ResponseTemplate-System-Audit.html" to appear.
        const reportFiles = files.filter(file => /^ResponseTemplate-.*\.html$/.test(file));

        // Sort by modification time (newest first)
        const fileStats = await Promise.all(
            reportFiles.map(async (file) => {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);
                return { file, mtime: stats.mtime.getTime() };
            })
        );

        fileStats.sort((a, b) => b.mtime - a.mtime);
        const sortedFiles = fileStats.map(f => f.file);

        return NextResponse.json(sortedFiles);

    } catch (error) {
        console.error('Failed to list reports:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
