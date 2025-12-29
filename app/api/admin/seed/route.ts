
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("Starting Emergency Admin Seed...");

        // 1. Seed Version History (Force Update)
        await sql`
            INSERT INTO "version_history" ("version", "releaseDate", "changes")
            VALUES ('0.5.16', NOW(), '### 🚀 Vercel & Memory Core Fix (v0.5.16)\n\n**System Updates:**\n- **Admin Seeder:** Added web-based seeding tool.\n- **UI Sync:** Fixed chat response lag.\n- **Deep Context:** Enhanced entity lookup to use conversation history.')
            ON CONFLICT ("version") DO UPDATE SET
                "releaseDate" = EXCLUDED."releaseDate",
                "changes" = EXCLUDED."changes";
        `;

        // 2. Ensure critical tables exist (Mini-Check)
        await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
        await sql`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`;

        // 3. Seed Basic Features (subset for safety)
        const features = [
            { name: "Core: Context Assembly", status: "✅ Completed", category: "Core Engine" },
            { name: "Core: Memory Extraction", status: "✅ Completed", category: "Core Engine" },
            { name: "UI: Chat Interface", status: "✅ Completed", category: "Chat" }
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
            message: "Database seeded successfully. Version updated to v0.5.16.",
            action: "Please refresh the application to see changes."
        });

    } catch (error) {
        console.error("Admin Seed Failed:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
