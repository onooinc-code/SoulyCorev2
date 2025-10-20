"use client";

import React, { useState, useEffect } from 'react';
import DashboardPanel from '../DashboardPanel';
import { 
    ChatBubbleLeftRightIcon, DocumentTextIcon, BrainIcon, UsersIcon, 
    CodeIcon, PromptsIcon, CpuChipIcon, BeakerIcon 
} from '../../Icons';
import type { FeatureStatusChartData, PipelinePerformanceChartData } from '@/lib/types';
import dynamic from 'next/dynamic';

const FeatureStatusChart = dynamic(() => import('../FeatureStatusChart'), { ssr: false });
const PipelinePerformanceChart = dynamic(() => import('../PipelinePerformanceChart'), { ssr: false });


interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}

const StatCard = ({ title, value, icon }: StatCardProps) => (
    <div className="bg-gray-800/50 p-4 rounded-lg flex items-center gap-4">
        <div className="p-3 bg-indigo-600/20 text-indigo-300 rounded-lg">{icon}</div>
        <div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-sm text-gray-400">{title}</div>
        </div>
    </div>
);

const StatsPanel = () => {
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<{ features: FeatureStatusChartData[], pipelines: PipelinePerformanceChartData[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [statsRes, chartsRes] = await Promise.all([
                    fetch('/api/dashboard/stats'),
                    fetch('/api/dashboard/charts'),
                ]);

                if (!statsRes.ok || !chartsRes.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const statsData = await statsRes.json();
                const chartsData = await chartsRes.json();
                
                setStats(statsData);
                setChartData(chartsData);

            } catch (error) {
                console.error("Failed to fetch stats panel data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <DashboardPanel title="System Statistics">
                <div className="text-center text-gray-400 p-8">Loading statistics...</div>
            </DashboardPanel>
        );
    }
    
    if (!stats || !chartData) {
         return (
            <DashboardPanel title="System Statistics">
                <div className="text-center text-red-400 p-8">Failed to load statistics.</div>
            </DashboardPanel>
        );
    }
    
    const totalPipelines = (stats.pipelines.contextAssembly.completed + stats.pipelines.contextAssembly.failed) + (stats.pipelines.memoryExtraction.completed + stats.pipelines.memoryExtraction.failed);

    return (
        <DashboardPanel title="System Statistics">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Conversations" value={stats.conversations.total} icon={<ChatBubbleLeftRightIcon className="w-6 h-6"/>} />
                <StatCard title="Total Messages" value={stats.messages.total} icon={<DocumentTextIcon className="w-6 h-6"/>} />
                <StatCard title="Semantic Memories" value={stats.memory.semanticVectors} icon={<BrainIcon className="w-6 h-6"/>} />
                <StatCard title="Entities & Contacts" value={stats.memory.structuredEntities + stats.memory.contacts} icon={<UsersIcon className="w-6 h-6"/>} />
                <StatCard title="Features Tracked" value={stats.project.featuresTracked} icon={<CodeIcon className="w-6 h-6"/>} />
                <StatCard title="Prompts Created" value={stats.project.prompts} icon={<PromptsIcon className="w-6 h-6"/>} />
                <StatCard title="Pipelines Executed" value={totalPipelines} icon={<CpuChipIcon className="w-6 h-6"/>} />
                <StatCard title="API Tests Run" value={stats.system.apiTestsRun} icon={<BeakerIcon className="w-6 h-6"/>} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-700">
                <div className="bg-gray-800/50 p-4 rounded-lg h-80">
                    <h4 className="font-semibold text-center mb-2">Feature Health Status</h4>
                    <FeatureStatusChart data={chartData.features} />
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg h-80">
                     <h4 className="font-semibold text-center mb-2">Pipeline Performance</h4>
                    <PipelinePerformanceChart data={chartData.pipelines} />
                </div>
            </div>
        </DashboardPanel>
    );
};

export default StatsPanel;
