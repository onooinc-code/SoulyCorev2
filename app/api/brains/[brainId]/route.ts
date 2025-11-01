import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

/**
 * @handler GET
 * @description Fetches a single Brain configuration by its ID.
 * @returns {Promise<NextResponse>} A JSON response containing the brain object or a 404 error.
 */
export async function GET(req: NextRequest, { params }: { params: { brainId: string } }) {
    try {
        const { brainId } = params;
        const { rows } = await sql`SELECT * FROM brains WHERE id = ${brainId};`;
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Brain not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to fetch brain ${params.brainId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}


/**
 * @handler PUT
 * @description Updates a specific Brain's configuration.
 * @returns {Promise<NextResponse>} A JSON response containing the updated brain object.
 */
export async function PUT(req: NextRequest, { params }: { params: { brainId: string } }) {
    try {
        const { brainId } = params;
        const { name, configJson } = await req.json();

        if (!name || !configJson) {
            return NextResponse.json({ error: 'Name and configJson are required' }, { status: 400 });
        }
        
        const parsedConfig = typeof configJson === 'string' ? JSON.parse(configJson) : configJson;

        const { rows } = await sql`
            UPDATE brains
            SET name = ${name}, "configJson" = ${JSON.stringify(parsedConfig)}
            WHERE id = ${brainId}
            RETURNING *;
        `;
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Brain not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to update brain ${params.brainId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        if ((error as any).code === '23505') { // unique_violation
             return NextResponse.json({ error: 'A brain with this name already exists.', details: errorDetails }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

/**
 * @handler DELETE
 * @description Deletes a specific Brain configuration.
 * @returns {Promise<NextResponse>} A success message or an error.
 */
export async function DELETE(req: NextRequest, { params }: { params: { brainId: string } }) {
    try {
        const { brainId } = params;
        const { rowCount } = await sql`DELETE FROM brains WHERE id = ${brainId};`;
        if (rowCount === 0) {
            return NextResponse.json({ error: 'Brain not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Brain deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Failed to delete brain ${params.brainId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}