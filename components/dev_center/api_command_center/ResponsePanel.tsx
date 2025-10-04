
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

    const TabButton = ({ tab, label }: { tab: 'body' | 'headers' | 'results',