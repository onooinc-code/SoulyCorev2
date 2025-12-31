
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 📱 Mobile UI Resilience Overhaul (v0.5.27)

**Major Structural Fixes:**
- **Floating Input Fix:** Resolved "Half-Hidden" input issue by refining Dynamic Viewport (dvh) constraints and removing conflicting fixed positioning.
- **Compact Action Bar:** Toolbars now hide labels on mobile to prevent button overlap, using clear icons and semantic colors.
- **Layout Sandwich:** Fixed the "Missing Footer" bug by enforcing strict flex-shrink-0 rules on the action bar and status bar.
- **Text Interaction Guard:** Implemented global min-width constraints to prevent UI expansion during text selection.
- **Safe Area Padding:** Added iOS home indicator support (safe-bottom) to all persistent footer elements.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.27', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "System repaired and updated to v0.5.27.", version: '0.5.27' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
