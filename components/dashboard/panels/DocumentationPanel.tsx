"use client";

// components/dashboard/panels/DocumentationPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Documentation } from '@/lib/types';
import { useLog } from '../../providers/LogProvider';
import DocumentationViewerModal from '../../DocumentationViewerModal';
import { DocumentTextIcon } from '../../Icons';
import DashboardPanel from '../DashboardPanel';

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

    const renderContent = () => {
        if (isLoading) {
            return <p className="text-sm text-gray-400 text-center">Loading documentation index...</p>;
        }

        if (docs.length === 0) {
            return <p className="text-sm text-gray-400 text-center">No documentation found.</p>;
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {docs.map(doc => ( 
                    <button 
                        key={doc.id}
                        onClick={() => handleSelectDoc(doc.doc_key)}
                        className="w-full text-left p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition-colors flex flex-col justify-between h-36 border border-transparent hover:border-indigo-500"
                    >
                        <div>
                            <DocumentTextIcon className="w-8 h-8 text-indigo-400 mb-2" />
                            <h4 className="text-sm font-semibold text-gray-200">{doc.title}</h4>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Updated: {new Date(doc.lastUpdatedAt).toLocaleDateString()}
                        </p>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <>
            <DashboardPanel title="Smart Documentation">
                {renderContent()}
            </DashboardPanel>
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
