
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { VersionHistory } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all version history
export async function GET() {
    try {
        const { rows } = await sql<VersionHistory>`
            SELECT * FROM version_history 
            ORDER BY release_date DESC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch version history:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
