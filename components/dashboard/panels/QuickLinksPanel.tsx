
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardPanel from '../DashboardPanel';
import { useLog } from '../../providers/LogProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, XIcon } from '../../Icons';

interface QuickLink {
    id: string;
    title: string;
    url: string;
}

const QuickLinksPanel = () => {
    const [links, setLinks] = useState<QuickLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { log } = useLog();

    const fetchLinks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/dashboard/quick-links');
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Failed to fetch links' }));
                throw new Error(errorData.error || 'Failed to fetch links');
            }
            const data = await res.json();
            setLinks(data.links || []);
        } catch (err) {
            log('Error fetching quick links', { error: err }, 'error');
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const saveLinks = async (updatedLinks: QuickLink[]) => {
        try {
            await fetch('/api/dashboard/quick-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ links: updatedLinks }),
            });
        } catch (error) {
            log('Error saving quick links', { error }, 'error');
        }
    };

    const handleAddLink = () => {
        if (!newTitle.trim() || !newUrl.trim()) return;
        let urlToAdd = newUrl;
        if (!/^https?:\/\//i.test(urlToAdd)) {
            urlToAdd = 'https://' + urlToAdd;
        }
        const newLink: QuickLink = { id: crypto.randomUUID(), title: newTitle, url: urlToAdd };
        const updatedLinks = [...links, newLink];
        setLinks(updatedLinks);
        saveLinks(updatedLinks);
        setNewTitle('');
        setNewUrl('');
        setIsAdding(false);
    };

    const handleRemoveLink = (id: string) => {
        const updatedLinks = links.filter(link => link.id !== id);
        setLinks(updatedLinks);
        saveLinks(updatedLinks);
    };

    const renderAddForm = () => (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 bg-gray-900/50 p-3 rounded-md overflow-hidden"
        >
            <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Link Title"
                className="w-full bg-gray-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="URL (e.g., google.com)"
                className="w-full bg-gray-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
                <button onClick={handleAddLink} className="flex-1 px-2 py-1 bg-green-600 text-xs rounded-md">Add</button>
                <button onClick={() => setIsAdding(false)} className="flex-1 px-2 py-1 bg-gray-600 text-xs rounded-md">Cancel</button>
            </div>
        </motion.div>
    );

    return (
        <DashboardPanel title="Quick Links">
            <div className="flex flex-col h-full">
                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                    {isLoading ? (
                        <p className="text-xs text-center text-gray-500">Loading links...</p>
                    ) : error ? (
                        <div className="text-center text-red-400 p-4 bg-red-900/20 rounded-md">
                            <p className="font-semibold">Error</p>
                            <p className="text-xs mt-1">{error}</p>
                        </div>
                    ) : (
                        <>
                            <AnimatePresence>
                                {links.map(link => (
                                    <motion.div
                                        key={link.id}
                                        layout
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="group flex items-center gap-3 p-2 bg-gray-800/50 rounded-md"
                                    >
                                        <img
                                            src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`}
                                            alt=""
                                            className="w-5 h-5 flex-shrink-0"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-300 hover:text-indigo-300 truncate flex-1">
                                            {link.title}
                                        </a>
                                        <button onClick={() => handleRemoveLink(link.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400">
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {!isAdding && links.length === 0 && <p className="text-xs text-center text-gray-500 py-4">No links added yet.</p>}
                        </>
                    )}
                </div>
                <div className="mt-2">
                    <AnimatePresence>
                        {isAdding && renderAddForm()}
                    </AnimatePresence>
                    {!isAdding && (
                        <button onClick={() => setIsAdding(true)} className="w-full flex items-center justify-center gap-2 py-2 text-xs bg-indigo-600/30 hover:bg-indigo-600/50 rounded-md font-semibold transition-colors">
                            <PlusIcon className="w-4 h-4"/> Add New Link
                        </button>
                    )}
                </div>
            </div>
        </DashboardPanel>
    );
};

export default QuickLinksPanel;
