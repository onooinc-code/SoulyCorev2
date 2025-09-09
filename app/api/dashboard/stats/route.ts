
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { knowledgeBaseIndex } from '@/lib/pinecone';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const [
            conversationStats,
            messageCount,
            pipelineRunStats,
            pineconeStats,
            entityCount,
            contactCount,
            featureStats,
            logCount,
            testRunCount,
            promptCount,
            brainCount
        ] = await Promise.all([
            sql`SELECT COUNT(*) as total_convos, AVG(msg_count) as avg_msgs_per_convo FROM (SELECT c.id, COUNT(m.id) as msg_count FROM conversations c LEFT JOIN messages m ON c.id = m."conversationId" GROUP BY c.id) as convo_msgs;`,
            sql`SELECT COUNT(*) FROM messages;`,
            sql`SELECT 
                pipeline_type, 
                status, 
                COUNT(*)::int as count,
                AVG(duration_ms)::float as avg_duration
             FROM pipeline_runs 
             GROUP BY pipeline_type, status;`,
            knowledgeBaseIndex.describeIndexStats(),
            sql`SELECT COUNT(*) FROM entities;`,
            sql`SELECT COUNT(*) FROM contacts;`,
            sql`SELECT status, COUNT(*)::int as count FROM features GROUP BY status;`,
            sql`SELECT COUNT(*) FROM logs;`,
            sql`SELECT COUNT(*) FROM endpoint_test_logs;`,
            sql`SELECT COUNT(*) FROM prompts;`,
            sql`SELECT COUNT(*) FROM brains;`
        ]);

        const totalFeatures = featureStats.rows.reduce((acc, r) => acc + r.count, 0);

        const stats = {
            conversations: {
                total: parseInt(conversationStats.rows[0].total_convos, 10),
                avgMessages: parseFloat(conversationStats.rows[0].avg_msgs_per_convo || 0).toFixed(1),
            },
            messages: {
                total: parseInt(messageCount.rows[0].count, 10),
            },
            pipelines: {
                contextAssembly: {
                    completed: pipelineRunStats.rows.find(r => r.pipeline_type === 'ContextAssembly' && r.status === 'completed')?.count || 0,
                    failed: pipelineRunStats.rows.find(r => r.pipeline_type === 'ContextAssembly' && r.status === 'failed')?.count || 0,
                    avgDuration: pipelineRunStats.rows.find(r => r.pipeline_type === 'ContextAssembly' && r.status === 'completed')?.avg_duration || 0,
                },
                memoryExtraction: {
                    completed: pipelineRunStats.rows.find(r => r.pipeline_type === 'MemoryExtraction' && r.status === 'completed')?.count || 0,
                    failed: pipelineRunStats.rows.find(r => r.pipeline_type === 'MemoryExtraction' && r.status === 'failed')?.count || 0,
                    avgDuration: pipelineRunStats.rows.find(r => r.pipeline_type === 'MemoryExtraction' && r.status === 'completed')?.avg_duration || 0,
                },
            },
            memory: {
                semanticVectors: pineconeStats.totalRecordCount || 0,
                structuredEntities: parseInt(entityCount.rows[0].count, 10),
                contacts: parseInt(contactCount.rows[0].count, 10),
                brains: parseInt(brainCount.rows[0].count, 10),
            },
            project: {
                featuresTracked: totalFeatures,
                featuresCompleted: featureStats.rows.find(r => r.status === '✅ Completed')?.count || 0,
                prompts: parseInt(promptCount.rows[0].count, 10),
            },
            system: {
                logs: parseInt(logCount.rows[0].count, 10),
                apiTestsRun: parseInt(testRunCount.rows[0].count, 10),
            }
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
