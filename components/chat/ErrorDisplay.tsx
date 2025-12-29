
"use client";

import React, { useState } from 'react';
import type { IStatus } from '@/lib/types';
import { XIcon, WarningIcon, CodeIcon, WrenchScrewdriverIcon } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface ErrorDisplayProps {
    status: IStatus;
    isDbError: boolean;
    clearError: () => void;
}

const ErrorDisplay = ({ status, isDbError, clearError }: ErrorDisplayProps) => {
    const [showStack, setShowStack] = useState(false);

    if (!status.error) return null;

    const isQuotaError = status.error.includes('429') || status.error.includes('quota') || status.error.includes('RESOURCE_EXHAUSTED');
    const isAuthError = status.error.includes('Authentication Error') || status.error.includes('API Key');
    const isEngineError = status.error.includes('Cognitive Engine Failure');
    
    // Parse error details if available in the error string (sometimes passed as JSON string from API)
    let details = "";
    
    try {
        if (typeof status.error === 'string' && status.error.startsWith('{')) {
            const parsed = JSON.parse(status.error);
            if (parsed.details) details = typeof parsed.details === 'string' ? parsed.details : parsed.details.message;
        } 
    } catch (e) {}

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 20 }}
                className="mx-4 mb-2 z-50 relative"
            >
                <div className={`rounded-lg p-4 border shadow-2xl flex flex-col gap-2 ${isQuotaError ? 'bg-orange-900/95 border-orange-500 text-orange-100' : 'bg-red-900/95 border-red-500 text-red-100'}`}>
                    <div className="flex items-start gap-3">
                        <WarningIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-base">
                                {isQuotaError ? 'AI Rate Limit Reached' : isAuthError ? 'Authentication Failed' : isEngineError ? 'System Error' : 'Error'}
                            </h4>
                            <p className="text-sm mt-1 opacity-90 break-words font-mono">
                                {status.error}
                            </p>
                            {details && (
                                <div className="mt-2 p-2 bg-black/30 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                    <strong>Details:</strong> {details}
                                </div>
                            )}
                            {isAuthError && (
                                <a 
                                    href="https://vercel.com/dashboard" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="mt-3 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                                >
                                    <WrenchScrewdriverIcon className="w-3 h-3" />
                                    Configure Vercel Environment
                                </a>
                            )}
                            {isDbError && (
                                <div className="mt-2 text-xs bg-black/20 p-2 rounded">
                                    <strong>Tip:</strong> Database connection issue detected. Check Vercel Storage settings or run `npm run db:create`.
                                </div>
                            )}
                             {isEngineError && (
                                <button 
                                    onClick={() => setShowStack(!showStack)}
                                    className="mt-2 text-xs underline flex items-center gap-1 hover:text-white"
                                >
                                    <CodeIcon className="w-3 h-3" />
                                    {showStack ? "Hide Trace" : "Show Trace"}
                                </button>
                            )}
                        </div>
                        <button onClick={clearError} className="p-1.5 hover:bg-white/10 rounded-full transition-colors self-start">
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                     <AnimatePresence>
                        {showStack && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: 'auto', opacity: 1 }} 
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-black/50 p-2 rounded text-[10px] font-mono whitespace-pre-wrap overflow-x-auto text-red-200 mt-2 border border-red-500/30">
                                    Check the console for the full stack trace.
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ErrorDisplay;
