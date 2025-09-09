

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { Contact } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all contacts
export async function GET() {
    try {
        const { rows } = await sql<Contact>`SELECT * FROM contacts ORDER BY name ASC;`;
        return NextResponse.json({ contacts: rows });
    } catch (error) {
        console.error('Failed to fetch contacts:', error);
        const errorMessage = (error as Error).message;
        const errorDetails = {
            message: errorMessage,
            stack: (error as Error).stack,
        };

        if (errorMessage.includes('relation "contacts" does not exist')) {
            return NextResponse.json({ error: 'Contacts database table not found. Please run the database initialization script against your Vercel Postgres database.', details: errorDetails }, { status: 500 });
        }
        
        if (!process.env.POSTGRES_URL) {
             return NextResponse.json({ error: 'Database connection details are missing. Please link a Vercel Postgres database and ensure environment variables are set in your Vercel project settings.', details: errorDetails }, { status: 500 });
        }

        return NextResponse.json({ error: 'Could not connect to the database to fetch contacts. Please check your Vercel project settings and database status.', details: errorDetails }, { status: 500 });
    }
}

// POST a new contact or update an existing one (upsert)
export async function POST(req: NextRequest) {
    try {
        const contact = await req.json() as Partial<Contact>;
        const { name, email, company, phone, notes, tags } = contact;
        
        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Use ON CONFLICT to perform an "upsert". This creates a new contact
        // or updates the specified fields if a contact with the same name/email already exists.
        const { rows } = await sql<Contact>`
            INSERT INTO contacts (name, email, company, phone, notes, tags)
            VALUES (${name}, ${email}, ${company}, ${phone}, ${notes}, ${tags ? (tags as any) : null})
            ON CONFLICT (name, email) DO UPDATE SET
                company = EXCLUDED.company,
                phone = EXCLUDED.phone,
                notes = EXCLUDED.notes,
                tags = EXCLUDED.tags
            RETURNING *;
        `;
        
        // A successful upsert will always return one row.
        return NextResponse.json(rows[0], { status: 201 });

    } catch (error) {
        console.error('Failed to create or update contact:', error);
        const errorMessage = (error as Error).message;
        const errorDetails = {
            message: errorMessage,
            stack: (error as Error).stack,
        };
        
        if (errorMessage.includes('relation "contacts" does not exist')) {
            return NextResponse.json({ error: 'Contacts database table not found. Please run the database initialization script against your Vercel Postgres database.', details: errorDetails }, { status: 500 });
        }

        if (!process.env.POSTGRES_URL) {
            return NextResponse.json({ error: 'Database connection details are missing. Please link a Vercel Postgres database and ensure environment variables are set in your Vercel project settings.', details: errorDetails }, { status: 500 });
        }

        return NextResponse.json({ error: 'Failed to create or update contact. Please check your Vercel project settings and database status.', details: errorDetails }, { status: 500 });
    }
}
