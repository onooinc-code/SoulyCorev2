

"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// FIX: Corrected a relative import path for icon components to use the absolute path alias `@`, resolving a module resolution error during the build process.
// FIX: Added BeakerIcon to the import list to resolve a 'Cannot find name' error.
import { XIcon, InfoIcon, CommandLineIcon, WrenchScrewdriverIcon, BrainIcon, BeakerIcon } from '@/components/Icons';
// FIX: Corrected import paths for types.
import type { PipelineRun, PipelineRunStep } from '@/lib/types';

interface CognitiveInspectorModalProps {
    onClose: () => void;
    messageId: string | null;
}

interface InspectionData {
    pipelineRun: PipelineRun;
    pipelineSteps: PipelineRunStep[];
}

const PipelineStep = ({ step }: { step: PipelineRunStep }) => (
    <div className="bg-gray-900 p-3 rounded-lg">
        <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-200">
                Step {step.step_order}: {step.step_name}
            </h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${step.status === 'completed' ? 'bg-green-600/50 text-green-300' : 'bg-red-600/50 text-red-300'}`}>
                {step.status}
            </span>
        </div>
        <details className="mt-2 text-xs text-gray-400">
            <summary className="cursor-pointer focus:outline-none">Show Details</summary>
            <div className="mt-2 space-y-2 pl-2 border-l border-gray-700">
                {step.input_payload && (
                    <div>
                        <h5 className="font-semibold">Input:</h5>
                        <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-800 p-2 rounded-md overflow-auto">
                            <code>{JSON.stringify(step.input_payload, null, 2)}</code>
                        </pre>
                    </div>
                )}
                 {step.output_payload && (
                    <div>
                        <h5 className="font-semibold">Output:</h5>
                        <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-800 p-2 rounded-md overflow-auto">
                            <code>{JSON.stringify(step.output_payload, null, 2)}</code>
                        </pre>
                    </div>
                )}
                {step.model_used && (
                     <div>
                        <h5 className="font-semibold">AI Call Details:</h5>
                        <div className="font-mono bg-gray-800 p-2 rounded-md overflow-auto">
                           <p><strong>Model:</strong> {step.model_used}</p>
                           {step.config_used && <p><strong>Config:</strong> {JSON.stringify(step.config_used)}</p>}
                           <details className="mt-1">
                                <summary className="cursor-pointer">View Prompt</summary>
                                <pre className="text-xs whitespace-pre-wrap mt-1"><code>{step.prompt_used}</code></pre>
                           </details>
                        </div>
                    </div>
                )}
                {step.error_message && (
                    <div>
                        <h5 className="font-semibold text-red-400">Error:</h5>
                        <pre className="text-xs whitespace-pre-wrap font-mono bg-red-900/50 p-2 rounded-md overflow-auto">
                            <code>{step.error_message}</code>
                        </pre>
                    </div>
                )}
                <p>Duration: {step.duration_ms}ms</p>
            </div>
        </details>
    </div>
);

const renderContent = (data: any, title: string, icon: React.FC<any>) => (
    <div className="h-full flex flex-col">
        <div className="flex-shrink-0 flex items-center gap-2 mb-2">
            {React.createElement(icon, { className: 'w-5 h-5' })}
            <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="flex-1 bg-gray-900/50 rounded-lg p-3 overflow-auto">
            <pre className="text-xs whitespace-pre-wrap font-mono">
                <code>{JSON.stringify(data, null, 2)}</code>
            </pre>
        </div>
    </div>
);

const CognitiveInspectorModal = ({ onClose, messageId }: CognitiveInspectorModalProps) => {
    const [data, setData] = useState<InspectionData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (messageId) {
            const fetchData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const res = await fetch(`/api/inspect/${messageId}`);
                    const resData = await res.json();
                    if (!res.ok) throw new Error(resData.error || 'Failed to fetch inspection data.');
                    setData(resData);
                } catch (e) {
                    setError((e as Error).message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [messageId]);

    const renderMainContent = () => {
        if (isLoading) return <p className="text-center p-8">Loading inspection data...</p>;
        if (error) return <p className="text-center p-8 text-red-400">Error: {error}</p>;
        if (!data || !data.pipelineRun) return <p className="text-center p-8">No inspection data available for this message.</p>;

        const { pipelineRun, pipelineSteps } = data;

        return (
            <div className="space-y-4">
                <div className="bg-gray-900 p-3 rounded-lg">
                    <h3 className="font-semibold text-gray-200 mb-2">Pipeline Summary</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <span><strong>Pipeline:</strong> {pipelineRun.pipeline_type}</span>
                        <span><strong>Status:</strong> <span className={pipelineRun.status === 'completed' ? 'text-green-400' : 'text-red-400'}>{pipelineRun.status}</span></span>
                        <span><strong>Duration:</strong> {pipelineRun.duration_ms}ms</span>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-200 mb-2">Execution Steps</h3>
                    <div className="space-y-3">
                        {pipelineSteps.map(step => <PipelineStep key={step.id} step={step} />)}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BeakerIcon className="w-6 h-6 text-indigo-400" />
                        Cognitive Process Inspector
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                    {renderMainContent()}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CognitiveInspectorModal;