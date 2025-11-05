// app/api/events/[entityId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Event } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { entityId: string } }) {
    try {
        const { entityId } = params;

        // This query finds all events an entity participates in, and for each event,
        // it aggregates all other participants and their roles.
        const { rows } = await sql`
            WITH entity_events AS (
                SELECT "eventId" FROM event_participants WHERE "entityId" = ${entityId}
            )
            SELECT 
                e.*,
                (
                    SELECT json_agg(json_build_object('role', ep.role, 'entityName', ed.name))
                    FROM event_participants ep
                    JOIN entity_definitions ed ON ep."entityId" = ed.id
                    WHERE ep."eventId" = e.id AND ep."entityId" != ${entityId}
                ) as participants
            FROM events e
            WHERE e.id IN (SELECT "eventId" FROM entity_events)
            ORDER BY e."createdAt" DESC;
        `;

        return NextResponse.json(rows);

    } catch (error) {
        console.error(`Failed to fetch events for entity ${params.entityId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}