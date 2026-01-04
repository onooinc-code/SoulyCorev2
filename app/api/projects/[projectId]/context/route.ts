
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { SemanticMemoryModule } from '@/core/memory/modules/semantic';
import { DocumentMemoryModule } from '@/core/memory/modules/document';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
    try {
        const { projectId } = params;
        const body = await req.json();
        const { type, content, projectName } = body;

        if (!content || !type) {
            return NextResponse.json({ error: 'Content and type are required' }, { status: 400 });
        }

        const semanticContent = `
[Project: ${projectName}]
[Context Type: ${type.toUpperCase()}]
---
${content}
        `.trim();

        const errors: string[] = [];
        const successes: string[] = [];

        // 1. Save to Semantic Memory (Pinecone) - Try/Catch Block
        try {
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
            successes.push('Semantic Memory');
        } catch (e) {
            console.error("Semantic Memory Store Error:", e);
            errors.push(`Semantic: ${(e as Error).message}`);
        }

        // 2. Save to Document Memory (MongoDB) - Try/Catch Block
        try {
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
            successes.push('Document Memory');
        } catch (e) {
            console.error("Document Memory Store Error:", e);
            // This often fails if MongoDB URI is missing, but we shouldn't block the whole request.
            errors.push(`Document: ${(e as Error).message}`);
        }

        // 3. Log to System (Postgres) - Try/Catch Block
        // We treat Postgres as the primary source of truth for the audit log.
        try {
            await sql`
                INSERT INTO logs (message, payload, level)
                VALUES (
                    ${`Project context ingested: ${projectName} (${type})`}, 
                    ${JSON.stringify({ projectId, type, length: content.length, successes, errors })}, 
                    'info'
                );
            `;
            successes.push('System Log');
        } catch (e) {
            console.error("System Log Error:", e);
            errors.push(`System Log: ${(e as Error).message}`);
        }

        // If ALL storage attempts failed, then we return a 500.
        if (successes.length === 0) {
            return NextResponse.json({ 
                error: 'Failed to store context in any storage tier.', 
                details: errors 
            }, { status: 500 });
        }

        // Return success if at least one tier worked, but include warnings.
        return NextResponse.json({ 
            success: true, 
            message: 'Context processing complete.', 
            savedTo: successes,
            warnings: errors.length > 0 ? errors : undefined 
        });

    } catch (error) {
        console.error(`Critical error in context route for project ${params.projectId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
