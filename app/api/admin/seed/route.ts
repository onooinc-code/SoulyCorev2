
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 📱 Mobile UI Overhaul (v0.5.26)

**Critical Fixes:**
- **Dynamic Viewport Height:** Full transition to \`100dvh\` to ensure the footer and input field never hide behind mobile browser bars.
- **Scrollable Toolbars:** Redesigned macro and formatting toolbars as single-line horizontal scrollable areas to prevent overlap and clashing.
- **Selection Width Protection:** Applied global \`min-width: 0\` and Flexbox constraints to prevent layout breakage during text selection.
- **Cleaner Mobile Typing:** Toolbars are now hidden by default on mobile, with a toggle button to expand them when needed.
- **Responsive Status Bar:** Simplified the status bar for small screens, showing only core metrics.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.26', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "System repaired and updated to v0.5.26.", version: '0.5.26' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
