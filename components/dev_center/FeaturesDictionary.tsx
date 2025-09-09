
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Feature, FeatureStatus, UiUxSubFeature } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, EditIcon, XIcon } from '../Icons';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useLog } from '../providers/LogProvider';

const statusOptions: FeatureStatus[] = ['✅ Completed', '🟡 Needs Improvement', '🔴 Needs Refactor', '⚪ Planned'];

const statusColorMap: Record<FeatureStatus, string> = {
    '✅ Completed': 'bg-green-600 text-green-100',
    '🟡 Needs Improvement': 'bg-yellow-600 text-yellow-100',
    '🔴 Needs Refactor': 'bg-red-600 text-red-100',
    '⚪ Planned': 'bg-gray-600 text-gray-100',
};

// A component to safely render JSON content from a string or an object
const SafeJsonRenderer = ({ jsonData, type }: { jsonData: string | object | null; type: 'files' | 'ux' }) => {
    try {
        if (!jsonData) {
            return <div className="text-xs text-gray-500">Not specified.</div>;
        }

        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

        if (data === null) {
            return <div className="text-xs text-gray-500">Not specified.</div>;
        }

        if (type === 'files' && Array.isArray(data)) {
            if (data.length === 0) return <div className="text-xs text-gray-500">No files listed.</div>;
            return (
                <div className="flex flex-wrap gap-2">
                    {data.map((file, index) => (
                        <code key={index} className="text-xs bg-gray-700 text-indigo-300 px-2 py-1 rounded-md">{file}</code>
                    ))}
                </div>
            );
        }

        if (type === 'ux' && Array.isArray(data)) {
            if (data.length === 0) return <div className="text-xs text-gray-500">No breakdown provided.</div>;
            return (
                <table className="w-full text-left text-xs table-fixed">
                    <thead className="text-gray-400">
                        <tr>
                            <th className="p-2 w-1/4">Sub-Feature</th>
                            <th className="p-2 w-1/2">Description</th>
                            <th className="p-2 w-1/4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data as UiUxSubFeature[]).map((item, index) => (
                            <tr key={index} className="border-t border-gray-700">
                                <td className="p-2 align-top break-words">{item.subFeature}</td>
                                <td className="p-2 align-top break-words">{item.description}</td>
                                <td className="p-2 align-top break-words">
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColorMap[item.status] || 'bg-gray-600'}`}>
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        return <pre className="text-xs text-red-400">Invalid data format for this type.</pre>;
    } catch (e) {
        return <pre className="text-xs text-red-400">Error parsing JSON: {(e as Error).message}</pre>;
    }
};


// Main Feature Item Component
interface FeatureItemProps {
    feature: Feature;
    onEdit: () => void;
    onDelete: () => void;
}
const FeatureItem = ({ feature, onEdit, onDelete }: FeatureItemProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { log } = useLog();

    return (
        <motion.div layout className="bg-gray-800 rounded-lg overflow-hidden">
            <motion.div layout className="flex justify-between items-center p-4 cursor-pointer" onClick={() => {
                log(`User ${isExpanded ? 'collapsed' : 'expanded'} feature view`, { featureName: feature.name });
                setIsExpanded(!isExpanded);
            }}>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate">{feature.name}</h4>
                </div>
                <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColorMap[feature.status]}`}>
                        {feature.status}
                    </span>
                    <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-blue-400" title="Edit this feature's documentation."><EditIcon className="w-5 h-5"/></button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-red-500" title="Permanently delete this feature from the dictionary."><TrashIcon className="w-5 h-5"/></button>
                    </div>
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
                        <div className="p-4 border-t border-gray-700 space-y-4 text-sm text-gray-300">
                            <div><strong className="text-gray-400 block mb-1">Overview:</strong><p className="whitespace-pre-wrap">{feature.overview}</p></div>
                            <div><strong className="text-gray-400 block mb-1">Logic & Data Flow:</strong><p className="whitespace-pre-wrap">{feature.logic_flow}</p></div>
                             <div>
                                <strong className="text-gray-400 block mb-2">UI/UX Breakdown:</strong>
                                <SafeJsonRenderer jsonData={feature.ui_ux_breakdown_json} type="ux" />
                            </div>
                            <div>
                                <strong className="text-gray-400 block mb-2">Key Files:</strong>
                                <SafeJsonRenderer jsonData={feature.key_files_json} type="files" />
                            </div>
                            {feature.notes && <div><strong className="text-gray-400 block mb-1">Notes:</strong><p className="whitespace-pre-wrap">{feature.notes}</p></div>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};


const FeaturesDictionary = () => {
    const { setStatus, clearError } = useConversation();
    const { log } = useLog();
    const [features, setFeatures] = useState<Feature[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentFeature, setCurrentFeature] = useState<Partial<Feature> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFeatures = useCallback(async () => {
        setIsLoading(true);
        clearError();
        log('Fetching features from dictionary...');
        try {
            const res = await fetch('/api/features');
            if (!res.ok) throw new Error('Failed to fetch features');
            const data = await res.json();
            setFeatures(data);
            log(`Successfully fetched ${data.length} features.`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to fetch features.', { error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [setStatus, clearError, log]);

    useEffect(() => {
        fetchFeatures();
    }, [fetchFeatures]);

    const handleOpenForm = (feature: Partial<Feature> | null = null) => {
        const action = feature ? 'edit' : 'new';
        log(`User opened feature form for ${action} feature.`, { featureId: feature?.id });

        let featureForForm: Partial<Feature>;
        if (feature) {
            featureForForm = { ...feature };
            if (typeof featureForForm.ui_ux_breakdown_json === 'object' && featureForForm.ui_ux_breakdown_json !== null) {
                featureForForm.ui_ux_breakdown_json = JSON.stringify(featureForForm.ui_ux_breakdown_json, null, 2);
            }
            if (typeof featureForForm.key_files_json === 'object' && featureForForm.key_files_json !== null) {
                featureForForm.key_files_json = JSON.stringify(featureForForm.key_files_json, null, 2);
            }
        } else {
            featureForForm = {
                name: '',
                overview: '',
                status: '⚪ Planned',
                ui_ux_breakdown_json: '[\n  {\n    "subFeature": "",\n    "description": "",\n    "status": "⚪ Planned"\n  }\n]',
                logic_flow: '',
                key_files_json: '[\n  ""\n]',
                notes: '',
            };
        }
        setCurrentFeature(featureForForm);
        setIsFormOpen(true);
    };
    
    const handleSaveFeature = async () => {
        if (!currentFeature || !currentFeature.name) return;
        
        try {
            if (currentFeature.ui_ux_breakdown_json) JSON.parse(currentFeature.ui_ux_breakdown_json as string);
            if (currentFeature.key_files_json) JSON.parse(currentFeature.key_files_json as string);
        } catch (e) {
            const errorMessage = "Invalid JSON format in one of the fields. Please check and try again.";
            setStatus({ error: errorMessage});
            log('Feature save failed due to invalid JSON.', { error: (e as Error).message }, 'error');
            return;
        }

        clearError();
        const isUpdating = !!currentFeature.id;
        const action = isUpdating ? 'Updating' : 'Creating';
        log(`${action} feature...`, { featureData: currentFeature });

        const url = isUpdating ? `/api/features/${currentFeature.id}` : '/api/features';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentFeature),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Failed to ${isUpdating ? 'update' : 'create'} feature`);
            }
            
            const savedFeature = await res.json();
            log(`Feature ${action.toLowerCase()}d successfully.`, { savedFeature });
            await fetchFeatures();
            setIsFormOpen(false);
            setCurrentFeature(null);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log(`Failed to ${action.toLowerCase()} feature.`, { error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
            console.error(error);
        }
    };

    const handleDeleteFeature = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this feature?')) {
            clearError();
            log(`Attempting to delete feature with ID: ${id}`);
            try {
                const res = await fetch(`/api/features/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete feature');
                log('Feature deleted successfully.', { id });
                await fetchFeatures();
            } catch (error) {
                const errorMessage = (error as Error).message;
                setStatus({ error: errorMessage });
                log('Failed to delete feature.', { id, error: { message: errorMessage, stack: (error as Error).stack } }, 'error');
                console.error(error);
            }
        } else {
            log('User cancelled feature deletion.', { id });
        }
    };
    
    const renderForm = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h3 className="font-semibold text-lg">{currentFeature?.id ? 'Edit Feature' : 'New Feature'}</h3>
                    <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input value={currentFeature?.name || ''} onChange={e => setCurrentFeature(f => f ? {...f, name: e.target.value} : null)} placeholder="Feature Name" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                        <select value={currentFeature?.status || '⚪ Planned'} onChange={e => setCurrentFeature(f => f ? {...f, status: e.target.value as FeatureStatus} : null)} className="w-full p-2 bg-gray-700 rounded-lg text-sm">
                            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <textarea value={currentFeature?.overview || ''} onChange={e => setCurrentFeature(f => f ? {...f, overview: e.target.value} : null)} placeholder="Overview" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
                    <textarea value={currentFeature?.logic_flow || ''} onChange={e => setCurrentFeature(f => f ? {...f, logic_flow: e.target.value} : null)} placeholder="Logic & Data Flow" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={4}></textarea>
                    <div>
                        <label className="text-xs text-gray-400">UI/UX Breakdown (Must be a valid JSON Array)</label>
                        <textarea value={currentFeature?.ui_ux_breakdown_json as string || '[]'} onChange={e => setCurrentFeature(f => f ? {...f, ui_ux_breakdown_json: e.target.value} : null)} className="w-full p-2 bg-gray-700 rounded-lg text-sm font-mono" rows={4}></textarea>
                    </div>
                     <div>
                        <label className="text-xs text-gray-400">Key Files (Must be a valid JSON Array of strings)</label>
                        <textarea value={currentFeature?.key_files_json as string || '[]'} onChange={e => setCurrentFeature(f => f ? {...f, key_files_json: e.target.value} : null)} className="w-full p-2 bg-gray-700 rounded-lg text-sm font-mono" rows={3}></textarea>
                    </div>
                    <textarea value={currentFeature?.notes || ''} onChange={e => setCurrentFeature(f => f ? {...f, notes: e.target.value} : null)} placeholder="Notes & Improvements" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
                </div>
                <div className="flex gap-2 p-4 border-t border-gray-700 flex-shrink-0">
                    <button onClick={handleSaveFeature} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save Feature</button>
                    <button onClick={() => {
                        log('User cancelled feature form.');
                        setIsFormOpen(false);
                    }} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                </div>
            </motion.div>
        </motion.div>
    );

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h3 className="text-2xl font-bold">Features Dictionary</h3>
                 <button 
                    onClick={() => handleOpenForm()} 
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm"
                    title="Add a new feature to the documentation dictionary."
                 >
                        <PlusIcon className="w-5 h-5" /> Add Feature
                 </button>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center"><p>Loading features...</p></div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {features.length > 0 ? (
                        features.map(feature => (
                           <div key={feature.id}>
                                <FeatureItem 
                                    feature={feature} 
                                    onEdit={() => handleOpenForm(feature)} 
                                    onDelete={() => handleDeleteFeature(feature.id)}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No features found. Add one to get started.</p>
                        </div>
                    )}
                </div>
            )}
            
            <AnimatePresence>
                {isFormOpen && currentFeature && renderForm()}
            </AnimatePresence>
        </div>
    );
};

export default FeaturesDictionary;
