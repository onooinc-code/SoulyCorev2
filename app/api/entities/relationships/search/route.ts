import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/gemini-server';
import { getKnowledgeBaseIndex } from '@/lib/pinecone';
import { sql } from '@/lib/db';
import type { EntityRelationship } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        // 1. Generate embedding for query
        const queryEmbedding = await generateEmbedding(query);

        // 2. Search Pinecone
        const index = getKnowledgeBaseIndex();
        if (!index) {
            return NextResponse.json({ error: "Vector database not configured" }, { status: 500 });
        }

        const queryResponse = await index.query({
            vector: queryEmbedding,
            topK: 10,
            includeMetadata: true,
            filter: { type: 'relationship' }
        });

        const relationshipIds = queryResponse.matches
            .map(match => (match.metadata as any)?.relationshipId)
            .filter(id => id);

        if (relationshipIds.length === 0) {
            return NextResponse.json([]);
        }

        // 3. Fetch full relationships from Postgres
        const { rows: relationships } = await sql<EntityRelationship>`
            SELECT * FROM entity_relationships WHERE id = ANY(${relationshipIds}::uuid[]);
        `;

        return NextResponse.json(relationships);

    } catch (error) {
        console.error('Failed to search relationships:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}