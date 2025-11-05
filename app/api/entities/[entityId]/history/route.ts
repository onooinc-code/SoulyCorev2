import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { EntityHistoryLog } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { entityId: string } }) {
    try {
        const { entityId } = params;
        const { rows } = await sql<EntityHistoryLog>`
            SELECT * FROM entity_history
            WHERE "entityId" = ${entityId}
            ORDER BY "changedAt" DESC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error(`Failed to fetch history for entity ${params.entityId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}