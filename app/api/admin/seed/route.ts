
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 🧠 Cognitive & Observability Enhancement (v0.5.43)

**Core Fixes:**
- **Full Observability:** Implemented granular logging for all Context Assembly and Memory Extraction steps directly to the central \`logs\` table, visible in the Dev Center.
- **Memory Monitors:** Fixed the 4 Memory Monitor indicators in the Status Bar to react in real-time to the API's returned metadata (Context retrieval stats).
- **Log Panel:** Added "Copy Errors", "Copy Logs", and "Download JSON" buttons for better debugging.
- **Extraction UI:** Refined the "Extracted" button logic to correctly locate the background extraction run even if it completes after the initial response.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.43', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "System updated to v0.5.43 (Observability Fixes Applied).", version: '0.5.43' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
