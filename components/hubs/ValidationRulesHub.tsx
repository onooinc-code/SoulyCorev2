"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { EntityTypeValidationRules, ValidationRule } from '@/lib/types';
import { useNotification } from '@/lib/hooks/use-notifications';
import { XIcon, TrashIcon, PlusIcon, EditIcon } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

const ValidationRulesHub = () => {
    const [rules, setRules] = useState<EntityTypeValidationRules[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentRule, setCurrentRule] = useState<Partial<EntityTypeValidationRules> & { rulesJson_str?: string } | null>(null);
    const { addNotification } = useNotification();

    const fetchRules = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/validation-rules');
            if (!res.ok) throw new Error('Failed to fetch validation rules');
            const data = await res.json();
            setRules(data);
        } catch (error) {
            addNotification({ type: 'error', title: 'Error', message: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    const handleOpenForm = (rule: EntityTypeValidationRules | null = null) => {
        if (rule) {
            setCurrentRule({ ...rule, rulesJson_str: JSON.stringify(rule.rulesJson, null, 2) });
        } else {
            setCurrentRule({ entityType: '', rulesJson_str: '[\n  {\n    "field": "name",\n    "rule": "unique_across_types",\n    "params": ["Project"],\n    "errorMessage": "A Project with this name already exists."\n  }\n]' });
        }
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        if (!currentRule?.entityType || !currentRule.rulesJson_str) {
            addNotification({ type: 'warning', title: 'Entity Type and Rules JSON are required.' });
            return;
        }

        let parsedRules;
        try {
            parsedRules = JSON.parse(currentRule.rulesJson_str);
        } catch (e) {
            addNotification({ type: 'error', title: 'Invalid JSON', message: 'The Rules JSON is not valid.' });
            return;
        }

        const payload = { ...currentRule, rulesJson: parsedRules };
        delete payload.rulesJson_str;
        
        const isUpdating = !!payload.id;
        const url = isUpdating ? `/api/validation-rules/${payload.entityType}` : '/api/validation-rules';
        const method = 'POST'; // Using POST for upsert

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save rule');
            }
            addNotification({ type: 'success', title: 'Success', message: 'Validation rule saved.' });
            fetchRules();
            setIsFormOpen(false);
        } catch (error) {
            addNotification({ type: 'error', title: 'Save Failed', message: (error as Error).message });
        }
    };

    const handleDelete = async (entityType: string) => {
        if (!window.confirm(`Are you sure you want to delete the validation rule for type "${entityType}"?`)) return;
        try {
            const res = await fetch(`/api/validation-rules/${entityType}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete rule');
            addNotification({ type: 'success', title: 'Rule Deleted' });
            fetchRules();
        } catch (error) {
            addNotification({ type: 'error', title: 'Delete Failed', message: (error as Error).message });
        }
    };

    return (
        <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Validation Rules</h3>
                <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm">
                    <PlusIcon className="w-5 h-5" /> Add Rule
                </button>
            </div>
            {isFormOpen && currentRule && (
                <div className="bg-gray-900/50 p-4 rounded-lg mb-4 space-y-3">
                    <input value={currentRule.entityType || ''} onChange={e => setCurrentRule({ ...currentRule, entityType: e.target.value })} placeholder="Entity Type (e.g., Person)" className="w-full p-2 bg-gray-700 rounded-lg text-sm" />
                    <textarea value={currentRule.rulesJson_str || ''} onChange={e => setCurrentRule({ ...currentRule, rulesJson_str: e.target.value })} className="w-full p-2 bg-gray-700 rounded-lg text-sm font-mono" rows={8}></textarea>
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 rounded-md text-sm">Save</button>
                        <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-gray-600 rounded-md text-sm">Cancel</button>
                    </div>
                </div>
            )}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-900 sticky top-0">
                        <tr>
                            <th className="p-3">Entity Type</th>
                            <th className="p-3">Rules Defined</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map(rule => (
                            <tr key={rule.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-3 font-medium font-mono">{rule.entityType}</td>
                                <td className="p-3">{rule.rulesJson.length} rule(s)</td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenForm(rule)}><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(rule.entityType)}><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ValidationRulesHub;