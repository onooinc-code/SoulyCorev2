"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLog } from '../providers/LogProvider';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '../ui/EmptyState';
import { ClipboardPasteIcon } from '../Icons';

const ReportsHub = () => {
    const [files, setFiles] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { log } = useLog();

    const fetchFiles = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/reports');
            if (!res.ok) throw new Error('Failed to fetch report list');
            const data = await res.json();
            setFiles(data);
            if (data.length > 0 && !selectedFile) {
                setSelectedFile(data[0]);
            }
        } catch (error) {
            log('Error fetching report files', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log, selectedFile]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <header className="flex-shrink-0 pb-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Templates & Reports Viewer</h2>
            </header>
            <main className="flex-1 grid grid-cols-12 gap-6 mt-6 overflow-hidden">
                <aside className="col-span-3 flex flex-col gap-2">
                    <h3 className="text-lg font-semibold mb-2">Available Reports</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {isLoading ? (
                            <p className="text-gray-400">Loading...</p>
                        ) : files.length > 0 ? (
                            files.map(file => (
                                <button
                                    key={file}
                                    onClick={() => setSelectedFile(file)}
                                    className={`w-full text-left p-3 rounded-md text-sm font-medium transition-colors ${selectedFile === file ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
                                >
                                    {file}
                                </button>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm">No reports found in the /reports directory.</p>
                        )}
                    </div>
                </aside>
                <section className="col-span-9 bg-gray-800 rounded-lg overflow-hidden flex flex-col">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedFile}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-full h-full"
                        >
                            {selectedFile ? (
                                <iframe
                                    src={`/api/reports/${selectedFile}`}
                                    title={selectedFile}
                                    className="w-full h-full border-0"
                                    sandbox="allow-scripts allow-same-origin" // Allow scripts for mermaid.js
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center p-8">
                                    <EmptyState
                                        icon={ClipboardPasteIcon}
                                        title="No Report Selected"
                                        description="Select a report from the list to view its content."
                                    />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </section>
            </main>
        </div>
    );
};

export default ReportsHub;
