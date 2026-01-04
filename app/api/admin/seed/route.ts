
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 🧠 Cognitive Engine Stabilization (v0.5.42)

**Core Fixes:**
- **Cognitive Inspector:** Fixed the blank "Context Viewer" modals. The \`ContextAssemblyPipeline\` now explicitly saves \`finalLlmPrompt\`, \`finalSystemInstruction\`, and \`modelConfigJson\` to the database upon completion.
- **Memory Extraction UI:** Resolved the persistent "Extraction data still processing" message. The UI now intelligently searches for the specific \`MemoryExtraction\` pipeline run instead of assuming the first run is the extraction.
- **Pipeline Logging:** Enhanced visibility by ensuring strictly typed pipeline runs for 'ContextAssembly' vs 'MemoryExtraction' are correctly queryable.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.42', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "System updated to v0.5.42 (Cognitive Fixes Applied).", version: '0.5.42' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
