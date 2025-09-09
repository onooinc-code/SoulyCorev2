
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { EndpointTestLog } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { endpointId: string } }) {
    try {
        const { endpointId } = params;
        const { rows } = await sql<EndpointTestLog>`
            SELECT * FROM endpoint_test_logs
            WHERE endpoint_id = ${endpointId}
            ORDER BY "createdAt" DESC
            LIMIT 20;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error(`Failed to fetch test logs for endpoint ${params.endpointId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
