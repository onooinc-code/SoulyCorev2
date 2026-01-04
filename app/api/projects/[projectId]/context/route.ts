
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { SemanticMemoryModule } from '@/core/memory/modules/semantic';
import { DocumentMemoryModule } from '@/core/memory/modules/document';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
    try {
        const { projectId } = params;
        const { type, content, projectName } = await req.json();

        if (!content || !type) {
            return NextResponse.json({ error: 'Content and type are required' }, { status: 400 });
        }

        // 1. Prepare formatted content for Semantic Memory (Pinecone)
        // We prepend specific headers so the embedding captures the project context strongly.
        const semanticContent = `
[Project: ${projectName}]
[Context Type: ${type.toUpperCase()}]
---
${content}
        `.trim();

        // 2. Save to Semantic Memory (Vector RAG)
        const semanticMemory = new SemanticMemoryModule();
        await semanticMemory.store({
            text: semanticContent,
            metadata: {
                projectId,
                type: 'project_context',
                category: type,
                source: 'user_upload'
            }
        });

        // 3. Save to Document Memory (Mongo/Archive) for full retrieval if needed
        // This is a backup and allows for "Show me all files for Project X" later.
        const docMemory = new DocumentMemoryModule();
        await docMemory.store({
            data: {
                projectId,
                projectName,
                type: `project_${type}`,
                content: content,
                timestamp: new Date()
            }
        });

        // 4. Log to System
        await sql`
            INSERT INTO logs (message, payload, level)
            VALUES (${`Project context ingested: ${projectName} (${type})`}, ${JSON.stringify({ projectId, type, length: content.length })}, 'info');
        `;

        return NextResponse.json({ success: true, message: 'Context ingested successfully.' });

    } catch (error) {
        console.error(`Failed to ingest context for project ${params.projectId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
