// app/api/webhooks/[channelId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function logWebhook(channelId: string, payload: any, headers: Headers) {
    // In a real app, you might have a dedicated webhooks_log table.
    // For now, we'll use the generic logs table.
    try {
        await sql`
            INSERT INTO logs (message, payload, level)
            VALUES (${`Webhook received on channel: ${channelId}`}, ${JSON.stringify({ payload, headers: Object.fromEntries(headers.entries()) })}, 'info');
        `;
    } catch(e) {
        console.error('Failed to log webhook:', e);
    }
}

export async function POST(req: NextRequest, { params }: { params: { channelId: string } }) {
    try {
        const { channelId } = params;
        const payload = await req.json();

        // Log the incoming webhook for inspection
        await logWebhook(channelId, payload, req.headers);

        // Here, you would add logic to process the webhook.
        // For example, create a new message in a conversation, update a contact, etc.
        // This is highly dependent on the webhook source and desired action.

        console.log(`Webhook received for channel ${channelId}:`, payload);

        return NextResponse.json({ success: true, message: "Webhook received." });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
