
// app/api/conversations/[conversationId]/tools/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Tool } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET tools available for a conversation
export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const { conversationId } = params;
        
        // Ensure tools table exists or handle gracefully
        try {
             const { rows } = await sql<Tool>`SELECT * FROM tools ORDER BY name ASC;`;
             return NextResponse.json(rows);
        } catch (dbError) {
             console.warn("Tools table might not exist or is empty, returning empty list.", dbError);
             return NextResponse.json([]);
        }
    } catch (error) {
        console.error('Failed to fetch tools for conversation:', error);
        // Return empty array instead of error to prevent UI crash
        return NextResponse.json([]); 
    }
}
