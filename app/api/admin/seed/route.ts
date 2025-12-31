
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 🛠️ Toolbar Restoration & Stability (v0.5.28)

**Major Layout Improvements:**
- **Toolbar Recall:** Restored the Macro and Formatting bars to permanent visibility as per user request.
- **Horizontal Scroll Protection:** Prevented layout breakage by using horizontal scrolling for tools, ensuring the input area remains compact vertically.
- **Mobile Label Optimization:** Toolbars automatically switch to icon-only mode on mobile to prevent overlapping.
- **RTL Support:** Refined toolbar alignment and labels for Arabic users.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.28', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "System repaired and updated to v0.5.28.", version: '0.5.28' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
