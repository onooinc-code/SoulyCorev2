// app/api/entities/relationships/detailed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { rows } = await sql`SELECT * FROM "vw_detailed_relationships" ORDER BY "createdAt" DESC;`;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch detailed relationships:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
