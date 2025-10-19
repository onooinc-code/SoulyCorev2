// app/api/comm/channels/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CommChannel } from '@/lib/types';

export const dynamic = 'force-dynamic';

const mockChannels: CommChannel[] = [
    { id: '1', name: 'Website Contact Form', type: 'webhook', status: 'active', config_json: {}, createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '2', name: 'App Broadcasts', type: 'app_broadcast', status: 'active', config_json: {}, createdAt: new Date(), lastUpdatedAt: new Date() },
    { id: '3', name: 'Support Email', type: 'email_inbound', status: 'error', config_json: { error: 'Auth failed' }, createdAt: new Date(), lastUpdatedAt: new Date() },
];


export async function GET() {
    try {
        // In the future, this will fetch from the database `comm_channels` table
        // For now, return mock data
        return NextResponse.json(mockChannels);
    } catch (error) {
        console.error('Failed to fetch channels:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
