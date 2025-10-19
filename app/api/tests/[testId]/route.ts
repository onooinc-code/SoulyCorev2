
import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
// FIX: Corrected import paths for types.
import type { FeatureTest, TestStatus } from '@/lib/types';

/**
 * @handler GET
 * @description Fetches a single test case by its ID.
 * @returns {Promise<NextResponse>} A JSON response containing the test case or a 404 error.
 */
export async function GET(req: NextRequest, { params }: { params: { testId: string } }) {
    try {
        const { testId } = params;
        const { rows } = await sql<FeatureTest>`SELECT * FROM feature_tests WHERE id = ${testId};`;
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Test case not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to fetch test case ${params.testId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

/**
 * @handler PUT
 * @description Updates a specific test case, including its status.
 * @returns {Promise<NextResponse>} A JSON response containing the updated test case.
 */
export async function PUT(req: NextRequest, { params }: { params: { testId: string } }) {
    try {
        const { testId } = params;
        const { description, manual_steps, expected_result, last_run_status } = await req.json();

        // Build the update query dynamically
        const updates: string[] = [];
        const values: any[] = [];
        let queryIndex = 1;

        if (description !== undefined) {
            updates.push(`description = $${queryIndex++}`);
            values.push(description);
        }
        if (manual_steps !== undefined) {
            updates.push(`manual_steps = $${queryIndex++}`);
            values.push(manual_steps);
        }
        if (expected_result !== undefined) {
            updates.push(`expected_result = $${queryIndex++}`);
            values.push(expected_result);
        }
        if (last_run_status !== undefined) {
            updates.push(`last_run_status = $${queryIndex++}`);
            values.push(last_run_status as TestStatus);
            updates.push(`"last_run_at" = CURRENT_TIMESTAMP`);
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        values.push(testId);
        const queryString = `UPDATE feature_tests SET ${updates.join(', ')} WHERE id = $${queryIndex} RETURNING *;`;
        
        const { rows } = await db.query(queryString, values);

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Test case not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to update test case ${params.testId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

/**
 * @handler DELETE
 * @description Deletes a specific test case.
 * @returns {Promise<NextResponse>} A success message or an error.
 */
export async function DELETE(req: NextRequest, { params }: { params: { testId: string } }) {
    try {
        const { testId } = params;
        const { rowCount } = await sql`DELETE FROM feature_tests WHERE id = ${testId};`;
        if (rowCount === 0) {
            return NextResponse.json({ error: 'Test case not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Test case deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Failed to delete test case ${params.testId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}