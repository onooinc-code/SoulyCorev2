"use client";

// components/dashboard/panels/QuickNotesPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import DashboardPanel from '../DashboardPanel';
import { useLog } from '../../providers/LogProvider';
import { useNotification } from '@/lib/hooks/use-notifications';

const LOCAL_STORAGE_KEY = 'dashboard:quick-note:backup';

const QuickNotesPanel = () => {
    const [note, setNote] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved'>('loading');
    const { log } = useLog();
    const { addNotification } = useNotification();

    const fetchNote = useCallback(async () => {
        setStatus('loading');
        try {
            const res = await fetch('/api/dashboard/quick-note');
            if (res.ok) {
                const data = await res.json();
                const serverNote = data.note || '';
                setNote(serverNote);
                localStorage.setItem(LOCAL_STORAGE_KEY, serverNote);
            } else {
                 throw new Error('Failed to fetch note from server');
            }
        } catch (error) {
            log('Error fetching quick note', { error }, 'error');
            addNotification({ type: 'warning', title: 'Could not sync note', message: 'Using local version.' });
            const localNote = localStorage.getItem(LOCAL_STORAGE_KEY);
            setNote(localNote || '');
        } finally {
            setStatus('idle');
        }
    }, [log, addNotification]);

    useEffect(() => {
        // Load from local storage first for instant display, then fetch to sync.
        const localNote = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localNote) {
            setNote(localNote);
        }
        fetchNote();
    }, [fetchNote]);

    const handleSave = async () => {
        setStatus('saving');
        // Save to local storage immediately for responsiveness
        localStorage.setItem(LOCAL_STORAGE_KEY, note);
        try {
            const res = await fetch('/api/dashboard/quick-note', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note }),
            });
            if (!res.ok) throw new Error('Failed to save note');
            setStatus('saved');
            addNotification({ type: 'success', title: 'Note Saved & Synced' });
            setTimeout(() => setStatus('idle'), 2000);
        } catch (error) {
            log('Error saving quick note', { error }, 'error');
            addNotification({ type: 'error', title: 'Save Failed', message: 'Note saved locally but failed to sync.' });
            setStatus('idle');
        }
    };
    
    const getButtonText = () => {
        switch (status) {
            case 'saving': return 'Saving...';
            case 'saved': return 'Saved!';
            default: return 'Save Note';
        }
    }

    return (
        <DashboardPanel title="Quick Notes">
            <div className="flex flex-col h-full">
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={status === 'loading' ? 'Loading note...' : "Jot down a quick note..."}
                    className="w-full flex-1 bg-gray-900/50 text-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    disabled={status === 'loading'}
                />
                <button 
                    onClick={handleSave}
                    disabled={status !== 'idle' || !note.trim()}
                    className={`mt-2 w-full text-center py-2 text-xs rounded-md font-semibold transition-colors disabled:opacity-50
                        ${status === 'saved' 
                            ? 'bg-green-600' 
                            : 'bg-indigo-600/50 hover:bg-indigo-600/80'
                        }`}
                >
                    {getButtonText()}
                </button>
            </div>
        </DashboardPanel>
    );
};

export default QuickNotesPanel;
