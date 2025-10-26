

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Feature, FeatureTest as TestCase, TestStatus } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/components/providers/AppProvider';
import { useLog } from '@/components/providers/LogProvider';
import { CheckIcon, XIcon, MinusIcon } from '@/components/Icons';
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
                        <div className="p-4 border-t border-gray-700 space-y-2">
                            {tests.length > 0 ? (
                                tests.map(test => (
                                    <button 
                                        key={test.id}
                                        onClick={() => onSelectTest(test)}
                                        className={`w-full text-left p-2 rounded-md text-sm transition-colors flex items-center gap-3 ${selectedTestId === test.id ? 'bg-indigo-600/50' : 'hover:bg-gray-700/50'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${test.last_run_status === 'Passed' ? 'bg-green-500' : test.last_run_status === 'Failed' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                                        <span className="flex-1">{test.description}</span>
                                        <span className="text-xs text-gray-400">{test.last_run_status}</span>
                                    </button>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500 px-2">No test cases registered for this feature.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};


const TestCasePanel = ({ test, onUpdate, onClose }: { test: TestCase; onUpdate: (testId: string, status: TestStatus) => void; onClose: () => void; }) => {
    const [status, setStatus] = useState<TestStatus>(test.last_run_status);
    const [isSaving, setIsSaving] = useState(false);

    const handleUpdate = async () => {
        setIsSaving(true);
        await onUpdate(test.id, status);
        setIsSaving(false);
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 h-full w-full md:w-1/2 bg-gray-900/80 backdrop-blur-md border-l border-gray-700 p-6 flex flex-col"
        >
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg text-white">Test Case Details</h4>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <div>
                    <h5 className="text-sm font-semibold text-gray-400">Description</h5>
                    <p>{test.description}</p>
                </div>
                 {test.manual_steps && (
                    <div>
                        <h5 className="text-sm font-semibold text-gray-400">Manual Steps</h5>
                        <div className="prose-custom text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{test.manual_steps || ''}</ReactMarkdown></div>
                    </div>
                 )}
                 <div>
                    <h5 className="text-sm font-semibold text-gray-400">Expected Result</h5>
                    <p className="italic">{test.expected_result}</p>
                </div>
                 <div className="pt-4 border-t border-gray-700">
                     <h5 className="text-sm font-semibold text-gray-400 mb-2">Record Test Result</h5>
                     <div className="flex gap-2">
                        {(['Passed', 'Failed', 'Not Run'] as TestStatus[]).map(s => (
                            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1 text-xs rounded-md ${status === s ? testStatusColorMap[s].replace('border-', 'bg-') : 'bg-gray-700 hover:bg-gray-600'}`}>
                                {s}
                            </button>
                        ))}
                     </div>
                </div>
            </div>
            <div className="flex-shrink-0 mt-4">
                 <button onClick={handleUpdate} disabled={isSaving} className="w-full py-2 bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-50">
                    {isSaving ? "Saving..." : "Save Result"}
                </button>
            </div>
        </motion.div>
    );
}

const FeatureHealthDashboard = () => {
    const { setStatus, clearError } = useAppContext();
    const { log } = useLog();

    const [features, setFeatures] = useState<Feature[]>([]);
    const [tests, setTests] = useState<TestCase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [featuresRes, testsRes] = await Promise.all([
                fetch('/api/features'),
                fetch('/api/tests'),
            ]);
            if (!featuresRes.ok || !testsRes.ok) throw new Error("Failed to fetch data");
            const featuresData = await featuresRes.json();
            const testsData = await testsRes.json();
            setFeatures(featuresData);
            setTests(testsData);
        } catch (e) {
            log('Failed to fetch health dashboard data', { error: (e as Error).message }, 'error');
            setStatus({ error: (e as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [log, setStatus]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateTest = async (testId: string, status: TestStatus) => {
        try {
            const res = await fetch(`/api/tests/${testId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ last_run_status: status }),
            });
            if (!res.ok) throw new Error("Failed to update test status");
            await fetchData(); // Refresh all data
        } catch (e) {
            log('Failed to update test', { error: (e as Error).message, testId }, 'error');
            setStatus({ error: (e as Error).message });
        }
    }

    const groupedFeatures = useMemo(() => {
        const testsByFeature = tests.reduce((acc, test) => {
            if (!acc[test.featureId]) {
                acc[test.featureId] = [];
            }
            acc[test.featureId].push(test);
            return acc;
        }, {} as Record<string, TestCase[]>);

        return features.map(feature => [feature, testsByFeature[feature.id] || []] as [Feature, TestCase[]]);
    }, [features, tests]);


    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h3 className="text-2xl font-bold">Feature Health Dashboard</h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {isLoading ? (
                    <p>Loading feature health data...</p>
                ) : (
                    groupedFeatures.map(([feature, featureTests]) => (
                       <div key={feature.id}>
                            <FeatureRow
                                feature={feature}
                                tests={featureTests}
                                onSelectTest={setSelectedTest}
                                selectedTestId={selectedTest?.id || null}
                            />
                        </div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {selectedTest && (
                    <TestCasePanel 
                        test={selectedTest}
                        onUpdate={handleUpdateTest}
                        onClose={() => setSelectedTest(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default FeatureHealthDashboard;