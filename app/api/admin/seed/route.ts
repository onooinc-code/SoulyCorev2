
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
    const client = await db.connect();
    
    try {
        console.log("Starting Full Database Self-Repair (v0.5.25) - FORCE MODE...");

        await client.query('BEGIN');

        for (const statement of schemaStatements) {
            await client.query(statement);
        }
        
        await client.query('TRUNCATE TABLE "version_history"');
        
        const changesText = `### 📱 Mobile UI Resilience Update (v0.5.25)

**Major Fixes:**
- **The "Width-Break" Solution:** Implemented \`min-w-0\` and explicit \`max-w-full\` constraints on the chat input flex components. This prevents the entire UI from breaking during text selection on mobile browsers.
- **Stable Layout:** Switched to \`fixed\` positioning for body and \`100dvh\` for the chat container to ensure the footer and input never hide behind browser toolbars.
- **Touch Optimization:** Enhanced touch targets for primary action buttons (Send, File, Toggles) and enabled native momentum scrolling on horizontal toolbars.
- **Clutter Reduction:** Reduced vertical internal padding of the input area for 6-inch screens to maximize the chat history viewport.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.25', changesText]);

        const featuresSql = `
            INSERT INTO features (name, status, category, "lastUpdatedAt")
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (name) DO UPDATE SET status = EXCLUDED.status;
        `;
        await client.query(featuresSql, ["Core: Context Assembly", "✅ Completed", "Core Engine"]);
        await client.query(featuresSql, ["Core: Memory Extraction", "✅ Completed", "Core Engine"]);
        await client.query(featuresSql, ["UI: Chat Interface", "✅ Completed", "Chat"]);

        await client.query('COMMIT');
        
        return NextResponse.json({ 
            success: true, 
            message: "System successfully repaired and updated to v0.5.25.",
            version: '0.5.25'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
