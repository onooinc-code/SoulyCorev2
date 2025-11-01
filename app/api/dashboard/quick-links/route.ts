import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/kv';

export const dynamic = 'force-dynamic';

const LINKS_KEY = 'dashboard:quick-links';

export interface QuickLink {
    id: string;
    title: string;
    url: string;
}

// GET the list of quick links
export async function GET() {
    try {
        const kv = getKVClient();
        // If KV is not configured, return a default empty state successfully
        if (!kv) {
            return NextResponse.json({ links: [] });
        }
        // FIX: The `get` method from the KV client was being treated as untyped, causing a TypeScript error with generic arguments.
        // Changed to cast the result instead, which resolves the error while maintaining type safety.
        const links = (await kv.get(LINKS_KEY)) as QuickLink[] | null;
        return NextResponse.json({ links: links || [] });
    } catch (error) {
        console.error('Failed to fetch quick links:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// POST (overwrite) the list of quick links
export async function POST(req: NextRequest) {
    try {
        const { links } = await req.json();

        if (!Array.isArray(links)) {
            return NextResponse.json({ error: 'Links must be an array' }, { status: 400 });
        }

        const kv = getKVClient();
        // If KV is not configured, return success with an info message
        if (!kv) {
            return NextResponse.json({ success: true, message: 'KV not configured. Links not saved to server.' });
        }
        
        await kv.set(LINKS_KEY, links);
        
        return NextResponse.json({ success: true, message: 'Links saved successfully.' });

    } catch (error) {
        console.error('Failed to save quick links:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}