
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon, CodeIcon, CheckIcon } from '@/components/Icons';
import { useLog } from '../providers/LogProvider';
import { useNotification } from '@/lib/hooks/use-notifications';

interface ProjectContextModalProps {
    projectId: string;
    projectName: string;
    onClose: () => void;
}

const ProjectContextModal = ({ projectId, projectName, onClose }: ProjectContextModalProps) => {
    const [contextType, setContextType] = useState<'business' | 'schema' | 'code'>('business');
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { log } = useLog();
    const { addNotification } = useNotification();

    const handleSubmit = async () => {
        if (!content.trim()) {
            addNotification({ type: 'warning', title: 'Content Required', message: 'Please paste the information you want to add.' });
            return;
        }

        setIsLoading(true);
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
            
        } catch (error) {
            addNotification({ type: 'error', title: 'Ingestion Failed', message: (error as Error).message });
            log('Error saving project context', { error, projectId }, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-[150] p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <CodeIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Inject Knowledge: {projectName}</h2>
                            <p className="text-xs text-gray-400">Add persistent technical context for this project.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"><XIcon className="w-5 h-5" /></button>
                </header>

                <div className="flex p-4 gap-2 border-b border-gray-700 bg-gray-800">
                     <button onClick={() => setContextType('business')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${contextType === 'business' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>Business Logic</button>
                     <button onClick={() => setContextType('schema')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${contextType === 'schema' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>DB Schema</button>
                     <button onClick={() => setContextType('code')} className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${contextType === 'code' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>Code Snippets</button>
                </div>

                <main className="flex-1 p-4 flex flex-col gap-2 bg-gray-900/30">
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

                <footer className="flex justify-end gap-3 p-4 border-t border-gray-700 bg-gray-800 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-600 rounded-md hover:bg-gray-500">Close</button>
                    <button onClick={handleSubmit} disabled={isLoading || !content.trim()} className="px-6 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded-md font-bold disabled:opacity-50 flex items-center gap-2">
                        {isLoading ? 'Ingesting...' : <><CheckIcon className="w-4 h-4"/> Save to Memory</>}
                    </button>
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default ProjectContextModal;
