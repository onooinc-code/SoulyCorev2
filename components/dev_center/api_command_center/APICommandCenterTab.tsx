"use client";

import React, { useState, useEffect, useCallback } from 'react';
import EndpointNavigatorPanel from './EndpointNavigatorPanel';
import RequestPanel from './RequestPanel';
import ResponsePanel from './ResponsePanel';
import type { ApiEndpoint } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { useAppContext } from '@/components/providers/AppProvider';
import { RefreshIcon } from '@/components/Icons';

const APICommandCenterTab = () => {
    const { log } = useLog();
    const { setStatus, clearError } = useAppContext();
    const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
    const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
    const [response, setResponse] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isBatchLoading, setIsBatchLoading] = useState(false);
    const [lastRequest, setLastRequest] = useState<{ params: any; body: any } | null>(null);

    const fetchEndpoints = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/api-endpoints');
            if (!res.ok) throw new Error('Failed to fetch endpoints');
            const data = await res.json();
            setEndpoints(data);
        } catch (error) {
            log('Failed to fetch API endpoints', { error: (error as Error).message }, 'error');
            setStatus({ error: 'Could not load API endpoints.' });
        } finally {
            setIsLoading(false);
        }
    }, [log, setStatus]);

    useEffect(() => {
        fetchEndpoints();
    }, [fetchEndpoints]);

    const handleSendRequest = async (params: Record<string, any>, body: Record<string, any>) => {
        if (!selectedEndpoint) return;
        setIsLoading(true);
        setResponse(null);
        setLastRequest({ params, body });
        clearError();
        log('Sending API test request', { path: selectedEndpoint.path });

        try {
            const res = await fetch('/api/api-endpoints/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: selectedEndpoint, params, body }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Test request failed');
            setResponse(data);
            // Refresh endpoints to show new status
            await fetchEndpoints();
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('API test request failed', { path: selectedEndpoint.path, error: errorMessage }, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleTestAll = async () => {
        setIsBatchLoading(true);
        clearError();
        log('Starting batch API test run...');
        setStatus({ currentAction: "Running all API tests..." });
        try {
            const res = await fetch('/api/api-endpoints/test-all', { method: 'POST' });
            const data = await res.json();
             if (!res.ok) throw new Error(data.error || 'Batch test failed');
            alert(data.message);
            log('Batch API test run completed', data);
            await fetchEndpoints();
        } catch(error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Batch API test run failed', { error: errorMessage }, 'error');
        } finally {
            setIsBatchLoading(false);
            setStatus({ currentAction: "" });
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <div>
                    <h3 className="text-2xl font-bold">API Command Center</h3>
                    <p className="text-sm text-gray-400">Manage, test, and monitor all backend API endpoints.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchEndpoints} disabled={isLoading || isBatchLoading} className="p-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50" title="Refresh endpoint list"><RefreshIcon className="w-5 h-5"/></button>
                    <button 
                        onClick={handleTestAll}
                        disabled={isBatchLoading || isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
                    >
                        {isBatchLoading ? 'Testing...' : 'Test All API Endpoints'}
                    </button>
                </div>
            </div>
            <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
                <div className="col-span-3 bg-gray-800/50 rounded-lg overflow-hidden">
                    <EndpointNavigatorPanel 
                        endpoints={endpoints} 
                        onSelectEndpoint={(endpoint) => {
                            setSelectedEndpoint(endpoint);
                            setResponse(null);
                            setLastRequest(null);
                        }}
                        selectedEndpointId={selectedEndpoint?.id || null}
                    />
                </div>
                <div className="col-span-5 bg-gray-800/50 rounded-lg overflow-hidden">
                    <RequestPanel 
                        endpoint={selectedEndpoint} 
                        onSendRequest={handleSendRequest}
                        isLoading={isLoading}
                    />
                </div>
                <div className="col-span-4 bg-gray-800/50 rounded-lg overflow-hidden">
                    <ResponsePanel 
                        response={response} 
                        endpoint={selectedEndpoint}
                        requestPayload={lastRequest}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default APICommandCenterTab;