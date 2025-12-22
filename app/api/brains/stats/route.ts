
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const statsQuery = await sql`
            SELECT 
                b.id, 
                b.name, 
                COUNT(DISTINCT ed.id)::int as "entityCount",
                COUNT(DISTINCT er.id)::int as "relationshipCount"
            FROM brains b
            LEFT JOIN entity_definitions ed ON b.id = ed."brainId"
            LEFT JOIN entity_relationships er ON b.id = er."brainId"
            GROUP BY b.id, b.name;
        `;

        // Handle "No Brain" stats
        const globalStatsQuery = await sql`
            SELECT 
                COUNT(DISTINCT id)::int as "entityCount"
            FROM entity_definitions 
            WHERE "brainId" IS NULL;
        `;
        
        const globalRelStatsQuery = await sql`
            SELECT 
                COUNT(DISTINCT id)::int as "relationshipCount"
            FROM entity_relationships 
            WHERE "brainId" IS NULL;
        `;

        const stats = [
            {
                id: 'none',
                name: 'Global Memory',
                entityCount: globalStatsQuery.rows[0].entityCount || 0,
                relationshipCount: globalRelStatsQuery.rows[0].relationshipCount || 0
            },
            ...statsQuery.rows
        ];

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Failed to fetch brain stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
