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

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-2 flex justify-between items-center border-b border-gray-700">
                <div className="flex gap-2">
                    <TabButton tab="body" label="Response Body" />
                    <TabButton tab="headers" label="Headers" />
                    <TabButton tab="results" label="Test History" />
                </div>
                {response && (
                    <button onClick={handleCopyReport} className="flex items-center gap-2 px-3 py-1 text-xs bg-gray-700 rounded-md hover:bg-gray-600" title="Copy full test report as Markdown">
                        {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Report'}
                    </button>
                )}
            </div>

            <div className="flex-1 p-2 overflow-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
                ) : !response && activeTab !== 'results' ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Send a request to see the response.</div>
                ) : activeTab === 'body' ? (
                    <>
                        <div className="text-xs p-2">Status: <span className={`font-bold ${response.status === endpoint?.expected_status_code ? 'text-green-400' : 'text-red-400'}`}>{response.status} {response.statusText}</span></div>
                        <JsonEditor value={JSON.stringify(response.body, null, 2)} readOnly />
                    </>
                ) : activeTab === 'headers' ? (
                    <JsonEditor value={JSON.stringify(response.headers, null, 2)} readOnly />
                ) : (
                    <div className="text-xs font-mono space-y-2">
                        {testLogs.map(log => (
                             <div key={log.id} className="p-2 bg-gray-900/50 rounded-md">
                                <div className="flex justify-between items-center">
                                    <span className={`font-bold ${log.status === 'Passed' ? 'text-green-400' : 'text-red-400'}`}>{log.status} - {log.status_code}</span>
                                    <span className="text-gray-500">{log.duration_ms}ms</span>
                                </div>
                                <span className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResponsePanel;