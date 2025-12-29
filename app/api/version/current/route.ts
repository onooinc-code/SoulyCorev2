
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        // Fetch the single most recent version entry based on creation time to handle same-day releases
        const { rows } = await sql<VersionHistory>`
            SELECT * FROM version_history 
            ORDER BY "createdAt" DESC, "releaseDate" DESC 
            LIMIT 1;
        `;
        
        if (rows.length > 0) {
            return NextResponse.json(rows[0], {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                }
            });
        }
        
        return NextResponse.json({
            version: '0.0.0',
            releaseDate: new Date(),
            changes: 'No version history found.'
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
        });
    } catch (error) {
        console.error('Failed to fetch current version:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
