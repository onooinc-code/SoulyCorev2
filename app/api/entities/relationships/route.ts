// app/api/entities/relationships/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { EntityRelationship, GraphNode, GraphEdge, RelationshipGraphData } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all relationships for the graph
export async function GET() {
    try {
        const { rows: entities } = await sql`
            SELECT id, name, type FROM entity_definitions;
        `;
        const { rows: relationships } = await sql<EntityRelationship>`
            SELECT * FROM entity_relationships;
        `;

        const nodes: GraphNode[] = entities.map(e => ({ id: e.id, name: e.name, type: e.type }));
        const edges: GraphEdge[] = relationships.map(r => ({
            id: r.id,
            source: r.sourceEntityId,
            target: r.targetEntityId,
            label: r.predicate,
            context: r.context
        }));

        const graphData: RelationshipGraphData = { nodes, edges };

        return NextResponse.json(graphData);

    } catch (error) {
        console.error('Failed to fetch relationships:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST a new relationship
export async function POST(req: NextRequest) {
    try {
        const { sourceEntityId, targetEntityId, predicate, context } = await req.json();

        if (!sourceEntityId || !targetEntityId || !predicate) {
            return NextResponse.json({ error: 'source, target, and predicate are required' }, { status: 400 });
        }

        const { rows } = await sql<EntityRelationship>`
            INSERT INTO entity_relationships ("sourceEntityId", "targetEntityId", predicate, context)
            VALUES (${sourceEntityId}, ${targetEntityId}, ${predicate}, ${context || null})
            ON CONFLICT ("sourceEntityId", "targetEntityId", predicate) DO NOTHING
            RETURNING *;
        `;
        
        if (rows.length === 0) {
            return NextResponse.json({ message: "Relationship already exists." }, { status: 200 });
        }
        
        return NextResponse.json(rows[0], { status: 201 });

    } catch (error) {
        console.error('Failed to create relationship:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}