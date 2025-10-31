

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { HedraGoal } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { rows } = await sql<HedraGoal>`SELECT * FROM hedra_goals;`;
        const goals = rows.reduce((acc, row) => {
            acc[row.sectionKey] = row;
            return acc;
        }, {} as Record<string, HedraGoal>);
        return NextResponse.json(goals);
    } catch (error) {
        console.error('Failed to fetch Hedra goals:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const goalsToUpdate: Record<string, { content: string }> = await req.json();
        
        const client = await sql.connect();
        try {
            await client.query('BEGIN');
            for (const [key, value] of Object.entries(goalsToUpdate)) {
                await client.query(
                    `UPDATE hedra_goals SET content = $1, "lastUpdatedAt" = CURRENT_TIMESTAMP WHERE "sectionKey" = $2`,
                    [value.content, key]
                );
            }
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        return NextResponse.json({ success: true, message: "Goals updated successfully." });

    } catch (error) {
        console.error('Failed to update Hedra goals:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}