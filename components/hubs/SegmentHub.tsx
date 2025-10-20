"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Segment } from '@/lib/types';
import { useConversation } from '@/components/providers/ConversationProvider';
import { XIcon, TrashIcon, PlusIcon, EditIcon, SearchIcon } from '@/components/Icons';
import { useLog } from '@/components/providers/LogProvider';

const SegmentHub = () => {
    const { setStatus, clearError } = useConversation();
    const { log } = useLog();
    
    const [segments, setSegments] = useState<Segment[]>([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [segmentForm, setSegmentForm] = useState<Partial<Segment>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const fetchSegments = useCallback(async () => {
        log('Fetching segments for Segment Hub...');
        try {
            const res = await fetch('/api/segments');
            if (!res.ok) throw new Error('Failed to fetch segments');
            const data = await res.json();
            setSegments(data.segments);
            log(`Successfully fetched ${data.segments.length} segments.`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to fetch segments.', { error: { message: errorMessage } }, 'error');
        }
    }, [log, setStatus]);

    useEffect(() => {
        fetchSegments();
    }, [fetchSegments]);
    
    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!segmentForm.name?.trim()) errors.name = "Name is required.";
        if (!segmentForm.type?.trim()) errors.type = "Type is required.";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };
    
    const handleOpenForm = (segment: Segment | null = null) => {
        setSegmentForm(segment || { type: 'Topic' });
        setIsFormVisible(true);
    };

    const handleSaveSegment = async () => {
        if (!validateForm()) return;
        
        clearError();
        const isUpdating = !!segmentForm.id;
        const url = isUpdating ? `/api/segments/${segmentForm.id}` : '/api/segments';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(segmentForm),
            });
            if (!res.ok) throw new Error(`Failed to ${isUpdating ? 'update' : 'create'} segment`);

            await fetchSegments();
            setIsFormVisible(false);
            setSegmentForm({});
        } catch (error) {
            setStatus({ error: (error as Error).message });
        }
    };
    
    const handleDeleteSegment = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this segment?")) return;
        try {
            const res = await fetch(`/api/segments/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete segment');
            await fetchSegments();
        } catch (error) {
             setStatus({ error: (error as Error).message });
        }
    };

    return (
        <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Manage Segments</h3>
                <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm" title="Define a new segment for categorizing conversations.">
                    <PlusIcon className="w-5 h-5" /> Add Segment
                </button>
            </div>
            {isFormVisible && (
                <div className="bg-gray-900/50 p-4 rounded-lg mb-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <input value={segmentForm.name || ''} onChange={e => setSegmentForm({...segmentForm, name: e.target.value})} placeholder="Segment Name (e.g., Project Alpha)" className={`w-full p-2 bg-gray-700 rounded-lg text-sm ${formErrors.name ? 'border border-red-500' : ''}`}/>
                            {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                        </div>
                        <div>
                             <select value={segmentForm.type || 'Topic'} onChange={e => setSegmentForm({...segmentForm, type: e.target.value as 'Topic' | 'Impact'})} className={`w-full p-2 bg-gray-700 rounded-lg text-sm ${formErrors.type ? 'border border-red-500' : ''}`}>
                                <option value="Topic">Topic</option>
                                <option value="Impact">Impact</option>
                             </select>
                             {formErrors.type && <p className="text-xs text-red-400 mt-1">{formErrors.type}</p>}
                        </div>
                    </div>
                     <div>
                        <textarea value={segmentForm.description || ''} onChange={e => setSegmentForm({...segmentForm, description: e.target.value})} placeholder='Description' className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={2}></textarea>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSaveSegment} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save</button>
                        <button onClick={() => { setIsFormVisible(false); setSegmentForm({}); setFormErrors({}); }} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                    </div>
                </div>
            )}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-900 sticky top-0">
                        <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Description</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {segments.map(segment => (
                            <tr key={segment.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-3 font-medium">{segment.name}</td>
                                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${segment.type === 'Topic' ? 'bg-blue-600' : 'bg-purple-600'}`}>{segment.type}</span></td>
                                <td className="p-3 text-gray-400 text-xs">{segment.description}</td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenForm(segment)} title="Edit this segment's details." className="p-2 rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteSegment(segment.id)} title="Delete this segment." className="p-2 rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {segments.length === 0 && <p className="text-center text-gray-500 py-8">No segments found.</p>}
            </div>
        </div>
    );
};

export default SegmentHub;