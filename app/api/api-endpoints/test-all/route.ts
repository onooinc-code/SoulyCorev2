

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { ApiEndpoint } from '@/lib/types';

async function logTestResult(endpointId: string, status: string, statusCode: number, duration: number) {
    await sql`
        INSERT INTO endpoint_test_logs ("endpointId", status, "statusCode", "responseBody", "responseHeaders", "durationMs")
        VALUES (${endpointId}, ${status}, ${statusCode}, ${JSON.stringify({ message: "Batch test run." })}, ${JSON.stringify({})}, ${duration});
    `;
    await sql`
        UPDATE api_endpoints
        SET "lastTestStatus" = ${status}, "lastTestAt" = CURRENT_TIMESTAMP
        WHERE id = ${endpointId};
    `;
}

export async function POST(req: NextRequest) {
    try {
        const { rows: endpoints } = await sql<ApiEndpoint>`SELECT * FROM api_endpoints;`;
        
        let passed = 0;
        let failed = 0;

        const host = req.headers.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';

        const testPromises = endpoints.map(async (endpoint) => {
            const url = new URL(`${protocol}://${host}${endpoint.path}`);
            
            // Note: This simplified batch test doesn't handle dynamic path params (e.g., [endpointId]).
            // Those tests will likely fail, which is acceptable for a first-pass health check.
            
            const startTime = Date.now();
            try {
                const response = await fetch(url.toString(), {
                    method: endpoint.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: (endpoint.method !== 'GET' && endpoint.defaultBodyJson) ? JSON.stringify(endpoint.defaultBodyJson) : null,
                });
                const duration = Date.now() - startTime;
                
                if (response.status === endpoint.expectedStatusCode) {
                    await logTestResult(endpoint.id, 'Passed', response.status, duration);
                    passed++;
                } else {
                    await logTestResult(endpoint.id, 'Failed', response.status, duration);
                    failed++;
                }
            } catch (error) {
                const duration = Date.now() - startTime;
                await logTestResult(endpoint.id, 'Failed', 500, duration);
                failed++;
            }
        });

        await Promise.all(testPromises);

        return NextResponse.json({
            message: `Batch test completed. Passed: ${passed}, Failed: ${failed}.`,
            total: endpoints.length,
            passed,
            failed,
        });

    } catch (error) {
        console.error('Error in batch API test:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}