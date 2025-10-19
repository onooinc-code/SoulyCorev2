import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// This is a MOCK API endpoint to simulate connection tests.
export async function POST(req: NextRequest) {
    try {
        const { config, serviceName, action } = await req.json();

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Basic validation
        if (!config || !serviceName) {
            return NextResponse.json({ success: false, message: 'Missing configuration or service name.' }, { status: 400 });
        }
        
        if (action === 'disconnect') {
             return NextResponse.json({ success: true, message: 'Disconnected successfully.', status: 'disconnected' });
        }
        
        // --- Simulation Logic ---
        const success = Math.random() > 0.2; // 80% success rate

        if (serviceName === 'Pinecone KnowledgeBase' && config.indexName !== 'soul-knowledgebase') {
             return NextResponse.json({ success: false, message: 'Index not found. You can create it below.', status: 'index_not_found' });
        }

        if (success) {
            return NextResponse.json({ success: true, message: 'Connection successful!', status: 'connected' });
        } else {
            return NextResponse.json({ success: false, message: 'Authentication failed. Please check your credentials.', status: 'error' });
        }

    } catch (error) {
        console.error('Failed to test connection:', error);
        return NextResponse.json({ success: false, message: 'An internal server error occurred.', status: 'error' }, { status: 500 });
    }
}
