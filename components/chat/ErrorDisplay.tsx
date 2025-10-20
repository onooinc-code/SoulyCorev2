
"use client";

import React from 'react';
import type { IStatus } from '@/lib/types';

interface ErrorDisplayProps {
    status: IStatus;
    isDbError: boolean;
    clearError: () => void;
}

const ErrorDisplay = ({ status, isDbError, clearError }: ErrorDisplayProps) => {
    if (!status.error) return null;

    return (
        <div className="p-4 bg-red-800/50 text-red-200 text-sm border-t border-red-700 flex-shrink-0">
            <div className="max-w-4xl mx-auto text-left">
                <div className="flex justify-between items-center">
                    <p className="font-bold text-base mb-2">An Error Occurred</p>
                    <button onClick={clearError} className="text-xs underline hover:text-white">Dismiss</button>
                </div>
                <p className="mb-4 bg-red-900/50 p-2 rounded-md font-mono">{status.error}</p>
                
                {isDbError && (
                     <div className="mt-4 p-4 bg-red-900/50 rounded-lg text-xs">
                        <p className="font-bold mb-2">How to Fix This Deployment Error:</p>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>
                                <strong>Check Vercel Integration:</strong> Go to your project dashboard on Vercel, navigate to the "Storage" tab, and ensure your Postgres database is successfully connected to this project.
                            </li>
                            <li>
                                <strong>Create Database Tables:</strong> In the Vercel "Storage" tab, click your database, then go to the "Query" tab. You must run the table creation script there. You can find the necessary SQL commands in the `scripts/create-tables.js` file in your project.
                            </li>
                            <li>
                                <strong>Redeploy:</strong> After confirming the steps above, go to the "Deployments" tab for your project and redeploy the latest version to apply the changes.
                            </li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ErrorDisplay;
