import { NextRequest, NextResponse } from 'next/server';
import { StructuredMemoryModule } from '@/core/memory/modules/structured';
import { EpisodicMemoryModule } from '@/core/memory/modules/episodic';
import { SemanticMemoryModule } from '@/core/memory/modules/semantic';

export const dynamic = 'force-dynamic';

/**
 * @handler GET
 * @description Fetches data from a specified memory module for inspection.
 * @param {NextRequest} req - The incoming request.
 * @param {object} params - The route parameters, containing the dynamic 'module' name.
 * @returns {Promise<NextResponse>} A JSON response with the queried data or an error.
 */
export async function GET(req: NextRequest, { params }: { params: { module: string } }) {
    try {
        const { module } = params;
        const { searchParams } = new URL(req.url);

        // Convert searchParams to a plain object to pass to module query methods.
        const queryParams: Record<string, any> = {};
        searchParams.forEach((value, key) => {
            queryParams[key] = value;
        });
        
        let data;

        switch (module) {
            case 'structured': {
                const structuredMemory = new StructuredMemoryModule();
                const type = queryParams.type as 'entity' | 'contact';
                if (!type || (type !== 'entity' && type !== 'contact')) {
                    return NextResponse.json({ error: 'A `type` parameter ("entity" or "contact") is required for structured memory viewer.' }, { status: 400 });
                }
                data = await structuredMemory.query({
                    type,
                    id: queryParams.id,
                    name: queryParams.name,
                });
                break;
            }
            case 'episodic': {
                const episodicMemory = new EpisodicMemoryModule();
                if (!queryParams.conversationId) {
                    return NextResponse.json({ error: 'conversationId is required for episodic memory viewer' }, { status: 400 });
                }
                // FIX: Explicitly construct the query parameters object to match the expected type `IEpisodicMemoryQueryParams`.
                const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : undefined;
                data = await episodicMemory.query({
                    conversationId: queryParams.conversationId,
                    limit: limit && !isNaN(limit) ? limit : undefined,
                });
                break;
            }
            case 'semantic': {
                const semanticMemory = new SemanticMemoryModule();
                 if (!queryParams.queryText) {
                    return NextResponse.json({ error: 'queryText is required for semantic memory viewer' }, { status: 400 });
                }
                const topK = queryParams.topK ? parseInt(queryParams.topK, 10) : undefined;

                data = await semanticMemory.query({
                    queryText: queryParams.queryText,
                    topK: topK && !isNaN(topK) ? topK : undefined,
                });
                break;
            }
            default:
                return NextResponse.json({ error: `Invalid memory module specified: ${module}` }, { status: 400 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error(`Error in memory viewer for module [${params.module}]:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}