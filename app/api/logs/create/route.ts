

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Log } from '@/lib/types';

export const dynamic = 'force-dynamic';

// POST a new log
export async function POST(req: NextRequest) {
    try {
        const { message, payload, level } = await req.json();

        if (!message || !level) {
            return NextResponse.json({ error: 'Message and level are required' }, { status: 400 });
        }
        
        const { rows } = await sql<Log>`
            INSERT INTO logs (message, payload, level)
            VALUES (${message}, ${payload ? JSON.stringify(payload) : null}, ${level})
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0] as Log, { status: 201 });
    } catch (error) {
        console.error('Failed to create log:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
