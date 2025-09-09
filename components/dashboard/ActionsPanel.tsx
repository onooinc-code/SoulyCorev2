"use client";

import React, { useState } from 'react';
import { BeakerIcon, RefreshIcon, TrashIcon, ArrowDownOnSquareIcon, CpuChipIcon, DocumentTextIcon, SparklesIcon, CodeIcon } from '../Icons';
import { useLog } from '../providers/LogProvider';

interface ActionButtonProps {
    title: string;
    description: string;
    action: () => Promise<string>;
    icon: React.ReactNode;
}

const ActionButton = ({ title, description, action, icon }: ActionButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleClick = async () => {
        setIsLoading(true);
        setResult(null);
        const res = await action();
        setResult(res);
        setIsLoading(false);
        setTimeout(() => setResult(null), 5000);
    };

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg flex flex-col justify-between h-36">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-600/20 text-indigo-300 rounded-full">{icon}</div>
                    <h4 className="font-semibold text-gray-200 text-sm">{title}</h4>
                </div>
                <p className="text-xs text-gray-400">{description}</p>
            </div>
            <div className="flex justify-between items-center mt-2">
                {result ? (
                    <p className="text-xs text-green-300 p-1 flex-1 text-center">{result}</p>
                ) : (
                    <div/> 
                )}
                <button 
                    onClick={handleClick}
                    disabled={isLoading}
                    className="px-3 py-1 bg-blue-600 text-xs rounded-md hover:bg-blue-500 disabled:opacity-50"
                >
                    {isLoading ? 'Running...' : 'Run'}
                </button>
            </div>
        </div>
    );
};

const ActionsPanel = () => {
    const { log } = useLog();

    const runAllApiTests = async (): Promise<string> => {
        log('User triggered "Run All API Tests" action.');
        try {
            const res = await fetch('/api/api-endpoints/test-all', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Batch test failed');
            return data.message;
        } catch (error) {
            return `Error: ${(error as Error).message}`;
        }
    };

    const mockAction = (name: string) => async (): Promise<string> => {
        log(`User triggered mock action: ${name}`);
        return new Promise(resolve => setTimeout(() => resolve(`${name} completed successfully.`), 1500));
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ActionButton 
                title="Run All API Tests"
                description="Execute a health check on all registered API endpoints."
                action={runAllApiTests}
                icon={<BeakerIcon className="w-5 h-5" />}
            />
             <ActionButton 
                title="Re-index Semantic Memory"
                description="(Mock) Rebuilds the Pinecone vector index from source documents."
                action={mockAction("Re-index")}
                icon={<RefreshIcon className="w-5 h-5" />}
            />
             <ActionButton 
                title="Clear Application Cache"
                description="(Mock) Purges all temporary data from the Vercel KV store."
                action={mockAction("Cache Clear")}
                icon={<TrashIcon className="w-5 h-5" />}
            />
             <ActionButton 
                title="Trigger System Backup"
                description="(Mock) Creates a snapshot of the primary database."
                action={mockAction("Backup")}
                icon={<ArrowDownOnSquareIcon className="w-5 h-5" />}
            />
            <ActionButton 
                title="Optimize Database"
                description="(Mock) Runs VACUUM and ANALYZE on the Postgres database."
                action={mockAction("DB Optimize")}
                icon={<CpuChipIcon className="w-5 h-5" />}
            />
            <ActionButton 
                title="Run Security Scan"
                description="(Mock) Initiates a mock vulnerability scan on the system."
                action={mockAction("Security Scan")}
                icon={<SparklesIcon className="w-5 h-5" />}
            />
            <ActionButton 
                title="Generate Weekly Report"
                description="(Mock) Generates and saves the weekly system usage report."
                action={mockAction("Report Gen")}
                icon={<DocumentTextIcon className="w-5 h-5" />}
            />
             <ActionButton 
                title="Sync with GitHub"
                description="(Mock) Fetches latest feature specs from a linked repo."
                action={mockAction("GitHub Sync")}
                icon={<CodeIcon className="w-5 h-5" />}
            />
        </div>
    );
};

export default ActionsPanel;