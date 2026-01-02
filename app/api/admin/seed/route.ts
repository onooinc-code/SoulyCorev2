
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 🔧 Build Stability & UI Refinement (v0.5.37)

**Technical Fixes:**
- **Vercel Build Fix:** Resolved a critical build error where Tailwind's \`@apply\` was used with the \`group\` marker class in \`globals.css\`. Markers are now applied via JSX classNames.
- **Persistent Architecture:** Reinforced the split between \`MobileApp\` and \`DesktopApp\` logic.

**Mobile Optimization:**
- **Native Messaging Experience:** Chat Bubbles are now fully calibrated for RTL (Right-to-Left) and touch ergonomics.
- **Drawer Navigation:** Sidebar remains a secondary layer on mobile, accessible via the bottom menu.

**Desktop Power Mode:**
- **Navigation Tooltips:** Restored interactive tooltips on the Sidebar Rail for lightning-fast hub context.
- **Full-Width Persistence:** Toolbars (Macros & Formatting) are now fixed-width optimized for mouse/keyboard workflows.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.37', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "Build stabilized and version updated to v0.5.37.", version: '0.5.37' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
