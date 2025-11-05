import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { EntityDefinition } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Find entities that are not referenced in relationships or messages.
        const { rows } = await sql<EntityDefinition>`
            SELECT ed.*
            FROM entity_definitions ed
            LEFT JOIN entity_relationships er_source ON ed.id = er_source."sourceEntityId"
            LEFT JOIN entity_relationships er_target ON ed.id = er_target."targetEntityId"
            LEFT JOIN message_entities me ON ed.id = me."entityId"
            WHERE er_source.id IS NULL
              AND er_target.id IS NULL
              AND me."messageId" IS NULL
            ORDER BY ed."createdAt" ASC;
        `;

        return NextResponse.json(rows);

    } catch (error) {
        console.error('Failed to find unused entities:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}