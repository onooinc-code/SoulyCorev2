
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch the single most recent version entry based on release date
        const { rows } = await sql<VersionHistory>`
            SELECT * FROM version_history 
            ORDER BY "releaseDate" DESC 
            LIMIT 1;
        `;
        
        if (rows.length > 0) {
            return NextResponse.json(rows[0]);
        }
        
        // Fallback ONLY if DB is empty
        return NextResponse.json({
            version: '0.0.0',
            releaseDate: new Date(),
            changes: 'No version history found.'
        });
    } catch (error) {
        console.error('Failed to fetch current version:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
