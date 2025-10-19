import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Experience } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { rows } = await sql<Experience>`
            SELECT * FROM experiences ORDER BY "last_used_at" DESC NULLS LAST, "createdAt" DESC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch experiences:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}