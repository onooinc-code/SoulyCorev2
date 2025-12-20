import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * @handler GET
 * @description Finds and returns the content of the most recent `ResponseTemplate-X.html` file in the /reports directory.
 * @returns {Promise<NextResponse>} An HTML response with the file content or a 404/500 error.
 */
export async function GET() {
    try {
        // FIX: Replaced `process.cwd()` with `path.resolve()` to resolve TypeScript error 'Property cwd does not exist on type Process'.
        const dirPath = path.join(path.resolve(), 'reports');

        // Ensure the directory exists before trying to read it
        try {
            await fs.access(dirPath);
        } catch {
            const notFoundMessage = `
                <div style="font-family: sans-serif; text-align: center; padding: 40px; color: #555;">
                    <h1>404 - Reports Directory Not Found</h1>
                    <p>The <code>reports</code> directory does not exist in the project root.</p>
                </div>
            `;
            return new NextResponse(notFoundMessage, { status: 404, headers: { 'Content-Type': 'text/html' } });
        }

        const files = await fs.readdir(dirPath);

        // FIX: Relaxed regex to accept any file starting with 'ResponseTemplate-' and ending with '.html'.
        // This supports both numbered (ResponseTemplate-1.html) and named (ResponseTemplate-Storage-Analysis.html) files.
        const responseFiles = files.filter(file => file.startsWith('ResponseTemplate-') && file.endsWith('.html'));

        if (responseFiles.length === 0) {
            const notFoundMessage = `
                <div style="font-family: sans-serif; text-align: center; padding: 40px; color: #555;">
                    <h1>404 - No Response Report Found</h1>
                    <p>No <code>ResponseTemplate-*.html</code> files were found in the <code>/reports</code> directory.</p>
                </div>
            `;
            return new NextResponse(notFoundMessage, { status: 404, headers: { 'Content-Type': 'text/html' } });
        }

        // FIX: Improved sorting logic. Instead of parsing numbers from filenames (which fails on text suffixes),
        // we fetch the file statistics (mtime) and sort by the most recently modified.
        const fileStats = await Promise.all(responseFiles.map(async (file) => {
            const filePath = path.join(dirPath, file);
            const stats = await fs.stat(filePath);
            return { file, mtime: stats.mtime.getTime() };
        }));

        // Sort descending by modification time (newest first)
        fileStats.sort((a, b) => b.mtime - a.mtime);
        
        const latestFile = fileStats[0].file;
        const filePath = path.join(dirPath, latestFile);
        const fileContent = await fs.readFile(filePath, 'utf-8');

        return new NextResponse(fileContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
            },
        });

    } catch (error) {
        console.error('Failed to get latest response template:', error);
        const errorDetails = { message: (error as Error).message };
        const errorMessage = `
            <div style="font-family: sans-serif; text-align: center; padding: 40px; color: #D8000C; background-color: #FFBABA;">
                <h1>500 - Internal Server Error</h1>
                <p>Could not read the response file from the server.</p>
                <pre style="text-align: left; background: #fff; padding: 10px; border-radius: 5px; margin-top: 20px;">${JSON.stringify(errorDetails, null, 2)}</pre>
            </div>
        `;
        return new NextResponse(errorMessage, { status: 500, headers: { 'Content-Type': 'text/html' } });
    }
}