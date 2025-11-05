"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/lib/hooks/use-notifications';
import { DocumentMagnifyingGlassIcon } from '@/components/Icons';

interface HighlightedEntity {
    name: string;
    description: string;
    indices: [number, number][];
}

interface PopoverState {
    visible: boolean;
    content: string;
    x: number;
    y: number;
}

const ContextualAnalyzer = () => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<HighlightedEntity[] | null>(null);
    const [popover, setPopover] = useState<PopoverState>({ visible: false, content: '', x: 0, y: 0 });
    const { addNotification } = useNotification();
    const resultRef = useRef<HTMLDivElement>(null);

    const handleAnalyze = async () => {
        if (!text.trim()) {
            addNotification({ type: 'warning', title: 'Please paste some text to analyze.' });
            return;
        }
        setIsLoading(true);
        setResults(null);
        try {
            const res = await fetch('/api/contextual-analyzer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to analyze text.');
            setResults(data.highlightedEntities);
        } catch (error) {
            addNotification({ type: 'error', title: 'Analysis Failed', message: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMouseOver = (e: React.MouseEvent<HTMLElement>, description: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPopover({
            visible: true,
            content: description,
            x: rect.left,
            y: rect.bottom + window.scrollY,
        });
    };

    const handleMouseOut = () => {
        setPopover({ visible: false, content: '', x: 0, y: 0 });
    };

    const renderHighlightedText = () => {
        if (!results) return <p className="text-gray-400">{text}</p>;
    
        const parts = [];
        let lastIndex = 0;
    
        const allHighlights: { start: number; end: number; description: string }[] = [];
        results.forEach(entity => {
            entity.indices.forEach(([start, end]) => {
                allHighlights.push({ start, end, description: entity.description });
            });
        });
    
        allHighlights.sort((a, b) => a.start - b.start);
    
        for (const { start, end, description } of allHighlights) {
            if (start > lastIndex) {
                parts.push(<span key={lastIndex}>{text.substring(lastIndex, start)}</span>);
            }
            parts.push(
                <mark
                    key={start}
                    className="bg-indigo-500/30 text-indigo-200 rounded px-1 cursor-pointer"
                    onMouseOver={(e) => handleMouseOver(e, description)}
                    onMouseOut={handleMouseOut}
                >
                    {text.substring(start, end)}
                </mark>
            );
            lastIndex = end;
        }
    
        if (lastIndex < text.length) {
            parts.push(<span key={lastIndex}>{text.substring(lastIndex)}</span>);
        }
    
        return <div className="whitespace-pre-wrap leading-relaxed">{parts}</div>;
    };
    

    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
             <AnimatePresence>
                {popover.visible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{ left: popover.x, top: popover.y }}
                        className="fixed z-50 p-3 bg-gray-900 border border-indigo-500 rounded-lg shadow-xl max-w-sm text-sm"
                    >
                        {popover.content}
                    </motion.div>
                )}
            </AnimatePresence>
            <header className="flex-shrink-0 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Contextual Analyzer</h2>
                <p className="text-sm text-gray-400 mt-1">Paste any text to automatically highlight known entities from your memory.</p>
            </header>

            <div className="grid grid-cols-2 gap-6 flex-1 mt-6 overflow-hidden">
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-semibold">Input Text</h3>
                    <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste an article, email, or any text here..."
                        className="w-full flex-1 p-3 bg-gray-800 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <DocumentMagnifyingGlassIcon className="w-5 h-5" />
                        {isLoading ? 'Analyzing...' : 'Analyze Text'}
                    </button>
                </div>
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-semibold">Analysis Results</h3>
                    <div ref={resultRef} className="w-full flex-1 p-3 bg-gray-800 rounded-lg overflow-y-auto">
                        {isLoading && <p className="text-gray-400 animate-pulse">Analyzing...</p>}
                        {results && renderHighlightedText()}
                        {!isLoading && !results && <p className="text-gray-500">Results will appear here after analysis.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContextualAnalyzer;