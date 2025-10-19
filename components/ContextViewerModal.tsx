"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CommandLineIcon, BrainIcon, WrenchScrewdriverIcon } from './Icons';
import type { PipelineRun } from '@/lib/types';

interface ContextViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    messageId: string | null;
    contextType: 'prompt' | 'system' | 'config' | null;
}

const modalConfig = {
    prompt: {
        title: "Final Prompt Sent to Model",
        icon: CommandLineIcon,
        key: 'final_llm_prompt',
    },
    system: {
        title: "System Instructions",
        icon: BrainIcon,
        key: 'final_system_instruction',
    },
    config: {
        title: "Model Configuration",
        icon: WrenchScrewdriverIcon,
        key: 'model_config_json',
    }
};

const ContextViewerModal = ({ isOpen, onClose, messageId, contextType }: ContextViewerModalProps) => {
    const [data, setData] = useState<PipelineRun | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && messageId) {
            const fetchData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const res = await fetch(`/api/inspect/${messageId}`);
                    const resData = await res.json();
                    if (!res.ok) throw new Error(resData.error || 'Failed to fetch context data.');
                    setData(resData.pipelineRun);
                } catch (e) {
                    setError((e as Error).message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, messageId]);

    const renderContent = () => {
        if (isLoading) return <p>Loading...</p>;
        if (error) return <p className="text-red-400">Error: {error}</p>;
        if (!data || !contextType) return <p>No data to display.</p>;
        
        const contentKey = modalConfig[contextType].key as keyof PipelineRun;
        let content = data[contentKey];

        if (typeof content === 'object' && content !== null) {
            content = JSON.stringify(content, null, 2);
        } else if (!content) {
            content = "No data recorded for this field.";
        }

        return (
            <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-900 p-3 rounded-md overflow-auto h-full">
                <code>{content as string}</code>
            </pre>
        );
    }
    
    const TitleIcon = contextType ? modalConfig[contextType].icon : 'div';
    const title = contextType ? modalConfig[contextType].title : 'Context Viewer';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-full max-h-[70vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-gray-700">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <TitleIcon className="w-5 h-5" />
                                {title}
                            </h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-hidden">
                           {renderContent()}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ContextViewerModal;
