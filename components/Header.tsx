
"use client";

import React, { useState, useEffect } from 'react';
import { useConversation } from './providers/ConversationProvider';
import { SparklesIcon, EditIcon } from './Icons';

const Header = () => {
    const { currentConversation, generateConversationTitle, updateConversationTitle } = useConversation();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');

    useEffect(() => {
        if (currentConversation) {
            setTitle(currentConversation.title);
        }
    }, [currentConversation]);

    if (!currentConversation) {
        return (
             <div className="flex-shrink-0 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 p-4 h-[65px]">
                 {/* Placeholder for when no conversation is selected */}
            </div>
        );
    }
    
    const handleGenerateTitle = (e: React.MouseEvent) => {
        e.stopPropagation();
        generateConversationTitle(currentConversation.id);
    };

    const handleEdit = () => {
        setTitle(currentConversation.title);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (title.trim()) {
            updateConversationTitle(currentConversation.id, title.trim());
        }
        setIsEditing(false);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
        }
    };

    return (
        <div className="flex-shrink-0 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 p-4 h-[65px]">
            <div className="flex items-center justify-center max-w-4xl mx-auto h-full relative group">
                {isEditing ? (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="text-lg font-semibold text-gray-200 truncate bg-transparent border-b-2 border-indigo-500 focus:outline-none text-center"
                        autoFocus
                    />
                ) : (
                    <h1 className="text-lg font-semibold text-gray-200 truncate px-4">
                        {currentConversation.title}
                    </h1>
                )}
                 <div className="flex items-center gap-1 ml-2 absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={handleGenerateTitle} className="p-1.5 text-gray-300 hover:text-indigo-400" title="Generate new title"><SparklesIcon className="w-4 h-4" /></button>
                    <button onClick={handleEdit} className="p-1.5 text-gray-300 hover:text-blue-400" title="Rename"><EditIcon className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
};

export default Header;
