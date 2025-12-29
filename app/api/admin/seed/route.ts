
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
        console.log("Starting Full Database Self-Repair (v0.5.23) - FORCE MODE...");

        await client.query('BEGIN');

        // 1. Ensure Schema
        for (const statement of schemaStatements) {
            await client.query(statement);
        }
        
        // 2. FORCE CLEAN: Delete ALL versions to remove conflicts/stale data
        await client.query('TRUNCATE TABLE "version_history"');
        
        // 3. Insert v0.5.23
        const changesText = `### 📱 Mobile Experience Overhaul (v0.5.23)

**UI/UX Improvements:**
- **Collapsible Toolbars:** Added a toggle to hide/show chat toolbars, maximizing screen real estate on small devices.
- **Horizontal Scrolling:** Converted macro and formatting toolbars to swipeable lists to prevent button crowding.
- **Touch Optimization:** Increased touch targets and adjusted spacing for better usability on touch screens.
- **Visual Polish:** Improved backdrop blur and input container styling for a modern feel.`;

        await client.query(`
            INSERT INTO "version_history" ("version", "releaseDate", "changes", "createdAt")
            VALUES ($1, NOW(), $2, NOW())
        `, ['0.5.23', changesText]);

        // 4. Seed Features
        const featuresSql = `
            INSERT INTO features (name, status, category, "lastUpdatedAt")
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (name) DO UPDATE SET status = EXCLUDED.status;
        `;
        await client.query(featuresSql, ["Core: Context Assembly", "✅ Completed", "Core Engine"]);
        await client.query(featuresSql, ["Core: Memory Extraction", "✅ Completed", "Core Engine"]);
        await client.query(featuresSql, ["UI: Chat Interface", "✅ Completed", "Chat"]);

        await client.query('COMMIT');
        
        console.log("Database successfully reset to v0.5.23.");
        
        return NextResponse.json({ 
            success: true, 
            message: "System successfully repaired and updated to v0.5.23.",
            version: '0.5.23'
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Admin Seed Failed:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
