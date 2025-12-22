
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getEdgeDBClient } from '@/lib/graphdb';
import clientPromise from '@/lib/mongodb';
import type { SearchResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ results: [] });
        }

        const searchTerm = `%${query}%`;
        const edgeClient = getEdgeDBClient();
        const mongoClient = await clientPromise;

        // 1. Parallel Search across different memory tiers
        const [pgResults, edgeResults, mongoResults] = await Promise.all([
            // Postgres: Conversations & Contacts
            sql`
                (SELECT id, title as name, 'conversation' as type, NULL as detail FROM conversations WHERE title ILIKE ${searchTerm} LIMIT 5)
                UNION ALL
                (SELECT id, name, 'contact' as type, email as detail FROM contacts WHERE name ILIKE ${searchTerm} OR email ILIKE ${searchTerm} LIMIT 5)
            `,
            // EdgeDB: Relationships (Graph)
            edgeClient.queryJSON(`
                SELECT Relationship {
                    id,
                    predicate,
                    subject: { name },
                    object: { name }
                } FILTER .subject.name ILIKE <str>$q OR .object.name ILIKE <str>$q OR .predicate ILIKE <str>$q
                LIMIT 5
            `, { q: `%${query}%` }),
            // MongoDB: Historical Archives
            mongoClient.db('soulycore_data').collection('archives').find({
                $or: [
                    { text: { $regex: query, $options: 'i' } },
                    { source: { $regex: query, $options: 'i' } }
                ]
            }).limit(5).toArray()
        ]);

        const unifiedResults: any[] = [];

        // Map Postgres Results
        pgResults.rows.forEach(r => unifiedResults.push({
            id: r.id,
            type: r.type,
            title: r.name,
            content: r.detail,
            source: 'Postgres (Core)'
        }));

        // Map EdgeDB Results
        const parsedEdge = JSON.parse(edgeResults);
        parsedEdge.forEach((r: any) => unifiedResults.push({
            id: r.id,
            type: 'relationship',
            title: `${r.subject.name} → ${r.predicate} → ${r.object.name}`,
            content: 'Graph connection discovered in EdgeDB.',
            source: 'EdgeDB (Graph)'
        }));

        // Map MongoDB Results
        mongoResults.forEach(r => unifiedResults.push({
            id: r._id.toString(),
            type: 'archive',
            title: `Log: ${r.source || 'Extraction'}`,
            content: r.text?.substring(0, 100) + '...',
            source: 'MongoDB (Archive)'
        }));

        return NextResponse.json({ results: unifiedResults });

    } catch (error) {
        console.error('Cognitive search failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
