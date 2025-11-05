import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { EntityDefinition } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface DuplicatePair {
    entity1: EntityDefinition;
    entity2: EntityDefinition;
    similarity: number;
}

export async function GET() {
    try {
        // Find pairs of entities with similar names.
        // We use e1.id < e2.id to avoid duplicate pairs (a,b) and (b,a).
        // The similarity threshold (e.g., 0.4) can be adjusted.
        const { rows } = await sql`
            SELECT 
                e1.id as id1, e1.name as name1, e1.type as type1, e1.description as description1, e1.aliases as aliases1, e1.tags as tags1, e1."createdAt" as createdAt1, e1."lastUpdatedAt" as lastUpdatedAt1,
                e2.id as id2, e2.name as name2, e2.type as type2, e2.description as description2, e2.aliases as aliases2, e2.tags as tags2, e2."createdAt" as createdAt2, e2."lastUpdatedAt" as lastUpdatedAt2,
                similarity(e1.name, e2.name) as similarity
            FROM entity_definitions e1, entity_definitions e2
            WHERE e1.id < e2.id AND similarity(e1.name, e2.name) > 0.4
            ORDER BY similarity DESC
            LIMIT 20;
        `;

        const pairs: DuplicatePair[] = rows.map(row => ({
            entity1: {
                id: row.id1, name: row.name1, type: row.type1, description: row.description1, aliases: row.aliases1, tags: row.tags1, createdAt: new Date(row.createdAt1), lastUpdatedAt: new Date(row.lastUpdatedAt1)
            },
            entity2: {
                id: row.id2, name: row.name2, type: row.type2, description: row.description2, aliases: row.aliases2, tags: row.tags2, createdAt: new Date(row.createdAt2), lastUpdatedAt: new Date(row.lastUpdatedAt2)
            },
            similarity: row.similarity
        }));

        return NextResponse.json(pairs);

    } catch (error) {
        console.error('Failed to find duplicate entities:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
