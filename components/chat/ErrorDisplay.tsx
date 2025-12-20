
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

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 20 }}
                className="mx-4 mb-2"
            >
                <div className={`rounded-lg p-3 border shadow-lg flex items-start gap-3 ${isQuotaError ? 'bg-orange-900/90 border-orange-500/50 text-orange-100' : 'bg-red-900/90 border-red-500/50 text-red-100'}`}>
                    <WarningIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm">
                            {isQuotaError ? 'AI Rate Limit Reached' : 'System Error'}
                        </h4>
                        <p className="text-xs mt-1 opacity-90 break-words">
                            {isQuotaError 
                                ? "You've hit the free tier limit for the AI model. Please wait a minute before trying again." 
                                : status.error.substring(0, 300) + (status.error.length > 300 ? '...' : '')
                            }
                        </p>
                        {isDbError && (
                            <div className="mt-2 text-[10px] bg-black/20 p-2 rounded">
                                <strong>Tip:</strong> Check Vercel Storage settings and ensure database tables are created (npm run db:create).
                            </div>
                        )}
                    </div>
                    <button onClick={clearError} className="p-1 hover:bg-white/10 rounded">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ErrorDisplay;
