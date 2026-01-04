
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 🛡️ Fault Tolerance Patch (v0.5.46)

**Fixes:**
- **Context Ingestion Hardening:** The API route for injecting project context (/api/projects/.../context) is now fault-tolerant. It wraps storage operations for Semantic (Pinecone), Document (MongoDB), and System (Postgres) memories in individual error handlers.
- **500 Error Prevention:** Prevents the entire "Save to Memory" operation from failing if a secondary storage service (like MongoDB) is disconnected or misconfigured. It will now save to available services and report warnings instead of crashing.

**Improvements:**
- **Granular Logging:** The system log now records exactly which storage tiers succeeded and which failed during ingestion.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.46', changesText]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "System updated to v0.5.46 (Fault Tolerance Patch).", version: '0.5.46' });
    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
