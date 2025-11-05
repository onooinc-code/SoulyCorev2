// A utility endpoint to create a relationship from names instead of IDs.
// Used by the AI relationship suggestion feature.
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { source, predicate, target } = await req.json();

        if (!source || !predicate || !target) {
            return NextResponse.json({ error: 'Source, predicate, and target names are required.' }, { status: 400 });
        }

        // 1. Find entities
        const { rows: entityRows } = await sql`
            SELECT id, name FROM entity_definitions WHERE name IN (${source}, ${target})
        `;
        const sourceEntity = entityRows.find(e => e.name === source);
        const targetEntity = entityRows.find(e => e.name === target);

        if (!sourceEntity || !targetEntity) {
            return NextResponse.json({ error: `One or both entities not found: ${source}, ${target}` }, { status: 404 });
        }

        // 2. Upsert predicate
        const { rows: predicateRows } = await sql`
            INSERT INTO predicate_definitions (name) VALUES (${predicate})
            ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name
            RETURNING id;
        `;
        const predicateId = predicateRows[0].id;

        // 3. Create relationship
        const { rows: newRelRows } = await sql`
            INSERT INTO entity_relationships ("sourceEntityId", "targetEntityId", "predicateId")
            VALUES (${sourceEntity.id}, ${targetEntity.id}, ${predicateId})
            ON CONFLICT ("sourceEntityId", "targetEntityId", "predicateId") DO NOTHING
            RETURNING id;
        `;
        
        if (newRelRows.length > 0) {
             return NextResponse.json({ success: true, message: 'Relationship created.' }, { status: 201 });
        }
        return NextResponse.json({ success: true, message: 'Relationship already exists.' }, { status: 200 });

    } catch (error) {
        console.error('Failed to create relationship from names:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
