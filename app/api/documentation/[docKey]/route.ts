
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Documentation } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { docKey: string } }) {
    try {
        const { docKey } = params;
        const { rows } = await sql<Documentation>`
            SELECT * FROM documentations WHERE doc_key = ${docKey};
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to fetch document ${params.docKey}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { docKey: string } }) {
    try {
        const { docKey } = params;
        const { content } = await req.json();

        if (content === undefined) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const { rows } = await sql<Documentation>`
            UPDATE documentations
            SET content = ${content}, "lastUpdatedAt" = CURRENT_TIMESTAMP
            WHERE doc_key = ${docKey}
            RETURNING *;
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);

    } catch (error) {
        console.error(`Failed to update document ${params.docKey}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
