

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { FeatureStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const [featureStats, pipelineRunStats] = await Promise.all([
            sql`SELECT status, COUNT(*)::int as count FROM features GROUP BY status;`,
            sql`SELECT 
                "pipelineType", 
                status, 
                COUNT(*)::int as count,
                AVG("durationMs")::float as avg_duration
             FROM pipeline_runs 
             GROUP BY "pipelineType", status;`
        ]);

        const featureStatusColorMap: Record<FeatureStatus, { label: string, color: string }> = {
            '✅ Completed': { label: 'Completed', color: 'hsl(140, 70%, 50%)' },
            '🟡 Needs Improvement': { label: 'Needs Improvement', color: 'hsl(45, 80%, 60%)' },
            '🔴 Needs Refactor': { label: 'Needs Refactor', color: 'hsl(0, 70%, 60%)' },
            '⚪ Planned': { label: 'Planned', color: 'hsl(210, 9%, 55%)' },
        };

        const featuresData = featureStats.rows.map(row => {
            const status = row.status as FeatureStatus;
            const mapping = featureStatusColorMap[status] || { label: 'Other', color: 'hsl(210, 9%, 45%)' };
            return {
                id: mapping.label,
                label: mapping.label,
                value: row.count,
                color: mapping.color,
            };
        });

        const pipelineDataMap: Record<string, any> = {
            'ContextAssembly': { pipeline: 'Context Assembly', Completed: 0, Failed: 0, 'Avg Duration (ms)': 0 },
            'MemoryExtraction': { pipeline: 'Memory Extraction', Completed: 0, Failed: 0, 'Avg Duration (ms)': 0 }
        };

        pipelineRunStats.rows.forEach(row => {
            if (pipelineDataMap[row.pipelineType]) {
                if (row.status === 'completed') {
                    pipelineDataMap[row.pipelineType]['Completed'] = row.count;
                    pipelineDataMap[row.pipelineType]['Avg Duration (ms)'] = Math.round(row.avg_duration || 0);
                } else if (row.status === 'failed') {
                    pipelineDataMap[row.pipelineType]['Failed'] = row.count;
                }
            }
        });
        const pipelinesData = Object.values(pipelineDataMap);

        return NextResponse.json({
            features: featuresData,
            pipelines: pipelinesData,
        });

    } catch (error) {
        console.error('Failed to fetch dashboard chart data:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}