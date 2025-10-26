"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CheckIcon, CpuChipIcon } from './Icons';

interface HardResetModalProps {
    onClose: () => void;
    onComplete: () => void;
}

const steps = [
    "Clearing session state...",
    "Disconnecting from memory modules...",
    "Purging temporary cache...",
    "Re-initializing core services...",
    "Redirecting to dashboard...",
];

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const HardResetModal = ({ onClose, onComplete }: HardResetModalProps) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step <= steps.length) {
                setCurrentStep(step);
            } else {
                clearInterval(interval);
                onComplete();
                onClose();
            }
        }, 800); // 800ms per step

        return () => clearInterval(interval);
    }, [onComplete, onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[150] p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                className="glass-panel rounded-lg shadow-2xl w-full max-w-md"
            >
                <div className="flex justify-center items-center p-4 border-b border-gray-700/50">
                    <CpuChipIcon className="w-6 h-6 mr-3 text-indigo-400" />
                    <h2 className="text-xl font-bold">Hard Resetting Application</h2>
                </div>
                <div className="p-6 space-y-4">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 text-sm"
                        >
                            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                                {currentStep > index + 1 ? (
                                    <CheckIcon className="w-5 h-5 text-green-400" />
                                ) : currentStep === index + 1 ? (
                                    <Spinner />
                                ) : (
                                    <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                )}
                            </div>
                            <span className={currentStep > index ? 'text-gray-300' : 'text-gray-500'}>
                                {step}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default HardResetModal;