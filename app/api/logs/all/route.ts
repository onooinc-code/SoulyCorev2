

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Log } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all logs
export async function GET() {
    try {
        const { rows } = await sql<Log>`
            SELECT * FROM logs 
            ORDER BY timestamp DESC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch logs:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

// DELETE all logs
export async function DELETE() {
    try {
        await sql`TRUNCATE TABLE logs;`;
        return NextResponse.json({ message: 'All logs cleared successfully' }, { status: 200 });
    } catch (error) {
        console.error('Failed to clear logs:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
