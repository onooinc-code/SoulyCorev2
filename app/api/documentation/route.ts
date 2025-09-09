
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Documentation } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { rows } = await sql<Documentation>`
            SELECT id, doc_key, title, "lastUpdatedAt" 
            FROM documentations 
            ORDER BY title ASC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch documentation list:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
