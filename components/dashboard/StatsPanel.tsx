"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLog } from '../providers/LogProvider';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { BrainIcon, ChatBubbleLeftRightIcon, CpuChipIcon, UsersIcon, CheckIcon, LogIcon, BeakerIcon, PromptsIcon } from '../Icons';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}

const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const StatCard = ({ title, value, icon }: StatCardProps) => (
    <motion.div variants={cardVariant} className="bg-gray-900/50 p-3 rounded-lg flex items-center gap-3">
        <div className="p-2 bg-indigo-600/20 text-indigo-300 rounded-full">{icon}</div>
        <div>
            <div className="text-xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400">{title}</div>
        </div>
    </motion.div>
);

const ChartSkeleton = () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900/30 rounded-lg animate-pulse">
        <p className="text-sm text-gray-500">Loading Chart...</p>
    </div>
);

const FeatureStatusChart = dynamic(() => import('./FeatureStatusChart'), { ssr: false, loading: () => <ChartSkeleton /> });
const PipelinePerformanceChart = dynamic(() => import('./PipelinePerformanceChart'), { ssr: false, loading: () => <ChartSkeleton /> });


const StatsPanel = () => {
    const [stats, setStats] = useState<any | null>(null);
    const [chartData, setChartData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { log } = useLog();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [statsRes, chartsRes] = await Promise.all([
                fetch('/api/dashboard/stats'),
                fetch('/api/dashboard/charts')
            ]);
            if (!statsRes.ok || !chartsRes.ok) throw new Error("Failed to fetch dashboard data.");
            
            const statsData = await statsRes.json();
            const chartsData = await chartsRes.json();

            setStats(statsData);
            setChartData(chartsData);

        } catch (error) {
            log('Failed to fetch dashboard data', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return <div className="text-center text-gray-400">Loading stats...</div>;
    }
    
    if (!stats || !chartData) {
        return <div className="text-center text-red-400">Could not load statistics.</div>;
    }

    return (
        <div>
            <motion.div 
                variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.05 } }
                }}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
            >
                <StatCard title="Total Conversations" value={stats.conversations.total} icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />} />
                <StatCard title="Total Messages" value={stats.messages.total} icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />} />
                <StatCard title="Semantic Memories" value={stats.memory.semanticVectors} icon={<BrainIcon className="w-5 h-5" />} />
                <StatCard title="Structured Entities" value={stats.memory.structuredEntities} icon={<CpuChipIcon className="w-5 h-5" />} />
                <StatCard title="Features Tracked" value={stats.project.featuresTracked} icon={<CheckIcon className="w-5 h-5" />} />
                <StatCard title="API Tests Run" value={stats.system.apiTestsRun} icon={<BeakerIcon className="w-5 h-5" />} />
            </motion.div>
            
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 h-80">
                <div className="bg-gray-900/50 p-4 rounded-lg flex flex-col">
                    <h4 className="font-semibold text-gray-200 mb-2 text-sm">Feature Status Breakdown</h4>
                    <div className="flex-1">
                        <FeatureStatusChart data={chartData.features} />
                    </div>
                </div>
                 <div className="bg-gray-900/50 p-4 rounded-lg flex flex-col">
                    <h4 className="font-semibold text-gray-200 mb-2 text-sm">Cognitive Pipeline Performance</h4>
                     <div className="flex-1">
                        <PipelinePerformanceChart data={chartData.pipelines} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsPanel;