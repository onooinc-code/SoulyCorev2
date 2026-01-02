
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 🎨 UX Personalization Engine (v0.5.36)

**Mobile Optimization (The Messaging Flow):**
- **Bubble Chat UI:** Messages now render as distinct bubbles with smart alignment, mimicking high-end messaging apps like Telegram.
- **Adaptive Sizing:** Font sizes and paddings adjusted specifically for mobile viewport ergonomics.
- **Header Refinement:** Minimized mobile header to give more vertical space to the conversation.

**Desktop Optimization (The Power Workspace):**
- **Multi-Pane Architecture:** Persistent navigation rail with interactive tooltips for faster hub switching.
- **Expanded Layout:** Messages now follow a structured, spacious row-based layout optimized for mouse and keyboard usage.
- **Enhanced Visual Feedback:** Active indicators in the Navigation Rail and hover-triggered toolbars for better discoverability.

**Core Restorations:**
- Full-width toolbars remain persistent across all hubs with horizontal scroll protection.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.36', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "Device-optimized UX applied. Updated to v0.5.36.", version: '0.5.36' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
