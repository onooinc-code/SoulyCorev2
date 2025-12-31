
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### ⚙️ Memory & Settings Hardening (v0.5.32)

**Critical Architecture Improvements:**
- **Response Parsing V2:** Implemented a regex-based parser in \`ContextAssemblyPipeline\` that isolates JSON output from "chatty" model responses. This prevents the raw JSON/Markdown from leaking into the user chat interface when using Single-Shot extraction.
- **Settings Persistence:** Fixed a state synchronization issue in the Global Settings modal where defaults were overwriting database values on load. Deep merging is now used to preserve nested configurations like \`memoryConfig\`.
- **UI Integrity:** Confirmed 4-tier memory monitors (Semantic, Structured, Graph, Episodic) are accurately reflecting retrieval status.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.32', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "System hardened and updated to v0.5.32.", version: '0.5.32' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
