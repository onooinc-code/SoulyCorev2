
"use client";

import React, { useState, useEffect, useCallback } from 'react';
// FIX: Corrected typo from AnatePresence to AnimatePresence.
import { motion, AnimatePresence } from 'framer-motion';
import { Subsystem } from '@/lib/types';
import SubsystemCard from './SubsystemCard';
import DependencyGraph from './DependencyGraph';
import SubsystemDetailModal from './SubsystemDetailModal';
import { Reorder } from 'framer-motion';

const HedraGoalsPanel = () => {
    const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSubsystem, setSelectedSubsystem] = useState<Subsystem | null>(null);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<{ title: string; content: string } | null>(null);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    
    const fetchSubsystems = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/subsystems');
            if (!res.ok) throw new Error("Failed to fetch subsystems");
            const data = await res.json();
            setSubsystems(data);
        } catch (error) {
            console.error("HedraGoalsPanel Error:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubsystems();
    }, [fetchSubsystems]);

    const handleAiAction = async (subsystem: Subsystem, action: 'summary' | 'risk') => {
        const url = action === 'summary' ? '/api/dashboard/ai-summary' : '/api/dashboard/ai-risk-assessment';
        const title = action === 'summary' ? `AI Summary for ${subsystem.name}` : `AI Risk Assessment for ${subsystem.name}`;
        
        setAiAnalysisResult({ title, content: 'Analyzing with Gemini...' });
        setIsAiModalOpen(true);
        
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subsystem }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'AI analysis failed');
            setAiAnalysisResult({ title, content: data.result });
        } catch (error) {
            setAiAnalysisResult({ title, content: `Error: ${(error as Error).message}` });
        }
    };

    if (isLoading) {
        return (
            <div className="p-4 bg-gray-900/50 rounded-lg text-gray-400 text-center">
                Loading Ecosystem Command Center...
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-900/50 rounded-lg text-gray-200" dir="rtl">
            {/* Top-level goals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-indigo-500">
                    <h4 className="font-bold text-white">المهمة الأساسية</h4>
                    <p className="text-sm text-gray-300 mt-1">تحقيق الإدارة والأتمتة الكاملة لحياة "هدرا" بكل تفاصيلها.</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-cyan-500">
                    <h4 className="font-bold text-white">المخطط الاستراتيجي</h4>
                    <p className="text-sm text-gray-300 mt-1">بناء منظومة بيئية معيارية (API-First) من خدمات مصغرة متخصصة.</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-bold text-white">الحالة الراهنة</h4>
                    <p className="text-sm text-gray-300 mt-1">تطوير نشط للمكونات التأسيسية مثل HedraSoul و SoulyCore.</p>
                </div>
            </div>

            {/* Ecosystem Command Center */}
            <div className="mt-4 pt-4 border-t border-gray-700">
                <h3 className="text-xl font-bold text-center mb-4 text-indigo-300">مركز قيادة المنظومة البيئية (Ecosystem Command Center)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Dependency Graph */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h4 className="font-semibold text-center mb-4">خريطة الترابط (Dependency Map)</h4>
                        <DependencyGraph subsystems={subsystems} />
                    </div>

                    {/* Right: Subsystems List */}
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h4 className="font-semibold text-center mb-4">الأنظمة الفرعية (Subsystems)</h4>
                        <Reorder.Group axis="y" values={subsystems} onReorder={setSubsystems} className="space-y-3">
                            {/* FIX: Wrapped the iterated `SubsystemCard` component in a `Reorder.Item` to use framer-motion's reordering feature correctly and resolve a TypeScript error where the `key` prop was being passed down. */}
                            {subsystems.map(sub => (
                                <Reorder.Item key={sub.id} value={sub}>
                                    <SubsystemCard 
                                        subsystem={sub} 
                                        onOpenDetails={() => setSelectedSubsystem(sub)}
                                        onAiAction={handleAiAction}
                                    />
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>
                </div>
            </div>
            
            <AnimatePresence>
                {selectedSubsystem && (
                    <SubsystemDetailModal 
                        subsystem={selectedSubsystem} 
                        onClose={() => setSelectedSubsystem(null)} 
                    />
                )}
                {isAiModalOpen && aiAnalysisResult && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4"
                        onClick={() => setIsAiModalOpen(false)}
                    >
                         <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6"
                            onClick={e => e.stopPropagation()}
                         >
                            <h3 className="font-bold text-lg mb-4">{aiAnalysisResult.title}</h3>
                            <div className="prose-custom max-h-80 overflow-y-auto text-gray-300 whitespace-pre-wrap">{aiAnalysisResult.content}</div>
                            <button onClick={() => setIsAiModalOpen(false)} className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg w-full">Close</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default HedraGoalsPanel;
