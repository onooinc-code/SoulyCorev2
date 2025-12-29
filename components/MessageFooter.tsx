
"use client";

import React, { useState } from 'react';
import type { Message, PipelineRun } from '@/lib/types';
import { ClockIcon, CpuChipIcon, BookmarkIcon, ArrowsRightLeftIcon, BrainIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

interface MessageFooterProps {
    message: Message;
    isContextAssemblyRunning: boolean;
    isMemoryExtractionRunning: boolean;
    findMessageById: (id: string) => Message | undefined;
}

const MessageFooter = ({ message, isContextAssemblyRunning, isMemoryExtractionRunning, findMessageById }: MessageFooterProps) => {
    const parentMessage = message.parentMessageId ? findMessageById(message.parentMessageId) : null;
    const [isExtractionVisible, setExtractionVisible] = useState(false);
    const [extractionData, setExtractionData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleViewExtraction = async () => {
        if (isExtractionVisible) {
            setExtractionVisible(false);
            return;
        }
        
        setExtractionVisible(true);
        setIsLoading(true);
        try {
            const res = await fetch(`/api/inspect/${message.id}`);
            const data = await res.json();
            // Look for the MemoryExtraction pipeline run
            const runs = Array.isArray(data) ? data : [data.pipelineRun]; // Support both formats
            const extractionRun = runs.find((r: any) => r?.pipelineType === 'MemoryExtraction');
            
            if (extractionRun && extractionRun.finalOutput) {
                try {
                    setExtractionData(JSON.parse(extractionRun.finalOutput));
                } catch {
                    setExtractionData({ raw: extractionRun.finalOutput });
                }
            } else {
                setExtractionData(null);
            }
        } catch (e) {
            console.error("Failed to load extraction data", e);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col gap-2 mt-1.5">
            <div className="text-xs text-gray-500 flex items-center justify-between h-5">
                <div className="flex items-center gap-3">
                    {message.responseTime && (
                        <div className="flex items-center gap-1" title="AI response time">
                            <ClockIcon className="w-3.5 h-3.5" />
                            <span>{message.responseTime}ms</span>
                        </div>
                    )}
                    {message.tokenCount && (
                         <div className="flex items-center gap-1" title="Token count">
                            <CpuChipIcon className="w-3.5 h-3.5" />
                            <span>{message.tokenCount}</span>
                        </div>
                    )}
                    
                    {/* NEW: Extraction Tool */}
                    {message.role === 'model' && (
                        <button 
                            onClick={handleViewExtraction}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${isExtractionVisible ? 'bg-indigo-500 text-white' : 'hover:bg-gray-700 text-indigo-400'}`}
                            title="See what I learned from this turn"
                        >
                            <BrainIcon className="w-3.5 h-3.5" />
                            <span className="font-bold uppercase text-[9px]">Extracted</span>
                        </button>
                    )}

                    {message.isBookmarked && <BookmarkIcon className="w-3.5 h-3.5 text-yellow-500" />}
                    {parentMessage && <ArrowsRightLeftIcon className="w-3.5 h-3.5" />}
                </div>

                <div className="flex items-center gap-2">
                    {isContextAssemblyRunning && <span className="text-indigo-400 animate-pulse text-[10px]">Assembling Context...</span>}
                    {isMemoryExtractionRunning && <span className="text-yellow-400 animate-pulse text-[10px]">Harvesting Knowledge...</span>}
                </div>
            </div>

            {/* Extraction Quick-View Panel */}
            <AnimatePresence>
                {isExtractionVisible && (
                    <MotionDiv 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-900/80 border border-indigo-500/20 rounded-lg p-3 overflow-hidden"
                    >
                        <h5 className="text-[10px] font-bold text-indigo-300 uppercase mb-2">Memory Harvest Results:</h5>
                        {isLoading ? (
                            <div className="animate-pulse text-[10px] text-gray-500">Retrieving from memory vault...</div>
                        ) : extractionData ? (
                            <div className="space-y-2">
                                {extractionData.userProfile && (
                                    <div className="text-[10px]">
                                        <span className="text-emerald-400 font-bold">PROFILE: </span>
                                        <span className="text-gray-300">{JSON.stringify(extractionData.userProfile)}</span>
                                    </div>
                                )}
                                {extractionData.entities?.length > 0 && (
                                    <div className="text-[10px]">
                                        <span className="text-blue-400 font-bold">ENTITIES: </span>
                                        <span className="text-gray-300">{extractionData.entities.map((e:any)=>e.name).join(', ')}</span>
                                    </div>
                                )}
                                {extractionData.facts?.length > 0 && (
                                    <div className="text-[10px]">
                                        <span className="text-purple-400 font-bold">FACTS: </span>
                                        <span className="text-gray-300">{extractionData.facts.join(' | ')}</span>
                                    </div>
                                )}
                                {!extractionData.userProfile && (!extractionData.entities || extractionData.entities.length === 0) && (
                                    <div className="text-[10px] text-gray-500 italic">No structural data harvested from this specific turn.</div>
                                )}
                            </div>
                        ) : (
                            <div className="text-[10px] text-gray-500 italic">Extraction data still processing or not found.</div>
                        )}
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MessageFooter;
