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
        const links = await kv.get<QuickLink[]>(LINKS_KEY);
        return NextResponse.json({ links: links || [] });
    } catch (error) {
        console.error('Failed to fetch quick links:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
        await kv.set(LINKS_KEY, links);
        
        return NextResponse.json({ success: true, message: 'Links saved successfully.' });

    } catch (error) {
        console.error('Failed to save quick links:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
