
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CodeIcon, CheckIcon, TrashIcon, RefreshIcon, SparklesIcon, EyeIcon, SearchIcon, BeakerIcon } from '@/components/Icons';
import { useLog } from '../providers/LogProvider';
import { useNotification } from '@/lib/hooks/use-notifications';

interface ProjectContextModalProps {
    projectId: string;
    projectName: string;
    onClose: () => void;
}

interface StoredContextItem {
    _id: string;
    type: string;
    content: string;
    createdAt: string;
}

interface SearchMatch {
    id: string;
    text: string;
    score: number;
}

const ProjectContextModal = ({ projectId, projectName, onClose }: ProjectContextModalProps) => {
    const [activeTab, setActiveTab] = useState<'inject' | 'view' | 'test'>('inject');
    
    // Inject State
    const [contextType, setContextType] = useState<'business' | 'schema' | 'code'>('business');
    const [content, setContent] = useState('');
    const [isIngesting, setIsIngesting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{ summary: string; keyPoints: string[] } | null>(null);

    // View State
    const [storedItems, setStoredItems] = useState<StoredContextItem[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);

    // Test Recall State
    const [testQuery, setTestQuery] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testResults, setTestResults] = useState<SearchMatch[]>([]);
    const [hasTested, setHasTested] = useState(false);
    
    const { log } = useLog();
    const { addNotification } = useNotification();

    const fetchStoredContext = async () => {
        setIsLoadingItems(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/context`);
            if (res.ok) {
                const data = await res.json();
                setStoredItems(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingItems(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'view') {
            fetchStoredContext();
        }
    }, [activeTab]);

    const handleAnalyze = async () => {
        if (!content.trim()) return;
        setIsAnalyzing(true);
        setAnalysisResult(null);
        try {
            const res = await fetch('/api/projects/analyze-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, type: contextType }),
            });
            if (!res.ok) throw new Error("Analysis failed");
            const data = await res.json();
            setAnalysisResult(data);
        } catch (error) {
            addNotification({ type: 'error', title: 'Analysis Failed', message: 'Could not generate preview.' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async () => {
        if (!content.trim()) {
            addNotification({ type: 'warning', title: 'Content Required', message: 'Please paste the information you want to add.' });
            return;
        }

        setIsIngesting(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/context`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: contextType,
                    content: content,
                    projectName: projectName
                }),
            });

            if (!res.ok) throw new Error('Failed to save context');
            
            addNotification({ type: 'success', title: 'Context Ingested', message: 'This knowledge is now available to the AI.' });
            setContent('');
            setAnalysisResult(null);
            // Switch to test tab to verify immediately
            setTestQuery('Check recent addition...');
            setActiveTab('test'); 
            
        } catch (error) {
            addNotification({ type: 'error', title: 'Ingestion Failed', message: (error as Error).message });
            log('Error saving project context', { error, projectId }, 'error');
        } finally {
            setIsIngesting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if(!confirm("Are you sure? This will remove the context from the archive.")) return;
        
        try {
            const res = await fetch(`/api/projects/${projectId}/context?docId=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setStoredItems(prev => prev.filter(item => item._id !== id));
                addNotification({ type: 'success', title: 'Deleted' });
            }
        } catch (error) {
             addNotification({ type: 'error', title: 'Delete Failed' });
        }
    };

    const handleTestRecall = async () => {
        if (!testQuery.trim()) return;
        setIsTesting(true);
        setHasTested(false);
        try {
            const res = await fetch(`/api/projects/${projectId}/context/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: testQuery }),
            });
            if (res.ok) {
                const data = await res.json();
                setTestResults(data.matches || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsTesting(false);
            setHasTested(true);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[150] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg w-full max-w-2xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-lg flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <CodeIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Knowledge Base: {projectName}</h2>
                            <p className="text-xs text-gray-400">Manage technical context for this project.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"><XIcon className="w-5 h-5" /></button>
                </header>

                <div className="flex border-b border-gray-700 bg-gray-800">
                    <button 
                        onClick={() => setActiveTab('inject')} 
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'inject' ? 'bg-gray-800 text-indigo-400 border-b-2 border-indigo-500' : 'bg-gray-900/30 text-gray-400 hover:text-gray-200'}`}
                    >
                        Inject New Context
                    </button>
                    <button 
                        onClick={() => setActiveTab('view')} 
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'view' ? 'bg-gray-800 text-indigo-400 border-b-2 border-indigo-500' : 'bg-gray-900/30 text-gray-400 hover:text-gray-200'}`}
                    >
                        View Archive
                    </button>
                    <button 
                        onClick={() => setActiveTab('test')} 
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'test' ? 'bg-gray-800 text-indigo-400 border-b-2 border-indigo-500' : 'bg-gray-900/30 text-gray-400 hover:text-gray-200'}`}
                    >
                        Test Recall (Vectors)
                    </button>
                </div>

                {activeTab === 'inject' && (
                    <>
                        <div className="flex p-3 gap-2 border-b border-gray-700 bg-gray-800 flex-shrink-0">
                             <button onClick={() => setContextType('business')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${contextType === 'business' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>Business Logic</button>
                             <button onClick={() => setContextType('schema')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${contextType === 'schema' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>DB Schema</button>
                             <button onClick={() => setContextType('code')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${contextType === 'code' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>Code Snippets</button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-900/30 flex flex-col">
                            <div className="p-4 flex-1 flex flex-col">
                                <textarea 
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    placeholder={`Paste your ${contextType} details here...`}
                                    className="flex-1 w-full bg-gray-950 border border-gray-700 rounded-lg p-4 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none custom-scrollbar min-h-[200px]"
                                />
                                
                                <AnimatePresence>
                                    {analysisResult && (
                                        <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="mt-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3">
                                            <h4 className="text-xs font-bold text-indigo-300 uppercase mb-1 flex items-center gap-2"><SparklesIcon className="w-3 h-3"/> AI Understanding Preview</h4>
                                            <p className="text-sm text-gray-300 mb-2">{analysisResult.summary}</p>
                                            <ul className="text-xs text-gray-400 list-disc list-inside">
                                                {analysisResult.keyPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                                            </ul>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <footer className="flex justify-between items-center p-4 border-t border-gray-700 bg-gray-800 rounded-b-lg flex-shrink-0">
                             <button 
                                onClick={handleAnalyze} 
                                disabled={isAnalyzing || !content.trim()} 
                                className="px-4 py-2 text-sm bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 rounded-md font-semibold disabled:opacity-50 flex items-center gap-2"
                             >
                                {isAnalyzing ? <RefreshIcon className="w-4 h-4 animate-spin"/> : <EyeIcon className="w-4 h-4"/>}
                                {isAnalyzing ? 'Analyzing...' : 'Preview Understanding'}
                            </button>

                             <button onClick={handleSubmit} disabled={isIngesting || !content.trim()} className="px-6 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded-md font-bold disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-green-900/20">
                                {isIngesting ? 'Ingesting...' : <><CheckIcon className="w-4 h-4"/> Save to Memory</>}
                            </button>
                        </footer>
                    </>
                )}

                {activeTab === 'view' && (
                    <main className="flex-1 p-4 overflow-y-auto bg-gray-900/30 custom-scrollbar">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-400">Stored Knowledge Blocks (Archive)</h3>
                            <button onClick={fetchStoredContext} className="p-1.5 bg-gray-700 rounded-md hover:bg-gray-600"><RefreshIcon className={`w-4 h-4 ${isLoadingItems ? 'animate-spin' : ''}`} /></button>
                        </div>
                        
                        {isLoadingItems ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                                <p>Loading context...</p>
                            </div>
                        ) : storedItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                                <CodeIcon className="w-8 h-8 mb-2 opacity-50" />
                                <p>No context found for this project.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {storedItems.map((item) => (
                                    <div key={item._id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 group relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wide">
                                                    {item.type.replace('project_', '')}
                                                </span>
                                                <span className="text-[10px] text-gray-500 ml-2 font-mono">
                                                    {new Date(item.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <button onClick={() => handleDelete(item._id)} className="text-gray-600 hover:text-red-400 p-1">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="bg-gray-950 p-3 rounded border border-gray-800 overflow-x-auto">
                                            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                                {item.content}
                                            </pre>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                )}
                
                {activeTab === 'test' && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="p-6 bg-gray-900/30 border-b border-gray-700 flex-shrink-0">
                            <p className="text-sm text-gray-400 mb-3">
                                Test if the <strong>Vectors</strong> (AI Memory) are working correctly. Ask a question about the project or type a keyword.
                            </p>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={testQuery}
                                    onChange={e => setTestQuery(e.target.value)}
                                    placeholder="e.g., What are the business rules?"
                                    className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    onKeyDown={e => e.key === 'Enter' && handleTestRecall()}
                                />
                                <button 
                                    onClick={handleTestRecall}
                                    disabled={isTesting || !testQuery.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    <BeakerIcon className="w-4 h-4" />
                                    {isTesting ? 'Checking...' : 'Test'}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/20">
                            {hasTested && testResults.length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    <p>No matches found in Vector Memory for this query.</p>
                                </div>
                            )}
                            {testResults.map((match, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-gray-800 p-4 rounded-lg border border-gray-700"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Match #{i+1}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${match.score > 0.8 ? 'bg-green-500' : match.score > 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                    style={{ width: `${match.score * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-gray-300">{(match.score * 100).toFixed(1)}% Match</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-200 whitespace-pre-wrap font-mono bg-black/30 p-3 rounded-md border border-white/5">
                                        {match.text}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

            </motion.div>
        </motion.div>
    );
};

export default ProjectContextModal;
