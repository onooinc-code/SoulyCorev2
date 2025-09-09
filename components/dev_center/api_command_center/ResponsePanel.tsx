"use client";

import React, { useState, useEffect } from 'react';
import type { EndpointTestLog, ApiEndpoint } from '@/lib/types';
import JsonEditor from './JsonEditor';
import { CopyIcon, CheckIcon } from '@/components/Icons';

interface ResponsePanelProps {
    response: any | null;
    endpoint: ApiEndpoint | null;
    requestPayload: { params: any; body: any } | null;
    isLoading: boolean;
}

const ResponsePanel = ({ response, endpoint, requestPayload, isLoading }: ResponsePanelProps) => {
    const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'results'>('body');
    const [testLogs, setTestLogs] = useState<EndpointTestLog[]>([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (activeTab === 'results' && endpoint) {
            const fetchLogs = async () => {
                try {
                    const res = await fetch(`/api/api-endpoints/test-logs/${endpoint.id}`);
                    if (!res.ok) throw new Error("Failed to fetch test logs.");
                    const data = await res.json();
                    setTestLogs(data);
                } catch (e) {
                    console.error("Error fetching logs:", e);
                }
            };
            fetchLogs();
        }
    }, [activeTab, endpoint]);
    
    // Reset to body tab when a new response comes in
    useEffect(() => {
        if (response) {
            setActiveTab('body');
        }
    }, [response]);

    const handleCopyReport = () => {
        if (!response || !endpoint || !requestPayload) return;

        const report = `
# API Test Report
**Timestamp:** ${new Date().toISOString()}

---

## Endpoint Details
- **Method:** ${endpoint.method}
- **Path:** ${endpoint.path}
- **Description:** ${endpoint.description || 'N/A'}

---

## Test Result
- **Status:** ${response.status === endpoint.expected_status_code ? 'Passed' : 'Failed'}
- **HTTP Code:** ${response.status} ${response.statusText}

---

## Request Params
\`\`\`json
${JSON.stringify(requestPayload.params, null, 2)}
\`\`\`

---

## Request Body
\`\`\`json
${JSON.stringify(requestPayload.body, null, 2)}
\`\`\`

---

## Response Headers
\`\`\`json
${JSON.stringify(response.headers, null, 2)}
\`\`\`

---

## Response Body
\`\`\`json
${JSON.stringify(response.body, null, 2)}
\`\`\`
        `;
        navigator.clipboard.writeText(report.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const TabButton = ({ tab, label }: { tab: 'body' | 'headers' | 'results', label: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
        >
            {label}
        </button>
    );

    const renderContent = () => {
        if (isLoading) {
            return <div className="p-4 text-gray-400">Request in progress...</div>;
        }
        if (!response) {
            return <div className="p-4 text-gray-500">Response will be displayed here.</div>;
        }

        switch (activeTab) {
            case 'body':
                return <JsonEditor value={JSON.stringify(response.body, null, 2)} readOnly />;
            case 'headers':
                return <JsonEditor value={JSON.stringify(response.headers, null, 2)} readOnly />;
            case 'results':
                return (
                    <div className="p-2 space-y-2">
                        {testLogs.map(log => (
                             <div key={log.id} className={`p-2 rounded-md bg-gray-900 border-l-4 ${log.status === 'Passed' ? 'border-green-500' : 'border-red-500'}`}>
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span>{log.status} - {log.status_code}</span>
                                    <span className="text-gray-400">{log.duration_ms}ms</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                );
        }
    };
    
    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'text-green-400';
        if (status >= 400 && status < 500) return 'text-yellow-400';
        if (status >= 500) return 'text-red-400';
        return 'text-gray-400';
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-2 flex justify-between items-center border-b border-gray-700">
                <div className="flex gap-2">
                    <TabButton tab="body" label="Response Body" />
                    <TabButton tab="headers" label="Headers" />
                    <TabButton tab="results" label="Test Results" />
                </div>
                 {response && (
                    <div className="flex items-center gap-3">
                         <button 
                            onClick={handleCopyReport}
                            disabled={!response}
                            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white disabled:opacity-50"
                            title="Copy full test report to clipboard"
                        >
                            {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy Report'}
                        </button>
                        <div className="text-sm font-semibold">
                            Status: <span className={getStatusColor(response.status)}>{response.status} {response.statusText}</span>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex-1 p-2 overflow-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default ResponsePanel;