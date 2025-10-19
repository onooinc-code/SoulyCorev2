
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
// FIX: Corrected import path for type.
import { Contact } from '@/lib/types';

export async function PUT(req: NextRequest, { params }: { params: { contactId: string } }) {
    try {
        const { contactId } = params;
        const contact = await req.json() as Partial<Contact>;
        const { name, email, company, phone, notes, tags } = contact;
        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }
        const { rows } = await sql<Contact>`
            UPDATE contacts
            SET name = ${name}, email = ${email}, company = ${company}, phone = ${phone}, notes = ${notes}, tags = ${tags ? (tags as any) : null}
            WHERE id = ${contactId}
            RETURNING *;
        `;
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to update contact ${params.contactId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { contactId: string } }) {
    try {
        const { contactId } = params;
        const { rowCount } = await sql`DELETE FROM contacts WHERE id = ${contactId};`;
        if (rowCount === 0) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Contact deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Failed to delete contact ${params.contactId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}