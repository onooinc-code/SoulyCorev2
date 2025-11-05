import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all relationships for a specific entity
export async function GET(req: NextRequest, { params }: { params: { entityId: string } }) {
    try {
        const { entityId } = params;

        const { rows } = await sql`
            SELECT 
                er.id,
                er."sourceEntityId",
                er."targetEntityId",
                er."predicateId",
                p.name as "predicateName",
                s.name as "sourceName",
                t.name as "targetName"
            FROM entity_relationships er
            JOIN predicate_definitions p ON er."predicateId" = p.id
            JOIN entity_definitions s ON er."sourceEntityId" = s.id
            JOIN entity_definitions t ON er."targetEntityId" = t.id
            WHERE er."sourceEntityId" = ${entityId} OR er."targetEntityId" = ${entityId};
        `;

        return NextResponse.json(rows);
    } catch (error) {
        console.error(`Failed to fetch relationships for entity ${params.entityId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}