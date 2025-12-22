
"use client";

import React from 'react';
import type { IStatus } from '@/lib/types';
import { XIcon, WarningIcon } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface ErrorDisplayProps {
    status: IStatus;
    isDbError: boolean;
    clearError: () => void;
}

const ErrorDisplay = ({ status, isDbError, clearError }: ErrorDisplayProps) => {
    if (!status.error) return null;

    const isQuotaError = status.error.includes('429') || status.error.includes('quota') || status.error.includes('RESOURCE_EXHAUSTED');
    
    // Parse error details if available in the error string (sometimes passed as JSON string from API)
    let details = "";
    try {
        if (status.error.startsWith('{')) {
            const parsed = JSON.parse(status.error);
            if (parsed.details) details = parsed.details;
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
                <div className={`rounded-lg p-4 border shadow-2xl flex items-start gap-3 ${isQuotaError ? 'bg-orange-900/95 border-orange-500 text-orange-100' : 'bg-red-900/95 border-red-500 text-red-100'}`}>
                    <WarningIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base">
                            {isQuotaError ? 'AI Rate Limit Reached' : 'System Error'}
                        </h4>
                        <p className="text-sm mt-1 opacity-90 break-words font-mono">
                            {status.error}
                        </p>
                        {details && (
                            <div className="mt-2 p-2 bg-black/30 rounded text-xs font-mono overflow-x-auto">
                                <strong>Details:</strong> {details}
                            </div>
                        )}
                        {isDbError && (
                            <div className="mt-2 text-xs bg-black/20 p-2 rounded">
                                <strong>Tip:</strong> Database connection issue detected. Check Vercel Storage settings or run `npm run db:create`.
                            </div>
                        )}
                    </div>
                    <button onClick={clearError} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ErrorDisplay;
