
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { ApiEndpoint } from '@/lib/types';

export async function PUT(req: NextRequest, { params }: { params: { endpointId: string } }) {
    try {
        const { endpointId } = params;
        const endpoint = await req.json() as Partial<Omit<ApiEndpoint, 'id'>>;

        const { method, path, group_name, description, default_params_json, default_body_json, expected_status_code } = endpoint;

        if (!method || !path || !group_name) {
            return NextResponse.json({ error: 'Method, path, and group_name are required for an update' }, { status: 400 });
        }

        const { rows } = await sql<ApiEndpoint>`
            UPDATE api_endpoints
            SET method = ${method}, 
                path = ${path}, 
                group_name = ${group_name}, 
                description = ${description}, 
                default_params_json = ${default_params_json ? JSON.stringify(default_params_json) : null}, 
                default_body_json = ${default_body_json ? JSON.stringify(default_body_json) : null}, 
                expected_status_code = ${expected_status_code || 200}
            WHERE id = ${endpointId}
            RETURNING *;
        `;

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
        }
        
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to update API endpoint ${params.endpointId}:`, error);
        if ((error as any).code === '23505') {
            return NextResponse.json({ error: 'An endpoint with this path already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { endpointId: string } }) {
    try {
        const { endpointId } = params;
        const { rowCount } = await sql`DELETE FROM api_endpoints WHERE id = ${endpointId};`;

        if (rowCount === 0) {
            return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
        }
        
        return NextResponse.json({ message: 'Endpoint deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Failed to delete API endpoint ${params.endpointId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
