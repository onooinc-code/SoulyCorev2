"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, BeakerIcon, CommandLineIcon, SparklesIcon, MagnifyingGlassIcon } from '@/components/Icons';
import type { PipelineRun, PipelineRunStep } from '@/lib/types';

interface CognitiveInspectorModalProps {
    onClose: () => void;
    messageId: string | null;
}

// FIX: Added explicit props interface and used React.FC to properly handle "children" prop and resolve type errors in component usage.
interface StepSectionProps {
    title: string;
    icon: any;
    children: React.ReactNode;
    color: string;
}

const StepSection: React.FC<StepSectionProps> = ({ title, icon: Icon, children, color }) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Icon className={`w-4 h-4 ${color}`} />
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</h4>
        </div>
        <div className="space-y-3">{children}</div>
    </div>
);

// FIX: Added explicit props interface and used React.FC to properly handle "key" prop during list mapping and resolve type mismatch errors.
interface PipelineStepProps {
    step: PipelineRunStep;
}

const PipelineStep: React.FC<PipelineStepProps> = ({ step }) => (
    <div className="bg-gray-900/50 border border-white/5 p-3 rounded-xl hover:border-indigo-500/30 transition-colors">
        <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-200">{step.stepName}</span>
            <span className="text-[10px] font-mono text-gray-500">{step.durationMs}ms</span>
        </div>
        <div className="space-y-2">
            {step.inputPayload && (
                <details className="group">
                    <summary className="text-[10px] text-indigo-400 cursor-pointer hover:text-indigo-300 select-none">View Input Data (Retrieved)</summary>
                    <pre className="mt-2 p-2 bg-black/40 rounded text-[10px] font-mono text-gray-400 overflow-x-auto max-h-40">
                        {JSON.stringify(step.inputPayload, null, 2)}
                    </pre>
                </details>
            )}
            {step.outputPayload && (
                <details className="group" open>
                    <summary className="text-[10px] text-emerald-400 cursor-pointer hover:text-emerald-300 select-none">View Result / Decision</summary>
                    <pre className="mt-2 p-2 bg-black/40 rounded text-[10px] font-mono text-emerald-500/80 overflow-x-auto max-h-60">
                        {JSON.stringify(step.outputPayload, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    </div>
);

const CognitiveInspectorModal = ({ onClose, messageId }: CognitiveInspectorModalProps) => {
    const [data, setData] = useState<{ pipelineRun: PipelineRun, pipelineSteps: PipelineRunStep[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!messageId) return;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/inspect/${messageId}`);
                setData(await res.json());
            } catch (e) { console.error(e); }
            finally { setIsLoading(false); }
        };
        fetchData();
    }, [messageId]);

    const retrievalSteps = data?.pipelineSteps.filter(s => s.stepName.toLowerCase().includes('retrieve') || s.stepName.toLowerCase().includes('search')) || [];
    const assemblySteps = data?.pipelineSteps.filter(s => s.stepName.toLowerCase().includes('assemble') || s.stepName.toLowerCase().includes('select')) || [];
    const executionSteps = data?.pipelineSteps.filter(s => !retrievalSteps.includes(s) && !assemblySteps.includes(s)) || [];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-end" onClick={onClose}>
            <motion.div 
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                className="bg-gray-950 w-full max-w-2xl h-full border-l border-white/10 flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-6 border-b border-white/5 flex justify-between items-center bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <BeakerIcon className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Cognitive War Room</h2>
                            <p className="text-xs text-gray-500 font-mono">Turn Trace: {messageId?.split('-')[0]}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><XIcon className="w-6 h-6" /></button>
                </header>

                <main className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center animate-pulse text-indigo-400 font-mono">Interrogating Cognitive Engine...</div>
                    ) : (
                        <>
                            <StepSection title="Step 1: Context Retrieval" icon={MagnifyingGlassIcon} color="text-blue-400">
                                {retrievalSteps.map(s => <PipelineStep key={s.id} step={s} />)}
                            </StepSection>

                            <StepSection title="Step 2: Prompt Assembly" icon={CommandLineIcon} color="text-purple-400">
                                {assemblySteps.map(s => <PipelineStep key={s.id} step={s} />)}
                                {data?.pipelineRun.finalSystemInstruction && (
                                    <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-xl">
                                        <p className="text-[10px] font-bold text-indigo-300 mb-2 uppercase">Final Prompt Composition</p>
                                        <div className="text-xs text-gray-300 font-mono line-clamp-6 hover:line-clamp-none transition-all cursor-help">
                                            {data.pipelineRun.finalSystemInstruction}
                                        </div>
                                    </div>
                                )}
                            </StepSection>

                            <StepSection title="Step 3: Response Generation" icon={SparklesIcon} color="text-emerald-400">
                                {executionSteps.map(s => <PipelineStep key={s.id} step={s} />)}
                            </StepSection>
                        </>
                    )}
                </main>

                <footer className="p-4 border-t border-white/5 bg-gray-900/30 text-center">
                    <p className="text-[10px] text-gray-600 italic">Total Process Latency: {data?.pipelineRun.durationMs || 0}ms</p>
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default CognitiveInspectorModal;