"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const initialDocs = `
# SoulyCore Documentation

## Overview
SoulyCore is a full-stack Next.js application designed as an intelligent AI assistant with a persistent, cloud-native memory system.

## Features
- **Cloud-Native Memory:** Utilizes Vercel Postgres for structured memory (entities, contacts, conversations) and Pinecone for semantic memory (knowledge vectors).
- **Server-Side AI:** All interactions with the Gemini API are handled securely through Next.js API routes.
- **Dynamic Frontend:** Built with React, Next.js App Router, and Tailwind CSS for a responsive and modern UI.
`;

const mockGitDiff = `
diff --git a/components/ChatInput.tsx b/components/ChatInput.tsx
index 123..456 100644
--- a/components/ChatInput.tsx
+++ b/components/ChatInput.tsx
@@ -1,5 +1,6 @@
 import React from 'react';
 import { SendIcon } from './Icons';
+import { PaperclipIcon } from './Icons';

 // ... rest of diff
`;

// FIX: Removed React.FC to allow for proper type inference with framer-motion props.
const Documentation = () => {
    const [docs, setDocs] = useState(initialDocs);
    const [isLoading, setIsLoading] = useState(false);
    const [updates, setUpdates] = useState('');

    const handleUpdateDocs = async () => {
        // This function needs to be refactored to call a new API endpoint.
        // For now, it's disabled.
    };

    return (
        <div className="p-4 grid grid-cols-2 gap-8 h-full">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">Project Documentation</h3>
                    <button 
                        onClick={handleUpdateDocs} 
                        disabled={true} 
                        className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="This feature is disabled pending refactor for server-side architecture."
                    >
                        {isLoading ? "Updating..." : "Update Docs from Git"}
                    </button>
                </div>
                <div className="prose-custom bg-gray-900/50 p-4 rounded-lg h-full overflow-y-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{docs}</ReactMarkdown>
                </div>
            </div>
            <div>
                <h3 className="text-2xl font-bold mb-4">Recent Changes (Mock)</h3>
                <div className="prose-custom bg-gray-900/50 p-4 rounded-lg h-full overflow-y-auto">
                    <pre><code>{mockGitDiff}</code></pre>
                    {updates && <ReactMarkdown remarkPlugins={[remarkGfm]}>{updates}</ReactMarkdown>}
                </div>
            </div>
        </div>
    );
};

export default Documentation;