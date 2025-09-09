
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Documentation } from '@/lib/types';
import { useLog } from '../providers/LogProvider';
import DocumentationViewerModal from '../DocumentationViewerModal';
import { DocumentTextIcon } from '../Icons';

const DocumentationPanel = () => {
    const [docs, setDocs] = useState<Documentation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDocKey, setSelectedDocKey] = useState<string | null>(null);
    const { log } = useLog();

    const fetchDocs = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/documentation');
            if (!res.ok) throw new Error("Failed to fetch documentation list.");
            const data = await res.json();
            setDocs(data);
        } catch (error) {
            log('Failed to fetch docs list', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    const handleSelectDoc = (docKey: string) => {
        setSelectedDocKey(docKey);
    };
    
    const handleCloseModal = () => {
        setSelectedDocKey(null);
    }

    if (isLoading) {
        return <p className="text-sm text-gray-400">Loading documentation...</p>;
    }

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {docs.slice(0, 8).map(doc => ( 
                    <button 
                        key={doc.id}
                        onClick={() => handleSelectDoc(doc.doc_key)}
                        className="w-full text-left p-4 bg-gray-900/50 rounded-md hover:bg-gray-900 transition-colors flex flex-col justify-between h-36"
                    >
                        <div>
                            <DocumentTextIcon className="w-6 h-6 text-indigo-400 mb-2" />
                            <h4 className="text-sm font-semibold text-gray-200">{doc.title}</h4>
                        </div>
                        <p className="text-xs text-gray-500">Last updated: {new Date(doc.lastUpdatedAt).toLocaleDateString()}</p>
                    </button>
                ))}
            </div>
            {selectedDocKey && (
                <DocumentationViewerModal 
                    docKey={selectedDocKey}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default DocumentationPanel;
