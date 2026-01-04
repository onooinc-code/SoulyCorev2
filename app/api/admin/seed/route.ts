
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 🧱 Layout Recovery & Floating Menus (v0.5.40)

**Critical Fixes:**
- **Viewport Locking:** Enforced \`position: fixed\` and \`width: 100vw\` on the root to prevent horizontal sliding during text selection or scrolling.
- **Overflow Sanitization:** Applied \`overflow-wrap: anywhere\` and \`min-w-0\` to all chat bubbles to ensure no message can ever push the viewport width beyond 100%.
- **Menu Visibility:** Resolved \`z-index\` conflicts and parent \`overflow\` clipping. Menus now float correctly above the Chat Input.

**UI Enhancements:**
- **Toggle Buttons:** Added dedicated "⚡ Actions" and "🖋️ Format" buttons at the top of the input area for clear, intuitive access.
- **Elevation:** Increased shadow and backdrop blur on pop-up menus for better contrast in complex chat histories.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.40', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "Floating menus and width constraints applied. Updated to v0.5.40.", version: '0.5.40' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
