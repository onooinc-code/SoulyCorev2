
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 🛠️ Stability Patch (v0.5.45)

**Bug Fixes:**
- **Projects Hub Crash:** Fixed a critical client-side crash caused by the task list renderer expecting an array but receiving a different type during error states. Added strict type guards in the UI rendering loop.
- **Tools API Error:** Fixed a 500 Internal Server Error in the Tools API endpoints caused by a case-sensitivity mismatch in the SQL column name ('schemaJson').

**Improvements:**
- **Robustness:** Enhanced error handling in the Projects data fetching logic.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.45', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "System updated to v0.5.45 (Stability Patch).", version: '0.5.45' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
