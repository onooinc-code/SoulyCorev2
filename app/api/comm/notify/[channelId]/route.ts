// app/api/comm/notify/[channelId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { CommChannel } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { channelId: string } }) {
    try {
        const { channelId } = params;
        const { message, payload } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // 1. Fetch the channel to get its config (the webhook URL)
        const { rows } = await sql<CommChannel>`
            SELECT * FROM comm_channels WHERE id = ${channelId} AND type = 'webhook';
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Webhook channel not found or is not a webhook type.' }, { status: 404 });
        }

        const channel = rows[0];
        const webhookUrl = channel.config_json?.url;

        if (!webhookUrl) {
            // Log this as an error for the channel
            await sql`UPDATE comm_channels SET status = 'error' WHERE id = ${channelId};`;
            await sql`INSERT INTO logs (message, payload, level) VALUES ('Webhook send failed: No URL configured', ${JSON.stringify({ channelId })}, 'error');`;
            return NextResponse.json({ error: `Webhook channel "${channel.name}" has no URL configured.` }, { status: 500 });
        }

        // 2. Send the POST request to the external webhook URL
        const notificationPayload = {
            message,
            source: 'SoulyCore',
            channelName: channel.name,
            timestamp: new Date().toISOString(),
            ...(payload || {}),
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notificationPayload),
        });

        // 3. Log the outcome
        if (response.ok) {
            await sql`INSERT INTO logs (message, payload, level) VALUES ('Successfully sent notification to webhook', ${JSON.stringify({ channelId, webhookUrl })}, 'info');`;
            return NextResponse.json({ success: true, message: `Notification sent to ${channel.name}` });
        } else {
            await sql`UPDATE comm_channels SET status = 'error' WHERE id = ${channelId};`;
            const errorBody = await response.text();
            await sql`INSERT INTO logs (message, payload, level) VALUES ('Failed to send notification to webhook', ${JSON.stringify({ channelId, webhookUrl, status: response.status, errorBody })}, 'error');`;
            return NextResponse.json({ error: `Webhook endpoint returned status ${response.status}` }, { status: 502 });
        }

    } catch (error) {
        console.error('Failed to send webhook notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}