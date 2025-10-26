// app/api/comm/broadcast/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Log the broadcast event
        await sql`
            INSERT INTO logs (message, payload, level)
            VALUES ('App-wide broadcast sent', ${JSON.stringify({ broadcast_message: message })}, 'info');
        `;
        
        // In a real-time application, this would also push the message to all connected clients
        // via WebSockets or a similar technology.

        return NextResponse.json({ success: true, message: 'Broadcast sent and logged successfully.' });

    } catch (error) {
        console.error('Failed to send broadcast:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}