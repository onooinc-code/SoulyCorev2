// app/api/dashboard/quick-note/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/kv';

export const dynamic = 'force-dynamic';

const NOTE_KEY = 'dashboard:quick-note';

// GET the quick note
export async function GET() {
    try {
        const kv = getKVClient();
        // If KV is not configured, return a default empty state successfully
        if (!kv) {
            return NextResponse.json({ note: '' });
        }
        const note = await kv.get(NOTE_KEY);
        return NextResponse.json({ note: note || '' });
    } catch (error) {
        // This will now only catch errors from the kv.get() call itself, not initialization.
        console.error('Failed to fetch quick note:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// PUT (update) the quick note
export async function PUT(req: NextRequest) {
    try {
        const { note } = await req.json();

        if (typeof note !== 'string') {
            return NextResponse.json({ error: 'Note must be a string' }, { status: 400 });
        }

        const kv = getKVClient();
        // If KV is not configured, return success but with a message indicating it wasn't saved remotely.
        if (!kv) {
            return NextResponse.json({ success: true, message: 'KV not configured. Note not saved to server.' });
        }
        
        await kv.set(NOTE_KEY, note);
        
        return NextResponse.json({ success: true, message: 'Note saved successfully.' });

    } catch (error) {
        console.error('Failed to save quick note:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
