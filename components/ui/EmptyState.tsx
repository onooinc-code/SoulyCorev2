"use client";

// components/ui/EmptyState.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    icon: React.FC<any>;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700"
        >
            <Icon className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-400">{title}</h3>
            <p className="text-sm max-w-xs mt-1">{description}</p>
            {action && (
                <button 
                    onClick={action.onClick}
                    className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-500"
                >
                    {action.label}
                </button>
            )}
        </motion.div>
    );
};

export default EmptyState;