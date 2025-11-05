import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { EntityDefinition } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: 'Text is required for analysis.' }, { status: 400 });
        }

        // Fetch all entity names and their descriptions
        const { rows: entities } = await sql<EntityDefinition>`
            SELECT name, description FROM entity_definitions;
        `;

        const highlightedEntities: any[] = [];
        const foundEntities = new Set<string>();

        entities.forEach(entity => {
            // Use a regex to find all occurrences of the entity name, case-insensitive
            const regex = new RegExp(`\\b${entity.name}\\b`, 'gi');
            let match;
            const indices: [number, number][] = [];

            while ((match = regex.exec(text)) !== null) {
                indices.push([match.index, match.index + entity.name.length]);
            }

            if (indices.length > 0 && !foundEntities.has(entity.name)) {
                highlightedEntities.push({
                    name: entity.name,
                    description: entity.description || 'No description available.',
                    indices: indices,
                });
                foundEntities.add(entity.name);
            }
        });

        return NextResponse.json({ highlightedEntities });

    } catch (error) {
        console.error('Error in contextual analyzer API:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}