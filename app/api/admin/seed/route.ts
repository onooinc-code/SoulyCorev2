
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 🧠 Project Knowledge Injection (v0.5.44)

**New Features:**
- **Project Technical Context:** Added a dedicated module to inject Business Logic, DB Schemas, and Code Snippets directly into a project's memory.
- **Context Modal:** A new UI in Projects Hub to paste and categorize technical data.
- **Smart Ingestion:** The system now automatically routes project context to both Semantic Memory (for RAG) and Document Memory (for Archival).

**Improvements:**
- **Projects Hub:** Updated UI to include the new "Technical Context" action.
- **Versioning:** Bumped system version to v0.5.44.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.44', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "System updated to v0.5.44 (Project Knowledge Injection).", version: '0.5.44' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
