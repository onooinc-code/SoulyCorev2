
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Subsystem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { rows } = await sql`
            SELECT 
                id, name, description, progress, "healthScore",
                dependencies, resources, milestones, "githubStats", tasks,
                order_index as "orderIndex"
            FROM subsystems 
            ORDER BY order_index ASC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch subsystems:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
