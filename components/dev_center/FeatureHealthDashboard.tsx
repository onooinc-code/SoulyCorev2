
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Feature, FeatureTest as TestCase, TestStatus } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/components/providers/AppProvider';
import { useLog } from '../providers/LogProvider';
import { CheckIcon, XIcon, MinusIcon } from '../Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type FeatureHealth = 'Healthy' | 'Failing' | 'Untested' | 'Partial';

// --- UI Mappings ---
const healthStatusMap: Record<FeatureHealth, { icon: React.ReactNode; color: string; label: string }> = {
    'Healthy': { icon: <CheckIcon className="w-4 h-4" />, color: 'text-green-400', label: 'Healthy' },
    'Failing': { icon: <XIcon className="w-4 h-4" />, color: 'text-red-400', label: 'Failing' },
    'Untested': { icon: <MinusIcon className="w-4 h-4" />, color: 'text-gray-400', label: 'Untested' },
    'Partial': { icon: <MinusIcon className="w-4 h-4" />, color: 'text-yellow-400', label: 'Partial' },
};

const testStatusColorMap: Record<TestStatus, string> = {
    'Passed': 'border-green-500',
    'Failed': 'border-red-500',
    'Not Run': 'border-gray-500',
};

// --- Helper Functions ---
const calculateFeatureHealth = (tests: TestCase[]): FeatureHealth => {
    if (!tests || tests.length === 0) {
        return 'Untested';
    }
    const totalTests = tests.length;
    const passedCount = tests.filter(t => t.last_run_status === 'Passed').length;
    const failedCount = tests.filter(t => t.last_run_status === 'Failed').length;

    if (failedCount > 0) return 'Failing';
    if (passedCount === totalTests) return 'Healthy';
    if (passedCount > 0 && passedCount < totalTests) return 'Partial';
    
    return 'Untested';
};

// --- Child Components ---
const FeatureRow = ({ 
    feature, 
    tests, 
    onSelectTest,
    selectedTestId 
}: { 
    feature: Feature; 
    tests: TestCase[];
    onSelectTest: (test: TestCase | null) => void;
    selectedTestId: string | null;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const health = calculateFeatureHealth(tests);
    const healthInfo = healthStatusMap[health];

    return (
        <motion.div layout className="bg-gray-800 rounded-lg overflow-hidden">
            <motion.div layout className="flex items-center p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-3 w-1/4">
                    <span className={healthInfo.color}>{healthInfo.icon}</span>
                    <span className={`font-semibold ${healthInfo.color}`}>{healthInfo.label}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate text-gray-200">{feature.name}</h4>
                </div>
                <div className="w-1/4 text-right text-sm text-gray-400">
                    {tests.length} Test(s)
                </div>
            </motion.div>
             <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 border-t border-gray-700 space-y-3">
                            {tests.length > 0 ? (
                                tests.map(test => (
                                    <button 
                                        key={test.id} 
                                        onClick={() => onSelectTest(test)}
                                        className={`w-full text-left p-3 bg-gray-900/50 rounded-md border-l-4 transition-all duration-200 ${testStatusColorMap[test.last_run_status]} ${selectedTestId === test.id ? 'ring-2 ring-indigo-500' : 'hover:bg-gray-900'}`}
                                    >
                                        <p className="font-semibold text-sm">{test.description}</p>
                                        <p className="text-xs text-gray-400 mt-1">Status: {test.last_run_status}</p>
                                    </button>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-2">No test cases have been created for this feature yet.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const TestExecutionView = ({ test, onUpdateStatus, isUpdating }: { test: TestCase; onUpdateStatus: (testId: string, status: TestStatus) => void; isUpdating: boolean; }) => {
    return (
        <div className="p-4 bg-gray-800 rounded-lg h-full flex flex-col">
            <h4 className="text-xl font-bold mb-1 text-indigo-300">Test Execution</h4>
            <p className="text-sm text-gray-400 mb-4">{test.description}</p>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                <div>
                    <h5 className="font-semibold text-gray-300 mb-1">Manual Steps:</h5>
                    <div className="prose-custom text-sm bg-gray-900/50 p-3 rounded-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{test.manual_steps || 'No steps provided.'}</ReactMarkdown>
                    </div>
                </div>
                <div>
                    <h5 className="font-semibold text-gray-300 mb-1">Expected Result:</h5>
                    <div className="prose-custom text-sm bg-gray-900/50 p-3 rounded-md">
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>{test.expected_result}</ReactMarkdown>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-gray-700 mt-4">
                <p className="text-xs text-gray-400 mb-2">After manually performing the test, record the outcome:</p>
                <div className="flex gap-2">
                    <button 
                        onClick={() => onUpdateStatus(test.id, 'Passed')}
                        disabled={isUpdating}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-500 disabled:opacity-50"
                    >
                        Mark as Passed
                    </button>
                    <button 
                        onClick={() => onUpdateStatus(test.id, 'Failed')}
                        disabled={isUpdating}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
                    >
                        Mark as Failed
                    </button>
                </div>
            </div>
        </div>
    );
};


// Main Component
const FeatureHealthDashboard = () => {
    const { setStatus, clearError } = useAppContext();
    const { log } = useLog();
    const [features, setFeatures] = useState<Feature[]>([]);
    const [tests, setTests] = useState<TestCase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        clearError();
        try {
            const [featuresRes, testsRes] = await Promise.all([
                fetch('/api/features'),
                fetch('/api/tests')
            ]);
            if (!featuresRes.ok || !testsRes.ok) throw new Error('Failed to fetch data');
            
            const featuresData = await featuresRes.json();
            const testsData = await testsRes.json();
            setFeatures(featuresData);
            setTests(testsData);

        } catch (error) {
            setStatus({ error: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [clearError, setStatus, log]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateTestStatus = async (testId: string, status: TestStatus) => {
        setIsUpdating(true);
        log(`Updating test status`, { testId, status });
        try {
            const res = await fetch(`/api/tests/${testId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ last_run_status: status }),
            });
            if (!res.ok) throw new Error('Failed to update test status');
            await fetchData(); // Refresh data
        } catch (error) {
            setStatus({ error: (error as Error).message });
            log('Failed to update test status', { error }, 'error');
        } finally {
            setIsUpdating(false);
        }
    };
    
    const testsByFeature = useMemo(() => {
        return tests.reduce((acc, test) => {
            if (!acc[test.featureId]) {
                acc[test.featureId] = [];
            }
            acc[test.featureId].push(test);
            return acc;
        }, {} as Record<string, TestCase[]>);
    }, [tests]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><p>Loading health dashboard...</p></div>;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-2xl font-bold">Feature Health Dashboard</h3>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
                <div className="col-span-7 overflow-y-auto pr-2 space-y-3">
                     {features.map(feature => (
                        // FIX: Wrapped the iterated `FeatureRow` component in a div with the `key` prop to resolve a TypeScript error.
                        // The `key` prop is for React's reconciliation and should be on the wrapping element of a list, not passed as a prop to the component itself.
                        <div key={feature.id}>
                            <FeatureRow 
                                feature={feature}
                                tests={testsByFeature[feature.id] || []}
                                onSelectTest={setSelectedTest}
                                selectedTestId={selectedTest?.id || null}
                            />
                        </div>
                    ))}
                </div>
                 <div className="col-span-5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedTest ? selectedTest.id : 'empty'}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {selectedTest ? (
                                <TestExecutionView 
                                    test={selectedTest}
                                    onUpdateStatus={handleUpdateTestStatus}
                                    isUpdating={isUpdating}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 bg-gray-800/50 rounded-lg">
                                    <p>Select a test case to view details.</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default FeatureHealthDashboard;
