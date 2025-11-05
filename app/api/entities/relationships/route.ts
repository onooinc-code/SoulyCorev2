// app/api/entities/relationships/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { EntityRelationship, GraphNode, GraphEdge, RelationshipGraphData } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all relationships for the graph
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const brainId = searchParams.get('brainId');

        let relationshipsQuery;
        if (brainId && brainId !== 'all' && brainId !== 'none') {
            relationshipsQuery = sql`
                SELECT r.*, p.name as "predicateName" 
                FROM entity_relationships r
                JOIN predicate_definitions p ON r."predicateId" = p.id
                WHERE r."brainId" = ${brainId};
            `;
        } else if (brainId === 'none') {
            relationshipsQuery = sql`
                SELECT r.*, p.name as "predicateName" 
                FROM entity_relationships r
                JOIN predicate_definitions p ON r."predicateId" = p.id
                WHERE r."brainId" IS NULL;
            `;
        } else { // 'all' or no brainId specified
            relationshipsQuery = sql`
                SELECT r.*, p.name as "predicateName" 
                FROM entity_relationships r
                JOIN predicate_definitions p ON r."predicateId" = p.id;
            `;
        }

        const { rows: relationships } = await relationshipsQuery;

        const entityIds = new Set<string>();
        relationships.forEach(r => {
            entityIds.add(r.sourceEntityId);
            entityIds.add(r.targetEntityId);
        });

        let nodes: GraphNode[] = [];
        if (entityIds.size > 0) {
            const { rows: entities } = await sql`
                SELECT id, name, type FROM entity_definitions WHERE id = ANY(${Array.from(entityIds)}::uuid[]);
            `;
            nodes = entities.map(e => ({ id: e.id, name: e.name, type: e.type }));
        }
        
        const edges: GraphEdge[] = relationships.map(r => ({
            id: r.id,
            source: r.sourceEntityId,
            target: r.targetEntityId,
            label: (r as any).predicateName,
            context: r.context,
            startDate: r.startDate,
            endDate: r.endDate,
            confidenceScore: r.confidenceScore,
            metadata: r.metadata,
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
        const { sourceEntityId, targetEntityId, predicateName, context, startDate, endDate, confidenceScore, metadata, brainId } = await req.json();

        if (!sourceEntityId || !targetEntityId || !predicateName) {
            return NextResponse.json({ error: 'sourceEntityId, targetEntityId, and predicateName are required' }, { status: 400 });
        }

        // Upsert the predicate to get its ID
        const { rows: predicateRows } = await sql`
            INSERT INTO predicate_definitions (name)
            VALUES (${predicateName})
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
        `;
        const predicateId = predicateRows[0].id;

        const { rows } = await sql<EntityRelationship>`
            INSERT INTO entity_relationships (
                "sourceEntityId", "targetEntityId", "predicateId", context, "startDate", "endDate", "confidenceScore", "metadata", "brainId"
            )
            VALUES (
                ${sourceEntityId}, ${targetEntityId}, ${predicateId}, ${context || null}, ${startDate || null}, ${endDate || null}, ${confidenceScore || 0.5}, ${metadata ? JSON.stringify(metadata) : null}, ${brainId || null}
            )
            ON CONFLICT ("sourceEntityId", "targetEntityId", "predicateId", "brainId") DO NOTHING
            RETURNING *;
        `;
        
        if (rows.length === 0) {
            // Check if it exists to return it
            const { rows: existingRows } = await sql<EntityRelationship>`
                SELECT * FROM entity_relationships 
                WHERE "sourceEntityId" = ${sourceEntityId} 
                AND "targetEntityId" = ${targetEntityId} 
                AND "predicateId" = ${predicateId}
                AND ("brainId" = ${brainId} OR ("brainId" IS NULL AND ${brainId} IS NULL));
            `;
             return NextResponse.json(existingRows[0] || { message: "Relationship already exists." }, { status: 200 });
        }
        
        return NextResponse.json(rows[0], { status: 201 });

    } catch (error) {
        console.error('Failed to create relationship:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}