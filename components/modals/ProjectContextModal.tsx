
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XIcon, CodeIcon, CheckIcon, TrashIcon, RefreshIcon } from '@/components/Icons';
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

const ProjectContextModal = ({ projectId, projectName, onClose }: ProjectContextModalProps) => {
    const [activeTab, setActiveTab] = useState<'inject' | 'view'>('inject');
    
    // Inject State
    const [contextType, setContextType] = useState<'business' | 'schema' | 'code'>('business');
    const [content, setContent] = useState('');
    const [isIngesting, setIsIngesting] = useState(false);

    // View State
    const [storedItems, setStoredItems] = useState<StoredContextItem[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    
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

    // Fetch items when switching to View tab
    useEffect(() => {
        if (activeTab === 'view') {
            fetchStoredContext();
        }
    }, [activeTab]);

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
            // Switch to view to see it
            setActiveTab('view');
            
        } catch (error) {
            addNotification({ type: 'error', title: 'Ingestion Failed', message: (error as Error).message });
            log('Error saving project context', { error, projectId }, 'error');
        } finally {
            setIsIngesting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if(!confirm("Are you sure? This will remove the context from the archive (Note: Vectors in Pinecone are not deleted automatically in this version).")) return;
        
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

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[150] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
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

                <div className="flex border-b border-gray-700">
                    <button 
                        onClick={() => setActiveTab('inject')} 
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'inject' ? 'bg-gray-800 text-indigo-400 border-b-2 border-indigo-500' : 'bg-gray-900/50 text-gray-400 hover:text-gray-200'}`}
                    >
                        Inject New Context
                    </button>
                    <button 
                        onClick={() => setActiveTab('view')} 
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'view' ? 'bg-gray-800 text-indigo-400 border-b-2 border-indigo-500' : 'bg-gray-900/50 text-gray-400 hover:text-gray-200'}`}
                    >
                        View Stored Context
                    </button>
                </div>

                {activeTab === 'inject' && (
                    <>
                        <div className="flex p-4 gap-2 border-b border-gray-700 bg-gray-800 flex-shrink-0">
                             <button onClick={() => setContextType('business')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${contextType === 'business' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>Business Logic</button>
                             <button onClick={() => setContextType('schema')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${contextType === 'schema' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>DB Schema</button>
                             <button onClick={() => setContextType('code')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${contextType === 'code' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>Code Snippets</button>
                        </div>

                        <main className="flex-1 p-4 flex flex-col gap-2 bg-gray-900/30 overflow-hidden">
                            <p className="text-xs text-gray-400 bg-indigo-900/20 p-2 rounded border-l-2 border-indigo-500">
                                {contextType === 'business' && "Describe functionality, user flows, and business rules. The AI will use this to understand 'why' things work."}
                                {contextType === 'schema' && "Paste SQL dumps, Migration files, or ERD descriptions. The AI will use this for query generation."}
                                {contextType === 'code' && "Paste key files (Models, Controllers). The AI will use this as a style guide and reference."}
                            </p>
                            <textarea 
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder={`Paste your ${contextType} details here...`}
                                className="flex-1 w-full bg-gray-950 border border-gray-700 rounded-lg p-4 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none custom-scrollbar"
                            />
                        </main>
                        <footer className="flex justify-end gap-3 p-4 border-t border-gray-700 bg-gray-800 rounded-b-lg flex-shrink-0">
                             <button onClick={handleSubmit} disabled={isIngesting || !content.trim()} className="px-6 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded-md font-bold disabled:opacity-50 flex items-center gap-2">
                                {isIngesting ? 'Ingesting...' : <><CheckIcon className="w-4 h-4"/> Save to Memory</>}
                            </button>
                        </footer>
                    </>
                )}

                {activeTab === 'view' && (
                    <main className="flex-1 p-4 overflow-y-auto bg-gray-900/30 custom-scrollbar">
                        {isLoadingItems ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <RefreshIcon className="w-6 h-6 animate-spin mb-2" />
                                <p>Loading context...</p>
                            </div>
                        ) : storedItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <CodeIcon className="w-8 h-8 mb-2 opacity-50" />
                                <p>No context found for this project.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {storedItems.map((item) => (
                                    <div key={item._id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="text-xs font-bold text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded uppercase tracking-wide">
                                                    {item.type.replace('project_', '')}
                                                </span>
                                                <span className="text-xs text-gray-500 ml-2">
                                                    {new Date(item.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <button onClick={() => handleDelete(item._id)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <pre className="text-xs text-gray-300 font-mono bg-gray-950 p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-32">
                                            {item.content}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                )}

            </motion.div>
        </motion.div>
    );
};

export default ProjectContextModal;
