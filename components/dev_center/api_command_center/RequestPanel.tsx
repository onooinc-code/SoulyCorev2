"use client";

import React, { useState, useEffect } from 'react';
import type { ApiEndpoint } from '@/lib/types';
import JsonEditor from './JsonEditor';
import { RocketLaunchIcon } from '@/components/Icons';

interface RequestPanelProps {
    endpoint: ApiEndpoint | null;
    onSendRequest: (params: Record<string, any>, body: Record<string, any>) => void;
    isLoading: boolean;
}

const RequestPanel = ({ endpoint, onSendRequest, isLoading }: RequestPanelProps) => {
    const [activeTab, setActiveTab] = useState<'params' | 'body'>('body');
    const [params, setParams] = useState<string>('{}');
    const [body, setBody] = useState<string>('{}');
    
    useEffect(() => {
        if (endpoint) {
            // FIX: Corrected property name from default_params_json to defaultParamsJson.
            setParams(JSON.stringify(endpoint.defaultParamsJson || {}, null, 2));
            // FIX: Corrected property name from default_body_json to defaultBodyJson.
            setBody(JSON.stringify(endpoint.defaultBodyJson || {}, null, 2));
            setActiveTab('body'); // Default to body tab on new selection
        } else {
            setParams('{}');
            setBody('{}');
        }
    }, [endpoint]);

    const handleSend = () => {
        try {
            const parsedParams = JSON.parse(params);
            const parsedBody = JSON.parse(body);
            onSendRequest(parsedParams, parsedBody);
        } catch (e) {
            alert('Invalid JSON in Params or Body. Please correct it before sending.');
        }
    };
    
    const TabButton = ({ tab, label }: { tab: 'params' | 'body', label: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
        >
            {label}
        </button>
    );

    if (!endpoint) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select an endpoint from the left to begin.</p>
            </div>
        );
    }
    
    const methodColorMap: Record<string, string> = {
        'GET': 'text-green-400',
        'POST': 'text-blue-400',
        'PUT': 'text-yellow-400',
        'DELETE': 'text-red-400',
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-4 border-b border-gray-700">
                <div className="flex items-center gap-4 mb-2">
                    <span className={`text-lg font-bold ${methodColorMap[endpoint.method] || 'text-gray-400'}`}>{endpoint.method}</span>
                    <code className="text-lg text-gray-200 bg-gray-700 px-2 py-1 rounded-md">{endpoint.path}</code>
                </div>
                <p className="text-sm text-gray-400">{endpoint.description || 'No description provided.'}</p>
            </div>
            
            <div className="flex-shrink-0 p-2 flex justify-between items-center border-b border-gray-700">
                <div className="flex gap-2">
                    <TabButton tab="params" label="Params" />
                    <TabButton tab="body" label="Body" />
                </div>
                 <button 
                    onClick={handleSend}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-wait"
                 >
                    <RocketLaunchIcon className="w-5 h-5" />
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </div>
            
            <div className="flex-1 p-2 overflow-auto">
                {activeTab === 'params' && <JsonEditor value={params} onChange={setParams} />}
                {activeTab === 'body' && <JsonEditor value={body} onChange={setBody} />}
            </div>
        </div>
    );
};

export default RequestPanel;