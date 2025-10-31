// app/api/comm/channels/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { CommChannel } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getBaseUrl(req: NextRequest): string {
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    return `${protocol}://${host}`;
}

// GET all channels
export async function GET(req: NextRequest) {
    try {
        const { rows } = await sql<CommChannel>`
            SELECT * FROM comm_channels ORDER BY "createdAt" DESC;
        `;
        const baseUrl = getBaseUrl(req);
        const channelsWithUrls = rows.map(channel => ({
            ...channel,
            incomingUrl: channel.type === 'webhook' ? `${baseUrl}/api/webhooks/${channel.id}` : null
        }));
        return NextResponse.json(channelsWithUrls);
    } catch (error) {
        console.error('Failed to fetch channels:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST a new channel
export async function POST(req: NextRequest) {
    try {
        const { name, type, config } = await req.json();

        if (!name || !type) {
            return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
        }

        // Basic validation for type
        const validTypes = ['webhook', 'email_inbound', 'app_broadcast'];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'Invalid channel type' }, { status: 400 });
        }
        
        const configJson = JSON.stringify(config || {});

        const { rows } = await sql<CommChannel>`
            INSERT INTO comm_channels (name, type, status, "configJson")
            VALUES (${name}, ${type}, 'active', ${configJson})
            RETURNING *;
        `;
        
        const newChannel = rows[0];
        const baseUrl = getBaseUrl(req);
        const channelWithUrl = {
            ...newChannel,
            incomingUrl: newChannel.type === 'webhook' ? `${baseUrl}/api/webhooks/${newChannel.id}` : null
        };
        
        return NextResponse.json(channelWithUrl, { status: 201 });

    } catch (error) {
        console.error('Failed to create channel:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}