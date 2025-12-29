
import { NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';

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
  );`
];

export async function GET() {
    const client = await db.connect();
    
    try {
        console.log("Starting Full Database Self-Repair...");

        // 1. Initialize Schema
        await client.query('BEGIN');
        for (const statement of schemaStatements) {
            await client.query(statement);
        }
        
        // --- CRITICAL FIX: Clean version history to fix display ordering issues ---
        // This ensures the latest seeded version is the undeniable truth.
        await client.query('TRUNCATE TABLE "version_history";');
        
        await client.query('COMMIT');
        console.log("Schema initialization & cleaning complete.");

        // 2. Seed Version History (v0.5.21) - Now inserted into a clean table
        await sql`
            INSERT INTO "version_history" ("version", "releaseDate", "changes")
            VALUES ('0.5.21', NOW(), '### 🧠 Advanced Memory Control (v0.5.21)\n\n**New Features:**\n- **Extraction Strategy Selector:** Users can now choose between "Single-Shot" (Fast/Efficient) and "Background" (High Accuracy) memory extraction modes.\n- **Configurable Models:** The model used for background extraction can be customized (e.g., use Pro for complex analysis, Flash for speed).\n- **Granular Control:** Settings can be defined globally and overridden per conversation in the Agent Setup menu.')
            ON CONFLICT ("version") DO UPDATE SET
                "releaseDate" = EXCLUDED."releaseDate",
                "changes" = EXCLUDED."changes";
        `;

        // 3. Seed Basic Features
        const features = [
            { name: "Core: Context Assembly", status: "✅ Completed", category: "Core Engine" },
            { name: "Core: Memory Extraction", status: "✅ Completed", category: "Core Engine" },
            { name: "UI: Chat Interface", status: "✅ Completed", category: "Chat" },
            { name: "Core: Autonomous Agent Engine", status: "✅ Completed", category: "Agent System" }
        ];

        for (const f of features) {
            await sql`
                INSERT INTO features (name, status, category, "lastUpdatedAt")
                VALUES (${f.name}, ${f.status}, ${f.category}, NOW())
                ON CONFLICT (name) DO UPDATE SET status = EXCLUDED.status;
            `;
        }
        
        return NextResponse.json({ 
            success: true, 
            message: "Database schema repaired, version history cleaned, and updated to v0.5.21.",
            action: "Page will reload automatically."
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Admin Seed Failed:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
