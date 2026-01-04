
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 🧠 Cognitive Assurance Patch (v0.5.47)

**New Features:**
- **Vector Memory Simulator:** Added a "Test Recall" tab to the Project Context modal.
  - Allows users to type a query and perform a live semantic search against the specific project's vector embeddings.
  - Displays matching text snippets and a visual "Similarity Score" bar to verify that memory ingestion was successful and accurate.

**Improvements:**
- **Context Workflow:** The system now automatically switches to the "Test Recall" tab after successfully ingesting new context, prompting the user to verify the memory immediately.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.47', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "System updated to v0.5.47 (Cognitive Assurance Patch).", version: '0.5.47' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
