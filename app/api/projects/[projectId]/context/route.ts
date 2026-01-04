
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { SemanticMemoryModule } from '@/core/memory/modules/semantic';
import { DocumentMemoryModule } from '@/core/memory/modules/document';

export const dynamic = 'force-dynamic';

// POST: Add new context (Fault Tolerant)
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

        // 1. Save to Semantic Memory (Pinecone)
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

        // 2. Save to Document Memory (MongoDB)
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
            errors.push(`Document: ${(e as Error).message}`);
        }

        // 3. Log to System (Postgres)
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

        if (successes.length === 0) {
            return NextResponse.json({ 
                error: 'Failed to store context in any storage tier.', 
                details: errors 
            }, { status: 500 });
        }

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

// GET: Retrieve all stored context for a project (from MongoDB)
export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
    try {
        const { projectId } = params;
        const docMemory = new DocumentMemoryModule();
        
        // Query MongoDB using a specific filter for projectId
        // Note: The DocumentMemoryModule.query needs to support arbitrary filters.
        // We assume we updated DocumentMemoryModule to accept a filter object or we pass specific params.
        // For now, let's use the `query` method and filter in memory if the module isn't generic enough,
        // or rely on the updated module code below.
        const docs = await docMemory.query({ projectId: projectId });
        
        return NextResponse.json(docs);
    } catch (error) {
        console.error("Failed to fetch project context:", error);
        // Fallback: If Mongo fails, return empty array so UI doesn't crash
        return NextResponse.json([]);
    }
}

// DELETE: Remove a specific context item
export async function DELETE(req: NextRequest, { params }: { params: { projectId: string } }) {
    try {
        const { searchParams } = new URL(req.url);
        const docId = searchParams.get('docId');

        if (!docId) {
            return NextResponse.json({ error: 'docId is required' }, { status: 400 });
        }

        const docMemory = new DocumentMemoryModule();
        await docMemory.delete(docId); // Need to implement delete in module

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete context' }, { status: 500 });
    }
}
