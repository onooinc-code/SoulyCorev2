"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Segment } from '@/lib/types';
// FIX: Corrected relative import for useConversation.
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
                             {formErrors.type && <p className="text-xs text