

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
// FIX: Corrected import paths for types.
import { Feature, FeatureStatus } from '@/lib/types';

export async function PUT(req: NextRequest, { params }: { params: { featureId: string } }) {
    try {
        const { featureId } = params;
        const feature = await req.json() as Partial<Feature>;
        const { 
            name, 
            overview, 
            status, 
            category,
            // FIX: Use camelCase properties to match the 'Feature' type definition.
            uiUxBreakdownJson,
            logicFlow,
            keyFilesJson,
            notes
        } = feature;

        if (!name || !status) {
            return NextResponse.json({ error: 'Name and status are required' }, { status: 400 });
        }

        // Validate and parse JSON fields before updating
        let parsedUiUx, parsedKeyFiles;
        try {
            // FIX: Use camelCase properties to match the 'Feature' type definition.
            parsedUiUx = uiUxBreakdownJson ? (typeof uiUxBreakdownJson === 'string' ? JSON.parse(uiUxBreakdownJson) : uiUxBreakdownJson) : null;
            parsedKeyFiles = keyFilesJson ? (typeof keyFilesJson === 'string' ? JSON.parse(keyFilesJson) : keyFilesJson) : null;
        } catch (e) {
            return NextResponse.json({ error: "Invalid JSON format for UI Breakdown or Key Files.", details: { message: (e as Error).message } }, { status: 400 });
        }


        const { rows } = await sql<Feature>`
            UPDATE features
            SET 
                name = ${name}, 
                overview = ${overview}, 
                status = ${status as FeatureStatus}, 
                category = ${category || 'Uncategorized'},
                "uiUxBreakdownJson" = ${JSON.stringify(parsedUiUx)}, 
                "logicFlow" = ${logicFlow}, 
                "keyFilesJson" = ${JSON.stringify(parsedKeyFiles)}, 
                notes = ${notes},
                "lastUpdatedAt" = CURRENT_TIMESTAMP
            WHERE id = ${featureId}
            RETURNING *;
        `;
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to update feature ${params.featureId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { featureId: string } }) {
    try {
        const { featureId } = params;
        const { rowCount } = await sql`DELETE FROM features WHERE id = ${featureId};`;
        if (rowCount === 0) {
            return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Feature deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Failed to delete feature ${params.featureId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}