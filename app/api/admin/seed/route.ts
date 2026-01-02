
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 📱 Multi-Shell Architecture & Power Tools Recall (v0.5.35)

**Layout Specialization:**
- **Architecture Split:** Implemented specialized \`MobileApp\` and \`DesktopApp\` wrappers. The app now adapts its structural hierarchy (Drawer vs Navigation Rail) based on the device type.
- **Full-Width Toolbars:** Restored all 12+ macro buttons and 7+ formatting tools.
- **Enhanced Horizontal Scroll:** To maintain a compact vertical footprint, toolbars now use a full-width horizontally scrollable layout with edge-fade masks.
- **Mobile Labels:** Labels are hidden on mobile to maximize icon visibility, while remaining active on desktop for clarity.
- **Mobile Drawer:** Conversation history is now housed in a full-screen drawer on mobile for a native-app feel.
- **Desktop Command Center:** Desktop maintains a persistent, multi-pane "war room" style layout with constant access to cognitive monitors.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.35', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "Multi-shell architecture and toolbars restored to v0.5.35.", version: '0.5.35' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
