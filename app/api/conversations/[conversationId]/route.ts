

import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { Conversation } from '@/lib/types';

// PUT (update) a conversation
export async function PUT(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;
        const { 
            title, summary, systemPrompt, 
            useSemanticMemory, useStructuredMemory, 
            model, temperature, topP,
            enableMemoryExtraction, enableProactiveSuggestions, enableAutoSummarization
        } = await req.json();
        
        const updates: string[] = [];
        const values: any[] = [];
        let queryIndex = 1;

        if (title !== undefined) {
            updates.push(`title = $${queryIndex++}`);
            values.push(title);
        }
        if (summary !== undefined) {
            updates.push(`summary = $${queryIndex++}`);
            values.push(summary);
        }
        if (systemPrompt !== undefined) {
            updates.push(`"systemPrompt" = $${queryIndex++}`);
            values.push(systemPrompt);
        }
        if (useSemanticMemory !== undefined) {
            updates.push(`"useSemanticMemory" = $${queryIndex++}`);
            values.push(useSemanticMemory);
        }
        if (useStructuredMemory !== undefined) {
            updates.push(`"useStructuredMemory" = $${queryIndex++}`);
            values.push(useStructuredMemory);
        }
        if (model !== undefined) {
            updates.push(`model = $${queryIndex++}`);
            values.push(model);
        }
        if (temperature !== undefined) {
            updates.push(`temperature = $${queryIndex++}`);
            values.push(temperature);
        }
        if (topP !== undefined) {
            updates.push(`"topP" = $${queryIndex++}`);
            values.push(topP);
        }
        if (enableMemoryExtraction !== undefined) {
            updates.push(`"enableMemoryExtraction" = $${queryIndex++}`);
            values.push(enableMemoryExtraction);
        }
        if (enableProactiveSuggestions !== undefined) {
            updates.push(`"enableProactiveSuggestions" = $${queryIndex++}`);
            values.push(enableProactiveSuggestions);
        }
        if (enableAutoSummarization !== undefined) {
            updates.push(`"enableAutoSummarization" = $${queryIndex++}`);
            values.push(enableAutoSummarization);
        }
        
        updates.push(`"lastUpdatedAt" = CURRENT_TIMESTAMP`);

        if (updates.length === 1) {
             return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        values.push(conversationId);
        const queryString = `UPDATE conversations SET ${updates.join(', ')} WHERE id = $${queryIndex} RETURNING *;`;

        const { rows } = await db.query(queryString, values);

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }
        
        return NextResponse.json(rows[0] as Conversation);
    } catch (error) {
        console.error(`Failed to update conversation ${params.conversationId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

// DELETE a conversation
export async function DELETE(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;
        
        // The ON DELETE CASCADE in the messages table schema handles deleting associated messages
        const { rowCount } = await sql`DELETE FROM conversations WHERE id = ${conversationId};`;

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete conversation ${params.conversationId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
