
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const schemaStatements = [
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
  `CREATE EXTENSION IF NOT EXISTS "pg_trgm";`,

  `CREATE TABLE IF NOT EXISTS "settings" (
    "key" VARCHAR(255) PRIMARY KEY,
    "value" JSONB,
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,

  `CREATE TABLE IF NOT EXISTS "brains" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "configJson" JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`,
  
  `CREATE TABLE IF NOT EXISTS "version_history" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "version" VARCHAR(50) UNIQUE NOT NULL,
    "releaseDate" TIMESTAMPTZ NOT NULL,
    "changes" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now()
  );`,

   `CREATE TABLE IF NOT EXISTS "features" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "overview" TEXT,
    "status" VARCHAR(50) NOT NULL,
    "category" VARCHAR(255),
    "uiUxBreakdownJson" JSONB,
    "logicFlow" TEXT,
    "keyFilesJson" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "lastUpdatedAt" TIMESTAMPTZ DEFAULT now()
  );`
];

export async function GET() {
    // We use a single client instance for the entire operation to ensure Transaction Atomicity.
    const client = await db.connect();
    
    try {
        console.log("Starting Full Database Self-Repair (v0.5.22)...");

        // 1. Start Transaction
        await client.query('BEGIN');

        // 2. Ensure Schema Exists
        for (const statement of schemaStatements) {
            await client.query(statement);
        }
        
        // 3. NUCLEAR OPTION: Clean version history table completely using the SAME client
        // This removes any possibility of race conditions or stale data.
        await client.query('DELETE FROM "version_history"');
        
        // 4. Insert the NEW Version (v0.5.22) using the SAME client
        // Note: We use parameterized queries ($1, $2...) for safety.
        const versionSql = `
            INSERT INTO "version_history" ("version", "releaseDate", "changes")
            VALUES ($1, NOW(), $2)
        `;
        const changesText = `### 🚀 Final Architecture Lock (v0.5.22)

**Critical Fixes:**
- **Atomic Database Seeding:** Rewrote the admin seed route to use a single transactional client, ensuring version updates are strictly persisted.
- **Memory Tier Integration:** All memory modules (Postgres, Pinecone, KV) are now fully aligned with the v2.0 Architecture.
- **Extraction Strategy:** Confirmed implementation of 'Single-Shot' vs 'Background' modes in the Core Engine.`;

        await client.query(versionSql, ['0.5.22', changesText]);

        // 5. Seed Features (Optional but good for health check)
        const featuresSql = `
            INSERT INTO features (name, status, category, "lastUpdatedAt")
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (name) DO UPDATE SET status = EXCLUDED.status;
        `;
        await client.query(featuresSql, ["Core: Context Assembly", "✅ Completed", "Core Engine"]);
        await client.query(featuresSql, ["Core: Memory Extraction", "✅ Completed", "Core Engine"]);
        await client.query(featuresSql, ["UI: Chat Interface", "✅ Completed", "Chat"]);

        // 6. Commit Transaction
        await client.query('COMMIT');
        
        console.log("Database repaired and updated to v0.5.22 successfully.");
        
        return NextResponse.json({ 
            success: true, 
            message: "System successfully repaired and updated to v0.5.22.",
            action: "Reloading..."
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Admin Seed Failed:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        // Always release the client back to the pool
        client.release();
    }
}
