
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 🧱 Layout Horizontal Lock & Full-Width Recall (v0.5.38)

**Critical Responsive Fixes:**
- **Zero Horizontal Scroll:** Added \`overflow-x: hidden\` and \`min-w-0\` to all major layout containers and flex items to prevent width expansion on mobile.
- **Full-Width Toolbars:** Adjusted \`ChatInput\` toolbars to span the full width of the mobile viewport with edge-fade masks for aesthetic scrolling.
- **Bubble Constraint:** Forced chat bubbles to a max-width of 88% on mobile with enforced \`word-break\` to prevent layout breakage from long text or links.
- **Code Block Isolation:** Markdown code blocks now have internal horizontal scrolling, protecting the main conversation layout from stretching.

**Stability:**
- Reinforce \`box-sizing: border-box\` globally to ensure padding doesn't push elements out of the viewport.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.38', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "Layout locked to viewport. Updated to v0.5.38.", version: '0.5.38' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
