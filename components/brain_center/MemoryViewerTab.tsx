"use client";

import React, { useState } from 'react';
import { useLog } from '../providers/LogProvider';
import { useAppContext } from '@/lib/hooks/useAppContext';

type ModuleType = 'structured' | 'episodic' | 'semantic' | 'none';

const MemoryViewerTab = () => {
    const { log } = useLog();
    const { setStatus, clearError } = useAppContext();
    const [selectedModule, setSelectedModule] = useState<ModuleType>('none');
    const [queryParams, setQueryParams] = useState<Record<string, string>>({});
    const [results, setResults] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleQuery = async () => {
        if (selectedModule === 'none') return;
        
        setIsLoading(true);
        setResults(null);
        clearError();
        log(`Querying memory viewer for module: ${selectedModule}`, { queryParams });
        
        const url = new URL(`/api/memory-viewer/${selectedModule}`, window.location.origin);
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value) {
                url.searchParams.append(key, String(value));
            }
        });

        try {
            const res = await fetch(url.toString());
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch from memory viewer.');
            }
            setResults(data);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Memory viewer query failed.', { module: selectedModule, error: errorMessage }, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const renderQueryForm = () => {
        switch (selectedModule) {
            case 'structured':
                return (
                    <div className="flex gap-4">
                        <select
                            value={queryParams.type || 'entity'}
                            onChange={(e) => setQueryParams({ type: e.target.value })}
                            className="p-2 bg-gray-700 rounded-lg text-sm"
                        >
                            <option value="entity">Entity</option>
                            <option value="contact">Contact</option>
                        </select>
                    </div>
                );
            case 'episodic':
                return (
                    <input
                        type="text"
                        placeholder="Enter Conversation ID..."
                        value={queryParams.conversationId || ''}
                        onChange={(e) => setQueryParams({ conversationId: e.target.value })}
                        className="w-full md:w-1/2 p-2 bg-gray-700 rounded-lg text-sm"
                    />
                );
            case 'semantic':
                return (
                    <input
                        type="text"
                        placeholder="Enter semantic query text..."
                        value={queryParams.queryText || ''}
                        onChange={(e) => setQueryParams({ queryText: e.target.value })}
                        className="w-full md:w-1/2 p-2 bg-gray-700 rounded-lg text-sm"
                    />
                );
            default:
                return <p className="text-gray-500">Select a memory module to begin.</p>;
        }
    };
    
    const ModuleButton = ({ module, label }: { module: ModuleType, label: string }) => (
        <button
            onClick={() => {
                setSelectedModule(module);
                setQueryParams(module === 'structured' ? { type: 'entity' } : {}); // Reset params on module change
                setResults(null);
            }}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${selectedModule === module ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 text-gray-300 h-full flex flex-col gap-4">
            <div>
                <h3 className="text-2xl font-bold mb-2">Memory Module Viewer</h3>
                <p className="text-sm text-gray-400">Inspect the raw data stored within each of the AI's long-term memory modules.</p>
            </div>
            
            <div className="flex gap-2 items-center p-3 bg-gray-800 rounded-lg">
                <span className="text-sm font-semibold mr-2">Select Module:</span>
                <ModuleButton module="structured" label="Structured" />
                <ModuleButton module="episodic" label="Episodic" />
                <ModuleButton module="semantic" label="Semantic" />
            </div>

            <div className="flex gap-4 items-center p-3 bg-gray-800 rounded-lg">
                {renderQueryForm()}
                <button
                    onClick={handleQuery}
                    disabled={isLoading || selectedModule === 'none'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Querying...' : 'Query'}
                </button>
            </div>

            <div className="flex-1 bg-gray-950 rounded-lg p-4 overflow-auto">
                <h4 className="text-lg font-semibold mb-2 text-gray-400">Results</h4>
                {results ? (
                    <pre className="text-xs text-green-300"><code>{JSON.stringify(results, null, 2)}</code></pre>
                ) : (
                    <p className="text-gray-500">{isLoading ? 'Loading...' : 'No results to display. Run a query to see the data.'}</p>
                )}
            </div>
        </div>
    );
};

export default MemoryViewerTab;