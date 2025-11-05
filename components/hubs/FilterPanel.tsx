"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, TrashIcon } from '../Icons';
import { SavedFilterSet } from '@/lib/types';

interface FilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    filters: any;
    onFilterChange: (filters: any) => void;
    savedFilters: SavedFilterSet[];
    onSave: (name: string) => void;
    onLoad: (filterSet: SavedFilterSet) => void;
    onDelete: (id: string) => void;
}

const FilterPanel = ({ isOpen, onClose, filters, onFilterChange, savedFilters, onSave, onLoad, onDelete }: FilterPanelProps) => {

    const handleInputChange = (field: string, value: string) => {
        onFilterChange({ ...filters, [field]: value });
    };
    
    const handleSaveClick = () => {
        const name = prompt("Enter a name for this filter preset:");
        if (name) {
            onSave(name);
        }
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 z-40"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: '0%' }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="absolute top-0 right-0 h-full w-full max-w-sm bg-gray-800 border-l border-gray-700 shadow-2xl p-6 flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Advanced Filters</h3>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4">
                             <div>
                                <label className="text-sm font-medium text-gray-400">Created At</label>
                                <div className="flex gap-2 mt-1">
                                    <input type="date" value={filters.createdAtStart} onChange={e => handleInputChange('createdAtStart', e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                                    <input type="date" value={filters.createdAtEnd} onChange={e => handleInputChange('createdAtEnd', e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                                </div>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-gray-400">Last Accessed</label>
                                <div className="flex gap-2 mt-1">
                                    <input type="date" value={filters.lastAccessedStart} onChange={e => handleInputChange('lastAccessedStart', e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                                    <input type="date" value={filters.lastAccessedEnd} onChange={e => handleInputChange('lastAccessedEnd', e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-400">Tags</label>
                                <input type="text" value={filters.tags} onChange={e => handleInputChange('tags', e.target.value)} placeholder="e.g., project, person" className="w-full mt-1 p-2 bg-gray-700 rounded-lg text-sm" />
                                <p className="text-xs text-gray-500 mt-1">Enter tags separated by commas.</p>
                            </div>
                        </div>
                        
                        <div className="mt-8 border-t border-gray-700 pt-6">
                            <h4 className="text-lg font-semibold mb-3">Saved Filters</h4>
                            <div className="space-y-2">
                                {savedFilters.map(sf => (
                                    <div key={sf.id} className="flex justify-between items-center p-2 bg-gray-700/50 rounded-md">
                                        <span className="text-sm">{sf.name}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => onLoad(sf)} className="px-2 py-1 text-xs bg-blue-600 rounded-md">Load</button>
                                            <button onClick={() => onDelete(sf.id)} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleSaveClick} className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-500">
                                Save Current Filters
                            </button>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FilterPanel;
