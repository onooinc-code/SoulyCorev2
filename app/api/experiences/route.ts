import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Experience } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all experiences
export async function GET() {
    try {
        const { rows } = await sql<Experience>`
            SELECT * FROM experiences ORDER BY "lastUpdatedAt" DESC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch experiences:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE an experience
export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json();
        if (!id) {
            return NextResponse.json({ error: 'Experience ID is required' }, { status: 400 });
        }
        await sql`DELETE FROM experiences WHERE id = ${id};`;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete experience:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}