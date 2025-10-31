

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Feature, FeatureStatus, UiUxSubFeature } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, EditIcon, XIcon, CopyIcon, CheckIcon, MagnifyingGlassIcon } from '@/components/Icons';
import { useConversation } from '@/components/providers/ConversationProvider';
import { ResponsivePie } from '@nivo/pie';

const statusOptions: FeatureStatus[] = ['✅ Completed', '🟡 Needs Improvement', '🔴 Needs Refactor', '⚪ Planned'];

const statusColorMap: Record<FeatureStatus, { bg: string; text: string; chartColor: string }> = {
    '✅ Completed': { bg: 'bg-green-600', text: 'text-green-100', chartColor: 'hsl(140, 70%, 45%)' },
    '🟡 Needs Improvement': { bg: 'bg-yellow-600', text: 'text-yellow-100', chartColor: 'hsl(45, 80%, 55%)' },
    '🔴 Needs Refactor': { bg: 'bg-red-600', text: 'text-red-100', chartColor: 'hsl(0, 70%, 55%)' },
    '⚪ Planned': { bg: 'bg-gray-600', text: 'text-gray-100', chartColor: 'hsl(210, 9%, 50%)' },
};

// FIX: Changed to React.FC to correctly type the component for list rendering with a 'key' prop.
const KeyFileItem: React.FC<{ file: string }> = ({ file }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(file);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="flex items-center gap-2 text-xs bg-gray-700 text-indigo-300 px-2 py-1 rounded-md hover:bg-gray-600 transition-colors">
             <code>{file}</code>
             {copied ? <CheckIcon className="w-3 h-3 text-green-400" /> : <CopyIcon className="w-3 h-3" />}
        </button>
    );
};

// A component to safely render JSON content from a string or an object
const SafeJsonRenderer = ({ jsonData, type }: { jsonData: string | object | null; type: 'files' | 'ux' }) => {
    try {
        if (!jsonData) return <div className="text-xs text-gray-500">Not specified.</div>;
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        if (data === null) return <div className="text-xs text-gray-500">Not specified.</div>;

        if (type === 'files' && Array.isArray(data)) {
            if (data.length === 0) return <div className="text-xs text-gray-500">No files listed.</div>;
            return (
                <div className="flex flex-wrap gap-2">
                    {data.map((file, index) => <KeyFileItem key={index} file={file} />)}
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
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColorMap[item.status]?.bg || 'bg-gray-600'} ${statusColorMap[item.status]?.text || 'text-gray-100'}`}>
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

interface FeatureItemProps {
    feature: Feature;
    onEdit: () => void;
    onDelete: () => void;
}
const FeatureItem: React.FC<FeatureItemProps> = ({ feature, onEdit, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div layout className="bg-gray-800 rounded-lg overflow-hidden">
            <motion.div layout className="flex justify-between items-center p-4 cursor-pointer" onClick={() => {
                console.log(`User ${isExpanded ? 'collapsed' : 'expanded'} feature view`, { featureName: feature.name });
                setIsExpanded(!isExpanded);
            }}>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate">{feature.name}</h4>
                </div>
                <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColorMap[feature.status].bg} ${statusColorMap[feature.status].text}`}>
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
                            {/* FIX: Corrected property name from logic_flow to logicFlow */}
                            <div><strong className="text-gray-400 block mb-1">Logic & Data Flow:</strong><p className="whitespace-pre-wrap">{feature.logicFlow}</p></div>
                             <div>
                                <strong className="text-gray-400 block mb-2">UI/UX Breakdown:</strong>
                                {/* FIX: Corrected property name from ui_ux_breakdown_json to uiUxBreakdownJson */}
                                <SafeJsonRenderer jsonData={feature.uiUxBreakdownJson} type="ux" />
                            </div>
                            <div>
                                <strong className="text-gray-400 block mb-2">Key Files:</strong>
                                {/* FIX: Corrected property name from key_files_json to keyFilesJson */}
                                <SafeJsonRenderer jsonData={feature.keyFilesJson} type="files" />
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
    const [features, setFeatures] = useState<Feature[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentFeature, setCurrentFeature] = useState<Partial<Feature> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState({ category: 'all', status: 'all' });


    const fetchFeatures = useCallback(async () => {
        setIsLoading(true);
        clearError();
        console.log('Fetching features from dictionary...');
        try {
            const res = await fetch('/api/features');
            if (!res.ok) throw new Error('Failed to fetch features');
            const data = await res.json();
            setFeatures(data);
            console.log(`Successfully fetched ${data.length} features.`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            console.error('Failed to fetch features.', { error: { message: errorMessage, stack: (error as Error).stack } });
        } finally {
            setIsLoading(false);
        }
    }, [setStatus, clearError]);

    useEffect(() => {
        fetchFeatures();
    }, [fetchFeatures]);

    const handleOpenForm = (feature: Partial<Feature> | null = null) => {
        const action = feature ? 'edit' : 'new';
        console.log(`User opened feature form for ${action} feature.`, { featureId: feature?.id });

        let featureForForm: Partial<Feature>;
        if (feature) {
            featureForForm = { ...feature };
            // FIX: Correct property name from ui_ux_breakdown_json to uiUxBreakdownJson
            if (typeof featureForForm.uiUxBreakdownJson === 'object' && featureForForm.uiUxBreakdownJson !== null) {
                // FIX: Correct property name from ui_ux_breakdown_json to uiUxBreakdownJson
                featureForForm.uiUxBreakdownJson = JSON.stringify(featureForForm.uiUxBreakdownJson, null, 2);
            }
            // FIX: Correct property name from key_files_json to keyFilesJson
            if (typeof featureForForm.keyFilesJson === 'object' && featureForForm.keyFilesJson !== null) {
                // FIX: Correct property name from key_files_json to keyFilesJson
                featureForForm.keyFilesJson = JSON.stringify(featureForForm.keyFilesJson, null, 2);
            }
        } else {
            featureForForm = {
                name: '',
                overview: '',
                status: '⚪ Planned',
                category: 'Uncategorized',
                // FIX: Corrected property name from ui_ux_breakdown_json to uiUxBreakdownJson.
                uiUxBreakdownJson: '[\n  {\n    "subFeature": "",\n    "description": "",\n    "status": "⚪ Planned"\n  }\n]',
                logicFlow: '',
                keyFilesJson: '[\n  ""\n]',
                notes: '',
            };
        }
        setCurrentFeature(featureForForm);
        setIsFormOpen(true);
    };
    
    const handleSaveFeature = async () => {
        if (!currentFeature || !currentFeature.name) return;
        
        try {
            // FIX: Correct property name from ui_ux_breakdown_json to uiUxBreakdownJson
            if (currentFeature.uiUxBreakdownJson) JSON.parse(currentFeature.uiUxBreakdownJson as string);
            // FIX: Correct property name from key_files_json to keyFilesJson
            if (currentFeature.keyFilesJson) JSON.parse(currentFeature.keyFilesJson as string);
        } catch (e) {
            const errorMessage = "Invalid JSON format in one of the fields. Please check and try again.";
            setStatus({ error: errorMessage});
            console.error('Feature save failed due to invalid JSON.', { error: (e as Error).message });
            return;
        }

        clearError();
        const isUpdating = !!currentFeature.id;
        const action = isUpdating ? 'Updating' : 'Creating';
        console.log(`${action} feature...`, { featureData: currentFeature });

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
            
            await fetchFeatures();
            setIsFormOpen(false);
            setCurrentFeature(null);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            console.error(`Failed to ${action.toLowerCase()} feature.`, { error: { message: errorMessage, stack: (error as Error).stack } });
        }
    };

    const handleDeleteFeature = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this feature?')) {
            clearError();
            console.log(`Attempting to delete feature with ID: ${id}`);
            try {
                const res = await fetch(`/api/features/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete feature');
                console.log('Feature deleted successfully.', { id });
                await fetchFeatures();
            } catch (error) {
                const errorMessage = (error as Error).message;
                setStatus({ error: errorMessage });
                console.error('Failed to delete feature.', { id, error: { message: errorMessage, stack: (error as Error).stack } });
            }
        } else {
            console.log('User cancelled feature deletion.', { id });
        }
    };
    
    const categories = useMemo(() => ['all', ...Array.from(new Set(features.map(f => f.category).filter((c): c is string => !!c)))], [features]);
    const statusCounts = useMemo(() => {
        return features.reduce((acc, feature) => {
            acc[feature.status] = (acc[feature.status] || 0) + 1;
            return acc;
        }, {} as Record<FeatureStatus, number>);
    }, [features]);

    const pieChartData = useMemo(() => {
        return Object.entries(statusCounts).map(([status, count]) => ({
            id: status,
            label: status.replace(/✅|🟡|🔴|⚪/g, '').trim(),
            value: count,
            color: statusColorMap[status as FeatureStatus].chartColor
        }));
    }, [statusCounts]);

     const filteredFeatures = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return features.filter(feature => {
            const categoryMatch = activeFilters.category === 'all' || feature.category === activeFilters.category;
            const statusMatch = activeFilters.status === 'all' || feature.status === activeFilters.status;
            const searchMatch = !searchTerm || 
                feature.name.toLowerCase().includes(lowerSearch) || 
                feature.overview?.toLowerCase().includes(lowerSearch) ||
                feature.logicFlow?.toLowerCase().includes(lowerSearch);
            return categoryMatch && statusMatch && searchMatch;
        });
    }, [features, searchTerm, activeFilters]);

    const renderForm = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h3 className="font-semibold text-lg">{currentFeature?.id ? 'Edit Feature' : 'New Feature'}</h3>
                    <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input value={currentFeature?.name || ''} onChange={e => setCurrentFeature(f => f ? {...f, name: e.target.value} : null)} placeholder="Feature Name" className="w-full p-2 bg-gray-700 rounded-lg text-sm md:col-span-2"/>
                        <select value={currentFeature?.status || '⚪ Planned'} onChange={e => setCurrentFeature(f => f ? {...f, status: e.target.value as FeatureStatus} : null)} className="w-full p-2 bg-gray-700 rounded-lg text-sm">
                            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                     <input value={currentFeature?.category || ''} onChange={e => setCurrentFeature(f => f ? {...f, category: e.target.value} : null)} placeholder="Category (e.g., Core Engine)" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                    <textarea value={currentFeature?.overview || ''} onChange={e => setCurrentFeature(f => f ? {...f, overview: e.target.value} : null)} placeholder="Overview" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
                    {/* FIX: Corrected property name from logic_flow to logicFlow */}
                    <textarea value={currentFeature?.logicFlow || ''} onChange={e => setCurrentFeature(f => f ? {...f, logicFlow: e.target.value} : null)} placeholder="Logic & Data Flow" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={4}></textarea>
                    {/* FIX: Corrected property name from ui_ux_breakdown_json to uiUxBreakdownJson */}
                    <div><label className="text-xs text-gray-400">UI/UX Breakdown (JSON Array)</label><textarea value={currentFeature?.uiUxBreakdownJson as string || '[]'} onChange={e => setCurrentFeature(f => f ? {...f, uiUxBreakdownJson: e.target.value} : null)} className="w-full p-2 bg-gray-700 rounded-lg text-sm font-mono" rows={4}></textarea></div>
                    {/* FIX: Corrected property name from key_files_json to keyFilesJson */}
                    <div><label className="text-xs text-gray-400">Key Files (JSON Array)</label><textarea value={currentFeature?.keyFilesJson as string || '[]'} onChange={e => setCurrentFeature(f => f ? {...f, keyFilesJson: e.target.value} : null)} className="w-full p-2 bg-gray-700 rounded-lg text-sm font-mono" rows={3}></textarea></div>
                    <textarea value={currentFeature?.notes || ''} onChange={e => setCurrentFeature(f => f ? {...f, notes: e.target.value} : null)} placeholder="Notes & Improvements" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
                </div>
                <div className="flex gap-2 p-4 border-t border-gray-700 flex-shrink-0">
                    <button onClick={handleSaveFeature} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save Feature</button>
                    <button onClick={() => { console.log('User cancelled feature form.'); setIsFormOpen(false); }} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                </div>
            </motion.div>
        </motion.div>
    );

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h3 className="text-2xl font-bold">Features Dictionary</h3>
                 <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm"><PlusIcon className="w-5 h-5" /> Add Feature</button>
            </div>

            <div className="grid grid-cols-12 gap-4 mb-4 flex-shrink-0 p-4 bg-gray-900/50 rounded-lg">
                <div className="col-span-8 space-y-3">
                    <div className="relative"><MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search features..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 rounded-md pl-9 pr-2 py-1.5 text-sm" /></div>
                    <div><h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Filter by Category</h4><div className="flex flex-wrap gap-2">{categories.map(cat => <button key={cat} onClick={() => setActiveFilters(f => ({...f, category: cat}))} className={`px-2 py-1 text-xs rounded-md ${activeFilters.category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{cat}</button>)}</div></div>
                    <div><h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Filter by Status</h4><div className="flex flex-wrap gap-2"><button onClick={() => setActiveFilters(f => ({...f, status: 'all'}))} className={`px-2 py-1 text-xs rounded-md ${activeFilters.status === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>all</button>{statusOptions.map(opt => <button key={opt} onClick={() => setActiveFilters(f => ({...f, status: opt}))} className={`px-2 py-1 text-xs rounded-md ${activeFilters.status === opt ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{opt}</button>)}</div></div>
                </div>
                <div className="col-span-4 h-48">
                    {pieChartData.length > 0 && <ResponsivePie data={pieChartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }} innerRadius={0.6} padAngle={2} cornerRadius={3} activeOuterRadiusOffset={8} borderWidth={1} borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }} enableArcLinkLabels={false} arcLabelsSkipAngle={15} arcLabelsTextColor="#fff" colors={{ datum: 'data.color' }} theme={{ tooltip: { container: { background: '#1f2937' } } }} />}
                </div>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center"><p>Loading features...</p></div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {filteredFeatures.length > 0 ? (
                        filteredFeatures.map(feature => (
                           <FeatureItem key={feature.id} feature={feature} onEdit={() => handleOpenForm(feature)} onDelete={() => handleDeleteFeature(feature.id)} />
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500"><p>No features match the current filters.</p></div>
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