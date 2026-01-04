
import { NextRequest, NextResponse } from 'next/server';
import { SemanticMemoryModule } from '@/core/memory/modules/semantic';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
    try {
        const { projectId } = params;
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const semanticMemory = new SemanticMemoryModule();
        
        // Search specifically within this project's namespace/filter
        const results = await semanticMemory.query({
            queryText: query,
            topK: 5,
            filter: { projectId: projectId } // This ensures we only check vectors for this project
        });

        return NextResponse.json({ matches: results });

    } catch (error) {
        console.error('Project context search failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
