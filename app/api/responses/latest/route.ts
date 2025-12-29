
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * @handler GET
 * @description Finds and returns the content of the most recently modified HTML file in the reports directory.
 */
export async function GET() {
    try {
        const dirPath = path.join(path.resolve(), 'reports');

        // Ensure directory exists
        try {
            await fs.access(dirPath);
        } catch {
            return new NextResponse('Reports directory not found.', { status: 404 });
        }

        const files = await fs.readdir(dirPath);
        
        // Filter for HTML files only
        const htmlFiles = files.filter(file => file.endsWith('.html'));

        if (htmlFiles.length === 0) {
            const notFoundHtml = `
                <div style="font-family: sans-serif; text-align: center; padding: 40px; color: #555;">
                    <h1>404 - No Reports Found</h1>
                    <p>No HTML reports were found in the <code>/reports</code> directory.</p>
                </div>
            `;
            return new NextResponse(notFoundHtml, { status: 404, headers: { 'Content-Type': 'text/html' } });
        }

        // Get stats for all files to sort by modification time
        const fileStats = await Promise.all(
            htmlFiles.map(async (file) => {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);
                return { file, mtime: stats.mtime.getTime() };
            })
        );

        // Sort descending (newest first)
        fileStats.sort((a, b) => b.mtime - a.mtime);

        const latestFile = fileStats[0].file;
        const latestFilePath = path.join(dirPath, latestFile);
        const fileContent = await fs.readFile(latestFilePath, 'utf-8');

        return new NextResponse(fileContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
            },
        });

    } catch (error) {
        console.error('Failed to get latest response report:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
