
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { useLog } from '../providers/LogProvider';

interface BrainStat {
    id: string;
    name: string;
    entityCount: number;
    relationshipCount: number;
}

const BrainVisualizerTab = () => {
    const { log } = useLog();
    const [stats, setStats] = useState<BrainStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/brains/stats');
            if (!res.ok) throw new Error("Failed to fetch brain analytics");
            const data = await res.json();
            setStats(data);
        } catch (error) {
            log('Error fetching brain stats', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const pieData = stats.map(s => ({
        id: s.name,
        label: s.name,
        value: s.entityCount,
    }));

    const barData = stats.map(s => ({
        brain: s.name,
        Entities: s.entityCount,
        Relationships: s.relationshipCount
    }));

    if (isLoading) return <div className="p-8 text-center animate-pulse">Calculating brain capacity...</div>;

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                <div className="bg-gray-900/50 p-6 rounded-xl border border-white/5">
                    <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Knowledge Distribution (Entities)</h4>
                    <ResponsivePie
                        data={pieData}
                        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                        innerRadius={0.6}
                        padAngle={2}
                        cornerRadius={4}
                        colors={{ scheme: 'nivo' }}
                        borderWidth={1}
                        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor="#9ca3af"
                        theme={{ tooltip: { container: { background: '#111827', color: '#fff' } } }}
                    />
                </div>
                <div className="bg-gray-900/50 p-6 rounded-xl border border-white/5">
                    <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Connectivity vs Depth</h4>
                    <ResponsiveBar
                        data={barData}
                        keys={['Entities', 'Relationships']}
                        indexBy="brain"
                        margin={{ top: 40, right: 130, bottom: 50, left: 60 }}
                        padding={0.3}
                        groupMode="grouped"
                        colors={{ scheme: 'set2' }}
                        theme={{ 
                            axis: { ticks: { text: { fill: '#9ca3af' } } },
                            tooltip: { container: { background: '#111827', color: '#fff' } }
                        }}
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
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto">
                {stats.map(s => (
                    <div key={s.id} className="p-4 bg-gray-900/80 rounded-lg border border-indigo-500/20 shadow-xl">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase">{s.name}</p>
                        <div className="flex justify-between items-end mt-1">
                            <span className="text-2xl font-bold text-white">{s.entityCount + s.relationshipCount}</span>
                            <span className="text-[10px] text-gray-500">Nodes Total</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BrainVisualizerTab;
