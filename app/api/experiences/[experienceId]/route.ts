// app/api/experiences/[experienceId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Experience } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET a single experience
export async function GET(req: NextRequest, { params }: { params: { experienceId: string } }) {
    try {
        const { experienceId } = params;
        const { rows } = await sql<Experience>`
            SELECT * FROM experiences WHERE id = ${experienceId};
        `;
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to fetch experience ${params.experienceId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


// DELETE an experience
export async function DELETE(req: NextRequest, { params }: { params: { experienceId: string } }) {
    try {
        const { experienceId } = params;
        const { rowCount } = await sql`
            DELETE FROM experiences WHERE id = ${experienceId};
        `;
        if (rowCount === 0) {
            return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Experience deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete experience ${params.experienceId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}