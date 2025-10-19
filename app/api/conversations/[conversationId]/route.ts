import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
// FIX: Corrected import path for type.
import { Conversation } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { conversationId: string } }) {
    const client = await db.connect();
    try {
        const { conversationId } = params;
        const body = await req.json();

        const updates: string[] = [];
        const values: any[] = [];
        let queryIndex = 1;

        Object.keys(body).forEach(key => {
            // A simple mapping for snake_case columns
            const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            updates.push(`"${dbKey}" = $${queryIndex++}`);
            values.push(body[key]);
        });

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }
        
        updates.push(`"lastUpdatedAt" = CURRENT_TIMESTAMP`);

        values.push(conversationId);
        const { rows } = await client.query(
            `UPDATE conversations SET ${updates.join(', ')} WHERE id = $${queryIndex} RETURNING *;`,
            values
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to update conversation ${params.conversationId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;
        // The database schema should have cascading deletes for messages.
        const { rowCount } = await sql`DELETE FROM conversations WHERE id = ${conversationId};`;
        if (rowCount === 0) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Conversation deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Failed to delete conversation ${params.conversationId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}