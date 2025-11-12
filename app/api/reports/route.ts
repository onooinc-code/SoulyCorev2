

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
// FIX: Replaced `process.cwd()` with `path.resolve()` which requires importing the 'path' module.
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * @handler GET
 * @description Finds and returns the content of the most recent `ResponseTemplate-X.html` file.
 * @returns {Promise<NextResponse>} An HTML response with the file content or a 404/500 error.
 */
export async function GET() {
    try {
        // FIX: Replaced `process.cwd()` with `path.resolve()` to resolve a TypeScript error where the `cwd` method was not found on the `Process` type. This change maintains the original logic while fixing the type issue.
        const dirPath = path.resolve();
        const files = await fs.readdir(dirPath);

        const responseFiles = files.filter(file => /^ResponseTemplate-\d+\.html$/.test(file));

        if (responseFiles.length === 0) {
            const notFoundMessage = `
                <div style="font-family: sans-serif; text-align: center; padding: 40px; color: #555;">
                    <h1>404 - No Response Report Found</h1>
                    <p>No <code>ResponseTemplate-X.html</code> files were found in the project directory.</p>
                </div>
            `;
            return new NextResponse(notFoundMessage, { status: 404, headers: { 'Content-Type': 'text/html' } });
        }

        const latestFile = responseFiles.reduce((latest, current) => {
            const latestNum = parseInt(latest.match(/(\d+)/)?.[0] || '0', 10);
            const currentNum = parseInt(current.match(/(\d+)/)?.[0] || '0', 10);
            return currentNum > latestNum ? current : latest;
        });

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
        // FIX: Changed type from Node-specific `NodeJS.ErrnoException` to a generic object with an optional `code` property to ensure compatibility across JavaScript runtimes and avoid build errors.
        if ((error as { code?: string }).code === 'ENOENT') {
            return new NextResponse('The `reports` directory does not exist.', { status: 404, headers: { 'Content-Type': 'text/html' } });
        }
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