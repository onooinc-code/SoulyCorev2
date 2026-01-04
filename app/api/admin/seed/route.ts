
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 💎 UI Refinement: The Unified Pill (v0.5.39)

**Responsive Layout Stabilization:**
- **Zero Scroll Implementation:** Enforced strict \`100vw\` viewport locking across the entire application stack.
- **Auto-Containment:** Fixed layout expansion bugs caused by long links or code blocks using \`overflow-x: hidden\` on primary containers.
- **Bubble Calibration:** Adjusted mobile bubbles to \`85% max-width\` with enforced word-wrapping for native-feel messaging.

**Input Experience Upgrade:**
- **Pill Architecture:** Unified \`ChatInput\` into a single elegant pill design, saving 25% vertical space on mobile.
- **Retractable Menus:** Replaced horizontal toolbars with on-demand pop-up menus for Macros (⚡) and Formatting (🖋️).
- **Z-Index Correction:** Resolved menu overlapping and focus issues during mobile interaction.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.39', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "Pill UI and menu architecture applied. Updated to v0.5.39.", version: '0.5.39' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
