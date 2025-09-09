
"use client";

import { ResponsivePie } from '@nivo/pie';
import { FeatureStatusChartData } from '@/lib/types';

const FeatureStatusChart = ({ data }: { data: FeatureStatusChartData[] }) => (
    <ResponsivePie
        data={data}
        margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
        innerRadius={0.5}
        padAngle={0.7}
        cornerRadius={3}
        activeOuterRadiusOffset={8}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="#e5e7eb"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        colors={{ datum: 'data.color' }}
        theme={{
            tooltip: {
                container: {
                    background: '#1f2937',
                    color: '#e5e7eb',
                    fontSize: '12px',
                },
            },
            labels: {
                text: {
                    fill: '#e5e7eb',
                },
            },
        }}
        legends={[
            {
                anchor: 'bottom',
                direction: 'row',
                justify: false,
                translateX: 0,
                translateY: 56,
                itemsSpacing: 0,
                itemWidth: 100,
                itemHeight: 18,
                itemTextColor: '#999',
                itemDirection: 'left-to-right',
                itemOpacity: 1,
                symbolSize: 18,
                symbolShape: 'circle',
                effects: [
                    {
                        on: 'hover',
                        style: {
                            itemTextColor: '#fff'
                        }
                    }
                ]
            }
        ]}
    />
);

export default FeatureStatusChart;
