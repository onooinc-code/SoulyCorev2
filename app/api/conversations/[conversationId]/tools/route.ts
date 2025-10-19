// app/api/conversations/[conversationId]/tools/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Tool } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET tools available for a conversation
export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;
        // In a more advanced setup, this would check for conversation-specific tool configurations.
        // For now, we'll return all globally available tools.
        const { rows } = await sql<Tool>`SELECT * FROM tools ORDER BY name ASC;`;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch tools for conversation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
