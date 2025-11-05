// app/api/system/refresh-views/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY "vw_detailed_relationships";`;
        return NextResponse.json({ success: true, message: 'Materialized views refreshed successfully.' });
    } catch (error) {
        console.error('Failed to refresh materialized views:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
