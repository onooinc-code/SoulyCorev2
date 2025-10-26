// app/api/comm/channels/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { CommChannel } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all channels
export async function GET() {
    try {
        const { rows } = await sql<CommChannel>`
            SELECT * FROM comm_channels ORDER BY "createdAt" DESC;
        `;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch channels:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST a new channel
export async function POST(req: NextRequest) {
    try {
        const { name, type } = await req.json();

        if (!name || !type) {
            return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
        }

        // Basic validation for type
        const validTypes = ['webhook', 'email_inbound', 'app_broadcast'];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'Invalid channel type' }, { status: 400 });
        }

        const { rows } = await sql<CommChannel>`
            INSERT INTO comm_channels (name, type, status, config_json)
            VALUES (${name}, ${type}, 'active', '{}')
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0], { status: 201 });

    } catch (error) {
        console.error('Failed to create channel:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}