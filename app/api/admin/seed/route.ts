
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 🩹 UI Critical Fix: Scroll Restoration (v0.5.31)

**Stability Improvements:**
- **Scroll Fix:** Restored the vertical scrollbar to the message list that was inadvertently hidden in the previous update.
- **Visual Polish:** Refined the custom scrollbar style to be more visible on dark backgrounds.
- **Layout Integrity:** Hardened the flexbox rules for ChatWindow to prevent message clipping on iOS and Android browsers.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.31', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "Scroll restored and updated to v0.5.31.", version: '0.5.31' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
