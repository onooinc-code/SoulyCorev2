import { NextRequest, NextResponse } from 'next/server';
import { executeTool } from '@/core/tools';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { toolName, args } = await req.json();

        if (!toolName) {
            return NextResponse.json({ error: 'toolName is required' }, { status: 400 });
        }

        const observation = await executeTool(toolName, args);

        return NextResponse.json({ observation });

    } catch (error) {
        console.error(`Error executing tool via API:`, error);
        return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
    }
}
