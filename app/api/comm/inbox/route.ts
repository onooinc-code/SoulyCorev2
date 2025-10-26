// app/api/comm/inbox/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Log } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all inbox items (simulated from logs)
export async function GET() {
    try {
        const { rows } = await sql<Log>`
            SELECT * FROM logs 
            WHERE message LIKE 'Webhook received%'
            ORDER BY timestamp DESC
            LIMIT 50;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch inbox items:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}