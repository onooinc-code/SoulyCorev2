import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { GraphNode, GraphEdge, RelationshipGraphData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { rows: relationships } = await sql`
            SELECT
                er.id,
                er.predicate,
                er.context,
                er.source_entity_id,
                er.target_entity_id,
                source.name as source_name,
                source.type as source_type,
                target.name as target_name,
                target.type as target_type
            FROM entity_relationships er
            JOIN entity_definitions source ON er.source_entity_id = source.id
            JOIN entity_definitions target ON er.target_entity_id = target.id;
        `;

        const nodesMap = new Map<string, GraphNode>();
        const edges: GraphEdge[] = [];

        for (const rel of relationships) {
            // Add source and target nodes if they don't exist in the map
            if (!nodesMap.has(rel.source_entity_id)) {
                nodesMap.set(rel.source_entity_id, {
                    id: rel.source_entity_id,
                    name: rel.source_name,
                    type: rel.source_type,
                });
            }
            if (!nodesMap.has(rel.target_entity_id)) {
                nodesMap.set(rel.target_entity_id, {
                    id: rel.target_entity_id,
                    name: rel.target_name,
                    type: rel.target_type,
                });
            }

            // Add the edge
            edges.push({
                id: rel.id,
                source: rel.source_entity_id,
                target: rel.target_entity_id,
                label: rel.predicate.replace(/_/g, ' '),
                context: rel.context,
            });
        }

        const nodes = Array.from(nodesMap.values());
        
        const graphData: RelationshipGraphData = { nodes, edges };

        return NextResponse.json(graphData);

    } catch (error) {
        console.error('Failed to fetch entity relationships:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}