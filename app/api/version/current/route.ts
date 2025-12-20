
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const staticCurrentVersion: VersionHistory = {
    id: 'v-0.4.8',
    version: '0.4.8',
    releaseDate: new Date(),
    createdAt: new Date(),
    changes: 'Latest update with critical fixes.'
};

// GET the latest version
export async function GET() {
    try {
        const { rows } = await sql<VersionHistory>`
            SELECT * FROM version_history 
            ORDER BY "releaseDate" DESC
            LIMIT 1;
        `;
        
        if (rows.length === 0) {
             return NextResponse.json(staticCurrentVersion);
        }

        // If the DB version is older than our static version, return the static one
        // This ensures the UI updates even if the DB seed hasn't run yet.
        const dbVersion = rows[0];
        if (dbVersion.version < staticCurrentVersion.version) {
             return NextResponse.json(staticCurrentVersion);
        }

        return NextResponse.json(dbVersion);
    } catch (error) {
        console.warn('Failed to fetch current version from DB, using static fallback:', error);
        return NextResponse.json(staticCurrentVersion);
    }
}
