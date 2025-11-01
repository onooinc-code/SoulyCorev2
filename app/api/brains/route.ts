import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * @handler GET
 * @description Fetches all Brain configurations from the database.
 * @returns {Promise<NextResponse>} A JSON response containing an array of all brains.
 */
export async function GET() {
    try {
        const { rows } = await sql`SELECT * FROM brains ORDER BY name ASC;`;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch brains:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

/**
 * @handler POST
 * @description Creates a new Brain configuration in the database.
 * @param {NextRequest} req - The incoming request, expecting a JSON body with 'name' and 'configJson'.
 * @returns {Promise<NextResponse>} A JSON response with the newly created brain object.
 */
export async function POST(req: NextRequest) {
    try {
        const { name, configJson } = await req.json();

        if (!name || !configJson) {
            return NextResponse.json({ error: 'Name and configJson are required' }, { status: 400 });
        }
        
        // Ensure configJson is a valid JSON object before inserting
        const parsedConfig = typeof configJson === 'string' ? JSON.parse(configJson) : configJson;

        const { rows } = await sql`
            INSERT INTO brains (name, "configJson")
            VALUES (${name}, ${JSON.stringify(parsedConfig)})
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0], { status: 201 });

    } catch (error) {
        console.error('Failed to create brain:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        if ((error as any).code === '23505') { // unique_violation
             return NextResponse.json({ error: 'A brain with this name already exists.', details: errorDetails }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}