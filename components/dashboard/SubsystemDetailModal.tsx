
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Subsystem } from '@/lib/types';
import { XIcon } from '../Icons';

interface SubsystemDetailModalProps {
    subsystem: Subsystem;
    onClose: () => void;
}

const SubsystemDetailModal = ({ subsystem, onClose }: SubsystemDetailModalProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold">{subsystem.name} - Details</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    <p className="text-sm text-gray-400">{subsystem.description}</p>
                    
                    {subsystem.tasks && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-900/50 p-3 rounded-lg">
                                <h3 className="font-semibold text-green-400 mb-2">Completed Tasks</h3>
                                <ul className="space-y-1 list-disc list-inside text-sm">
                                    {subsystem.tasks.completed.map((task, i) => (
                                        <li key={i}>{task}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-gray-900/50 p-3 rounded-lg">
                                 <h3 className="font-semibold text-yellow-400 mb-2">Remaining Tasks</h3>
                                <ul className="space-y-1 list-disc list-inside text-sm">
                                     {subsystem.tasks.remaining.map((task, i) => (
                                        <li key={i}>{task}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                     <div>
                        <h3 className="font-semibold text-indigo-400 mb-2">Dependencies</h3>
                        {subsystem.dependencies.length > 0 ? (
                             <div className="flex flex-wrap gap-2">
                                {subsystem.dependencies.map(dep => (
                                    <span key={dep} className="text-xs bg-gray-700 px-2 py-1 rounded-full">{dep}</span>
                                ))}
                            </div>
                        ) : <p className="text-sm text-gray-500">No dependencies.</p>}
                       
                    </div>

                </div>
                <div className="p-4 border-t border-gray-700">
                     <button onClick={onClose} className="w-full px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500">Close</button>
                </div>

            </motion.div>
        </motion.div>
    );
};

export default SubsystemDetailModal;
