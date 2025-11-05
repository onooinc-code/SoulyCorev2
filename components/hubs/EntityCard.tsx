"use client";

import React from 'react';
import { motion } from 'framer-motion';
import type { EntityDefinition } from '@/lib/types';
import { EditIcon, TrashIcon } from '@/components/Icons';

interface EntityCardProps {
    entity: EntityDefinition;
    isSelected: boolean;
    onToggleSelection: () => void;
    onEdit: () => void;
    onDelete: () => void;
    displaySettings: {
        showDescription: boolean;
        showAliases: boolean;
        showTags: boolean;
    };
    onClick: () => void; // For opening detail panel
}

const EntityCard: React.FC<EntityCardProps> = ({ entity, isSelected, onToggleSelection, onEdit, onDelete, displaySettings, onClick }) => (
    <motion.div 
        layout 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        onClick={onClick}
        className={`p-4 rounded-lg border transition-colors cursor-pointer ${isSelected ? 'bg-indigo-900/50 border-indigo-600' : 'bg-gray-700/50 border-gray-700 hover:border-gray-600'}`}
    >
        <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
                <input type="checkbox" checked={isSelected} onChange={(e) => { e.stopPropagation(); onToggleSelection(); }} className="mt-1 bg-gray-800 border-gray-600 rounded" />
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-100">{entity.name}</h4>
                    <p className="text-xs text-indigo-300 font-mono">{entity.type}</p>
                </div>
            </div>
            <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit" className="p-1 text-gray-400 hover:text-white"><EditIcon className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete" className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
            </div>
        </div>
        {displaySettings.showDescription && entity.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{entity.description}</p>}
        {displaySettings.showAliases && Array.isArray(entity.aliases) && entity.aliases.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
                {entity.aliases.map(alias => (
                    <span key={alias} className="text-xs bg-gray-600 px-2 py-0.5 rounded-full">{alias}</span>
                ))}
            </div>
        )}
        {displaySettings.showTags && Array.isArray(entity.tags) && entity.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
                 {entity.tags.map(tag => (
                    <span key={tag} className="text-xs bg-purple-800/50 text-purple-300 px-2 py-0.5 rounded-full">#{tag}</span>
                ))}
            </div>
        )}
    </motion.div>
);

export default EntityCard;