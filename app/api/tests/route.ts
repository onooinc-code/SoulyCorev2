
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
// FIX: Corrected import path for type.
import type { FeatureTest } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * @handler GET
 * @description Fetches all test cases, optionally filtered by featureId.
 * @returns {Promise<NextResponse>} A JSON response containing an array of test cases.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const featureId = searchParams.get('featureId');

        let rows;
        if (featureId) {
            ({ rows } = await sql<FeatureTest>`
                SELECT * FROM feature_tests 
                WHERE "featureId" = ${featureId}
                ORDER BY "createdAt" ASC;
            `);
        } else {
            ({ rows } = await sql<FeatureTest>`SELECT * FROM feature_tests ORDER BY "createdAt" ASC;`);
        }
        
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Failed to fetch test cases:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

/**
 * @handler POST
 * @description Creates a new test case for a feature.
 * @param {NextRequest} req - The incoming request, expecting a JSON body.
 * @returns {Promise<NextResponse>} A JSON response with the newly created test case.
 */
export async function POST(req: NextRequest) {
    try {
        const { featureId, description, manual_steps, expected_result } = await req.json();

        if (!featureId || !description || !expected_result) {
            return NextResponse.json({ error: 'featureId, description, and expected_result are required' }, { status: 400 });
        }
        
        const { rows } = await sql<FeatureTest>`
            INSERT INTO feature_tests ("featureId", description, manual_steps, expected_result)
            VALUES (${featureId}, ${description}, ${manual_steps}, ${expected_result})
            RETURNING *;
        `;
        
        return NextResponse.json(rows[0], { status: 201 });

    } catch (error) {
        console.error('Failed to create test case:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}