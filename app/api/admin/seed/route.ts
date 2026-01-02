
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 📱 Architectural Split & Toolbar Recall (v0.5.34)

**Layout Evolution:**
- **Device-Specific Shells:** Implemented \`MobileApp\` and \`DesktopApp\` to provide distinct, optimized experiences. Mobile now uses a full-screen drawer and integrated navigation, while Desktop maintains a multi-pane command center.
- **Toolbar Restoration:** Restored all 12+ macro buttons and 7+ formatting tools.
- **Horizontal Scroll UX:** To handle the increased button count, toolbars now use horizontal scrolling with edge-fade masks, preventing vertical clutter while keeping all power tools accessible.
- **Stability Fixes:** Applied \`min-w-0\` fixes to prevent horizontal layout overflow during mobile text selection.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.34', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "Architecture split and toolbars restored to v0.5.34.", version: '0.5.34' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
