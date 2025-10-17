
"use client";

import React, { useMemo } from 'react';
import type { Prompt } from '@/lib/types';
import { PlusIcon } from '../Icons';

interface PromptFilterSidebarProps {
    prompts: Prompt[];
    activeFilter: { type: string; value: string | null };
    setActiveFilter: (filter: { type: string; value: string | null }) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onAddPrompt: () => void;
}

export const PromptFilterSidebar = ({
    prompts,
    activeFilter,
    setActiveFilter,
    searchTerm,
    setSearchTerm,
    onAddPrompt
}: PromptFilterSidebarProps) => {

    const folders = useMemo(() => {
        const folderSet = new Set(prompts.flatMap(p => p.folder ? [p.folder] : []));
        return Array.from(folderSet).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }));
    }, [prompts]);

    const tags = useMemo(() => {
        const tagSet = new Set(prompts.flatMap(p => p.tags || []));
        return Array.from(tagSet).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }));
    }, [prompts]);

    return (
        <div className="w-1/4 bg-gray-800/50 rounded-lg p-3 flex-shrink-0 flex flex-col overflow-y-auto">
            <button onClick={onAddPrompt} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm mb-4" title="Add a new reusable prompt.">
                <PlusIcon className="w-5 h-5" /> Add Prompt
            </button>
            <input type="text" placeholder="Search all prompts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full mb-4 px-3 py-2 bg-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            
            <button onClick={() => setActiveFilter({ type: 'all', value: null })} className={`w-full text-left px-3 py-2 text-sm rounded-md mb-2 ${activeFilter.type === 'all' ? 'bg-gray-700 font-semibold' : 'hover:bg-gray-700/50'}`}>All Prompts</button>
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Folders</h3>
                <ul className="space-y-1">{folders.map(folder => <li key={folder}><button onClick={() => setActiveFilter({ type: 'folder', value: folder })} className={`w-full text-left px-3 py-1.5 text-sm rounded-md truncate ${activeFilter.type === 'folder' && activeFilter.value === folder ? 'bg-gray-700 font-semibold' : 'hover:bg-gray-700/50'}`}>{folder}</button></li>)}</ul>
            </div>
            <div className="mt-4"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Tags</h3><div className="flex flex-wrap gap-2 px-3">{tags.map(tag => <button key={tag} onClick={() => setActiveFilter({ type: 'tag', value: tag })} className={`px-2 py-0.5 text-xs rounded-full ${activeFilter.type === 'tag' && activeFilter.value === tag ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-600 hover:bg-gray-500'}`}>#{tag}</button>)}</div></div>
        </div>
    );
};
