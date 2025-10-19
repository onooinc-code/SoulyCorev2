
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
// FIX: Corrected import paths for types.
import { Feature, FeatureStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET all features
export async function GET() {
    try {
        const { rows } = await sql<Feature>`SELECT * FROM features ORDER BY name ASC;`;
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch features:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

// POST a new feature
export async function POST(req: NextRequest) {
    try {
        const feature = await req.json() as Partial<Feature>;
        const { 
            name, 
            overview, 
            status, 
            ui_ux_breakdown_json,
            logic_flow,
            key_files_json,
            notes
        } = feature;
        
        if (!name || !status) {
            return NextResponse.json({ error: 'Name and status are required' }, { status: 400 });
        }
        
        // Validate and parse JSON fields before inserting
        let parsedUiUx, parsedKeyFiles;
        try {
            parsedUiUx = ui_ux_breakdown_json ? JSON.parse(ui_ux_breakdown_json as string) : null;
            parsedKeyFiles = key_files_json ? JSON.parse(key_files_json as string) : null;
        } catch (e) {
            return NextResponse.json({ error: "Invalid JSON format for UI Breakdown or Key Files.", details: { message: (e as Error).message } }, { status: 400 });
        }


        const { rows } = await sql<Feature>`
            INSERT INTO features (name, overview, status, ui_ux_breakdown_json, logic_flow, key_files_json, notes, "lastUpdatedAt")
            VALUES (
                ${name}, 
                ${overview}, 
                ${status as FeatureStatus}, 
                ${JSON.stringify(parsedUiUx)}, 
                ${logic_flow}, 
                ${JSON.stringify(parsedKeyFiles)}, 
                ${notes},
                CURRENT_TIMESTAMP
            )
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0], { status: 201 });

    } catch (error) {
        console.error('Failed to create feature:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}