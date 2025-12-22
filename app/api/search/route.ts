
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getEdgeDBClient } from '@/lib/graphdb';
import clientPromise from '@/lib/mongodb';
import { SemanticMemoryModule } from '@/core/memory/modules/semantic';
import { EntityVectorMemoryModule } from '@/core/memory/modules/entity_vector';
import type { SearchResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const brainId = searchParams.get('brainId') || 'none';

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ results: [] });
        }

        const searchTerm = `%${query}%`;
        const edgeClient = getEdgeDBClient();
        const mongoClient = await clientPromise;
        const semanticMemory = new SemanticMemoryModule();
        const entityVectorMemory = new EntityVectorMemoryModule();

        // Federated Search across all 5 tiers
        const [pgResults, edgeResults, mongoResults, semanticResults, vectorResults] = await Promise.all([
            // 1. Postgres: SQL Search
            sql`
                (SELECT id, title as name, 'conversation' as type, NULL as detail FROM conversations WHERE title ILIKE ${searchTerm} LIMIT 3)
                UNION ALL
                (SELECT id, name, 'contact' as type, email as detail FROM contacts WHERE name ILIKE ${searchTerm} LIMIT 3)
            `,
            // 2. EdgeDB: Graph Relationships
            edgeClient.queryJSON(`
                SELECT Relationship {
                    id, predicate, subject: { name }, object: { name }
                } FILTER .subject.name ILIKE <str>$q OR .object.name ILIKE <str>$q
                LIMIT 3
            `, { q: `%${query}%` }),
            // 3. MongoDB: Archives
            mongoClient.db('soulycore_data').collection('archives').find({
                $or: [{ text: { $regex: query, $options: 'i' } }]
            }).limit(3).toArray(),
            // 4. Pinecone: Semantic Concepts
            semanticMemory.query({ queryText: query, topK: 3 }),
            // 5. Upstash: Entity Similarity
            entityVectorMemory.query({ queryText: query, topK: 3 })
        ]);

        const unifiedResults: SearchResult[] = [];

        // Map Results...
        pgResults.rows.forEach(r => unifiedResults.push({ id: r.id, type: r.type, title: r.name, content: r.detail, source: 'Postgres' }));
        
        JSON.parse(edgeResults).forEach((r: any) => unifiedResults.push({ id: r.id, type: 'relationship', title: `${r.subject.name} → ${r.predicate}`, content: `Connected to ${r.object.name}`, source: 'EdgeDB' }));
        
        mongoResults.forEach(r => unifiedResults.push({ id: r._id.toString(), type: 'archive', title: `Archive: ${r.source || 'Log'}`, content: r.text?.substring(0, 100), source: 'MongoDB' }));

        semanticResults.forEach(r => unifiedResults.push({ id: r.id, type: 'knowledge', title: 'Conceptual Match', content: r.text, source: 'Pinecone' }));

        vectorResults.forEach(r => unifiedResults.push({ id: r.id, type: 'entity_match', title: 'Similar Entity Found', content: r.text, source: 'Upstash' }));

        return NextResponse.json({ results: unifiedResults });

    } catch (error) {
        console.error('Cognitive search failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
