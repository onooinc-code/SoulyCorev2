
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Corrected a relative import path for icon components to use the absolute path alias `@`, resolving a module resolution error during the build process.
import { XIcon, InfoIcon, CommandLineIcon, WrenchScrewdriverIcon, BrainIcon } from '@/components/Icons';
// FIX: Corrected import paths for types.
import type { PipelineRun, PipelineRunStep } from '@/lib/types';

interface CognitiveInspectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    messageId: string | null;
}

interface InspectionData {
    pipelineRun: PipelineRun;
    pipelineSteps: PipelineRunStep[];
}

const PipelineStep = ({ step }: { step: PipelineRunStep }) => (
    <div className="bg-gray-900 p-3 rounded-lg">
        <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-200">
                Step {step.step_order}: {step.step_name}
            </h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${step.status === 'completed' ? 'bg-green-600/50 text-green-300' : 'bg-red-600/50 text-red-300'}`}>
                {step.status}
            </span>
        </div>
        <details className="mt-2 text-xs text-gray-400">
            <summary className="cursor-pointer focus:outline-none">Show Details</summary>
            <div className="mt-2 space-y-2 pl-2 border-l border-gray-700">
                {step.input_payload && (
                    <div>
                        <h5 className="font-semibold">Input:</h5>
                        <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-800 p-2 rounded-md overflow-auto">
                            <code>{JSON.stringify(step.input_payload, null, 2)}</code>
                        </pre>
                    </div>
                )}
                 {step.output_payload && (
                    <div>
                        <h5 className="font-semibold">Output:</h5>
                        <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-800 p-2 rounded-md overflow-auto">
                            <code>{JSON.stringify(step.output_payload, null, 2)}</code>
                        </pre>
                    </div>
                )}
                {step.model_used && (
                     <div>
                        <h5 className="font-semibold">AI Call Details:</h5>
                        <div className="font-mono bg-gray-800 p-2 rounded-md overflow-auto">
                           <p><strong>Model:</strong> {step.model_used}</p>
                           {step.config_used && <p><strong>Config:</strong> {JSON.stringify(step.config_used)}</p>}
                           <details className="mt-1">
                                <summary className="cursor-pointer">View Prompt</summary>
                                <pre className="text-xs whitespace-pre-wrap mt-1"><code>{step.prompt_used}</code></pre>
                           </details>
                        </div>
                    </div>
                )}
                {step.error_message && (
                    <div>
                        <h5 className="font-semibold text-red-400">Error:</h5>
                        <pre className="text-xs whitespace-pre-wrap font-mono bg-red-900/50 p-2 rounded-md overflow-auto">
                            <code>{step.error_message}</code>
                        </pre>
                    </div>
                )}
                <p>Duration: {step.duration_ms}ms</p>
            </div>
        </details>
    </div>
);

const renderContent = (data: any, title: string, icon