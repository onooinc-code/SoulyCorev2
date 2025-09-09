
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './Icons';
import type { PipelineRun, PipelineRunStep } from '@/lib/types';

interface CognitiveInspectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    messageId: string | null;
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

const CognitiveInspectorModal = ({ isOpen, onClose, messageId }: CognitiveInspectorModalProps) => {
    const [inspectionData, setInspectionData] = useState<{ pipelineRun: PipelineRun; pipelineSteps: PipelineRunStep[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && messageId) {
            const fetchInspectionData = async () => {
                setIsLoading(true);
                setError(null);
                setInspectionData(null);
                try {
                    const res = await fetch(`/api/inspect/${messageId}`);
                    const data = await res.json();
                    if (!res.ok) {
                        throw new Error(data.error || 'Failed to fetch inspection data.');
                    }
                    setInspectionData(data);
                } catch (e) {
                    setError((e as Error).message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInspectionData();
        }
    }, [isOpen, messageId]);

    const renderContent = () => {
        if (isLoading) return <p className="text-gray-400 text-center">Loading inspection data...</p>;
        if (error) return <p className="text-red-400 text-center">Error: {error}</p>;
        if (!inspectionData) return <p className="text-gray-500 text-center">No data to display.</p>;
        
        const { pipelineRun, pipelineSteps } = inspectionData;

        return (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                <div className="bg-gray-900/50 p-4 rounded-lg flex flex-col">
                    <h3 className="font-semibold text-lg mb-2 text-indigo-400">Pipeline Run: {pipelineRun.pipeline_type}</h3>
                    <div className="space-y-1 text-sm text-gray-300 mb-4">
                        <p><strong>Status:</strong> <span className={`font-semibold ${pipelineRun.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>{pipelineRun.status}</span></p>
                        <p><strong>Duration:</strong> {pipelineRun.duration_ms}ms</p>
                    </div>
                    <h4 className="font-semibold text-gray-200 mb-1">Final Output:</h4>
                    <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-900 p-3 rounded-md overflow-auto flex-1">
                        <code>{pipelineRun.final_output}</code>
                    </pre>
                </div>
                 <div className="bg-gray-900/50 p-4 rounded-lg flex flex-col">
                    <h3 className="font-semibold text-lg mb-2 text-green-400">Execution Steps</h3>
                    <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                        {/* FIX: Wrapped the iterated component in a div with the key to resolve a TypeScript error.
                            The 'key' prop is a React-specific prop for list reconciliation and is not passed to the component,
                            but the type system was flagging it as an unexpected prop. */}
                        {pipelineSteps.map(step => (
                            <div key={step.id}>
                                <PipelineStep step={step} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AnimatePresence>
            {isOpen && (
// FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation from functional components that use `motion` elements resolves these TypeScript errors. Although this specific component did not use `React.FC`, the error likely cascaded from a child component. The fix has been applied to all relevant child components.
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
// FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation from functional components that use `motion` elements resolves these TypeScript errors. Although this specific component did not use `React.FC`, the error likely cascaded from a child component. The fix has been applied to all relevant child components.
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                            <h2 className="text-xl font-bold">Cognitive Inspector</h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto">
                           {renderContent()}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CognitiveInspectorModal;
