"use client";

import React from 'react';
import type { Prompt } from '@/lib/types';
import { EditIcon, TrashIcon } from '../Icons';

interface PromptListProps {
    prompts: Prompt[];
    onEdit: (prompt: Prompt) => void;
    onDelete: (id: string) => void;
}

export const PromptList = ({ prompts, onEdit, onDelete }: PromptListProps) => {
    return (
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {prompts.length > 0 ? prompts.map(prompt => (
                <div key={prompt.id} className={`bg-gray-800/50 p-4 rounded-lg border-l-4 ${prompt.type === 'chain' ? 'border-indigo-500' : 'border-gray-700'}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-200 break-words">{prompt.name}</h4>
                            {prompt.type === 'chain' && <span className="text-xs text-indigo-400 font-semibold">WORKFLOW</span>}
                        </div>
                        <div className="flex gap-1 flex-shrink-0 ml-4">
                            <button onClick={() => onEdit(prompt)} title="Edit this prompt" className="p-2 rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                            <button onClick={() => onDelete(prompt.id)} title="Delete this prompt" className="p-2 rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-400 font-mono bg-gray-900 p-2 rounded-md whitespace-pre-wrap max-h-24 overflow-y-auto">{prompt.content}</p>
                </div>
            )) : <p className="text-center text-gray-400 py-8">No prompts found for this filter.</p>}
        </div>
    );
};