
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

async function logTestResult(endpointId: string, status: string, statusCode: number, responseBody: any, responseHeaders: any, duration: number) {
    await sql`
        INSERT INTO endpoint_test_logs (endpoint_id, status, status_code, response_body, response_headers, duration_ms)
        VALUES (${endpointId}, ${status}, ${statusCode}, ${JSON.stringify(responseBody)}, ${JSON.stringify(responseHeaders)}, ${duration});
    `;
    await sql`
        UPDATE api_endpoints
        SET last_test_status = ${status}, last_test_at = CURRENT_TIMESTAMP
        WHERE id = ${endpointId};
    `;
}

export async function POST(req: NextRequest) {
    const { endpoint, params, body } = await req.json();

    if (!endpoint) {
        return NextResponse.json({ error: 'Endpoint details are required.' }, { status: 400 });
    }
    
    // Construct the full URL for the fetch request
    // This assumes the API routes are on the same host.
    const host = req.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const url = new URL(`${protocol}://${host}${endpoint.path}`);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });
    }

    const startTime = Date.now();
    let response;
    try {
        response = await fetch(url.toString(), {
            method: endpoint.method,
            headers: { 'Content-Type': 'application/json' },
            body: (endpoint.method !== 'GET' && body) ? JSON.stringify(body) : null,
        });
        
        const duration = Date.now() - startTime;
        const responseBody = await response.json().catch(() => ({ message: "Response is not valid JSON." }));
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });
        
        const status = response.status === endpoint.expected_status_code ? 'Passed' : 'Failed';
        await logTestResult(endpoint.id, status, response.status, responseBody, responseHeaders, duration);
        
        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body: responseBody,
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        const errorDetails = {
            message: (error as Error).message,
            stack: (error as Error).stack,
        };
        await logTestResult(endpoint.id, 'Failed', 500, { error: errorDetails }, {}, duration);
        return NextResponse.json({ error: 'Fetch failed', details: errorDetails }, { status: 500 });
    }
}
