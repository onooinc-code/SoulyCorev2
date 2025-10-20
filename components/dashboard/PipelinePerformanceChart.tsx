"use client";

import { ResponsiveBar } from '@nivo/bar';
import { PipelinePerformanceChartData } from '@/lib/types';

const PipelinePerformanceChart = ({ data }: { data: PipelinePerformanceChartData[] }) => (
    <ResponsiveBar
        data={data}
        keys={['Completed', 'Failed']}
        indexBy="pipeline"
        margin={{ top: 20, right: 130, bottom: 50, left: 60 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={({ id, data }) => String(id) === 'Completed' ? '#22c55e' : '#ef4444'}
        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Pipeline',
            legendPosition: 'middle',
            legendOffset: 32
        }}
        axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Run Count',
            legendPosition: 'middle',
            legendOffset: -40
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        legends={[
            {
                dataFrom: 'keys',
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 120,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 20,
                effects: [{ on: 'hover', style: { itemOpacity: 1 } }]
            }
        ]}
        theme={{
            axis: {
                ticks: { text: { fill: '#9ca3af' } },
                legend: { text: { fill: '#e5e7eb' } }
            },
            legends: {
                text: { fill: '#e5e7eb' }
            },
            tooltip: {
                container: { background: '#1f2937', color: '#e5e7eb' }
            }
        }}
    />
);

export default PipelinePerformanceChart;
