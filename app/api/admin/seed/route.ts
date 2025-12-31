
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 🧠 Memory Nexus & RAG Fix (v0.5.29)

**Critical Cognitive Improvements:**
- **Contextual Retrieval:** Entities are now retrieved using "Query Expansion", allowing the AI to remember information from other chats even when the current prompt is vague.
- **Real-time Vector Sync:** Fixed a bug where updated entities weren't re-indexed in the vector store; memory is now synchronized across all tiers immediately after extraction.
- **Enhanced Awareness:** Gemini is now explicitly instructed to acknowledge and use the "Shared Memory" block during chat turns.
- **Stability:** Hardened the pipeline against API quota failures with better error trapping.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.29', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "Cognitive paths re-linked and updated to v0.5.29.", version: '0.5.29' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
