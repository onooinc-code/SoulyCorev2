

import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { AppSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all settings
export async function GET() {
    try {
        const { rows } = await sql`SELECT key, value FROM settings;`;
        const settings = rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {} as Record<string, any>);
        
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        const errorMessage = (error as Error).message;
        const errorDetails = {
            message: errorMessage,
            stack: (error as Error).stack,
        };

        if (errorMessage.includes('relation "settings" does not exist')) {
            return NextResponse.json({ error: 'Settings database table not found. Please run the database initialization script against your Vercel Postgres database.', details: errorDetails }, { status: 500 });
        }
        
        if (!process.env.POSTGRES_URL) {
             return NextResponse.json({ error: 'Database connection details are missing. Please link a Vercel Postgres database and ensure environment variables are set in your Vercel project settings.', details: errorDetails }, { status: 500 });
        }

        return NextResponse.json({ error: 'Could not connect to the database to fetch settings. Please check your Vercel project settings and database status.', details: errorDetails }, { status: 500 });
    }
}

// PUT (update) settings using a robust transaction
export async function PUT(req: NextRequest) {
    const client = await db.connect();
    try {
        const settingsToUpdate = await req.json();

        await client.query('BEGIN');
        
        const settingsArray = Object.entries(settingsToUpdate);
        for (const [key, value] of settingsArray) {
            await client.query(
                `INSERT INTO settings (key, value)
                 VALUES ($1, $2)
                 ON CONFLICT (key) 
                 DO UPDATE SET value = EXCLUDED.value;`,
                [key, JSON.stringify(value)]
            );
        }
        
        await client.query('COMMIT');
        
        const { rows } = await client.query('SELECT key, value FROM settings;');
        const updatedSettings = rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {} as Record<string, any>);

        return NextResponse.json(updatedSettings);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Failed to update settings:', error);
        const errorMessage = (error as Error).message;
        const errorDetails = {
            message: errorMessage,
            stack: (error as Error).stack,
        };

        if (errorMessage.includes('relation "settings" does not exist')) {
            return NextResponse.json({ error: 'Settings database table not found. Please run the database initialization script.', details: errorDetails }, { status: 500 });
        }
        
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    } finally {
        client.release();
    }
}