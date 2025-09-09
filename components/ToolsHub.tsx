
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Tool } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, EditIcon } from './Icons';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useLog } from './providers/LogProvider';

const ToolsHub = () => {
    const { setStatus, clearError } = useConversation();
    const { log } = useLog();
    const [tools, setTools] = useState<Tool[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentTool, setCurrentTool] = useState<(Omit<Partial<Tool>, 'schema_json'> & { schema_json: string }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [jsonError, setJsonError] = useState<string | null>(null);

    const fetchTools = useCallback(async () => {
        setIsLoading(true);
        clearError();
        log('Fetching all tools...');
        try {
            const res = await fetch('/api/tools');
            if (!res.ok) throw new Error('Failed to fetch tools');
            const data = await res.json();
            setTools(data);
            log(`Successfully fetched ${data.length} tools.`);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log('Failed to fetch tools.', { error: { message: errorMessage } }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [setStatus, clearError, log]);

    useEffect(() => {
        fetchTools();
    }, [fetchTools]);

    const handleOpenForm = (tool: Tool | null = null) => {
        const action = tool ? 'edit' : 'new';
        log(`User opened tool form for ${action} tool.`, { toolId: tool?.id });
        
        let toolForForm: (Omit<Partial<Tool>, 'schema_json'> & { schema_json: string });
        if (tool) {
            toolForForm = { ...tool, schema_json: JSON.stringify(tool.schema_json, null, 2) };
        } else {
            toolForForm = { name: '', description: '', schema_json: JSON.stringify({ type: 'object', properties: {}, required: [] }, null, 2) };
        }
        setCurrentTool(toolForForm);
        setJsonError(null);
        setIsFormOpen(true);
    };
    
    const handleSaveTool = async () => {
        if (!currentTool || !currentTool.name) return;
        
        try {
            JSON.parse(currentTool.schema_json);
            setJsonError(null);
        } catch (e) {
            setJsonError('Invalid JSON format in schema.');
            log('Tool save failed due to invalid JSON.', { error: (e as Error).message }, 'error');
            return;
        }

        clearError();
        const isUpdating = !!currentTool.id;
        const action = isUpdating ? 'Updating' : 'Creating';
        log(`${action} tool...`, { toolData: { ...currentTool, schema_json: 'OMITTED' } });

        const url = isUpdating ? `/api/tools/${currentTool.id}` : '/api/tools';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentTool), // API expects a stringified JSON in schema_json
            });
            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(errorData.error || `Failed to ${isUpdating ? 'update' : 'create'} tool`);
            }
            
            await fetchTools();
            setIsFormOpen(false);
            setCurrentTool(null);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log(`Failed to ${action.toLowerCase()} tool.`, { error: { message: errorMessage } }, 'error');
        }
    };
    
    const handleDeleteTool = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this tool?')) {
            clearError();
            log(`Attempting to delete tool with ID: ${id}`);
            try {
                const res = await fetch(`/api/tools/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete tool');
                log('Tool deleted successfully.', { id });
                await fetchTools();
            } catch (error) {
                 const errorMessage = (error as Error).message;
                setStatus({ error: errorMessage });
                log('Failed to delete tool.', { id, error: { message: errorMessage } }, 'error');
            }
        }
    };
    
    const renderForm = () => (
         <div className="bg-gray-800 p-4 rounded-lg mb-4 space-y-4">
            <h3 className="font-semibold text-lg">{currentTool?.id ? 'Edit Tool' : 'New Tool'}</h3>
            <div>
                <label htmlFor="toolName" className="block text-sm font-medium text-gray-400 mb-1">Tool Name</label>
                <input id="toolName" value={currentTool?.name || ''} onChange={e => setCurrentTool(t => t ? {...t, name: e.target.value} : null)} placeholder="e.g., 'web_search'" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
            </div>
             <div>
                <label htmlFor="toolDesc" className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea id="toolDesc" value={currentTool?.description || ''} onChange={e => setCurrentTool(t => t ? {...t, description: e.target.value} : null)} placeholder="A short description of what this tool does." className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
            </div>
            <div>
                 <label htmlFor="toolSchema" className="block text-sm font-medium text-gray-400 mb-1">Input/Output Schema (JSON)</label>
                 <textarea id="toolSchema" value={currentTool?.schema_json || ''} onChange={e => setCurrentTool(t => t ? {...t, schema_json: e.target.value} : null)} className={`w-full p-2 bg-gray-700 rounded-lg text-sm font-mono ${jsonError ? 'border border-red-500' : ''}`} rows={8}></textarea>
                {jsonError && <p className="text-xs text-red-400 mt-1">{jsonError}</p>}
            </div>
            <div className="flex gap-2">
                <button onClick={handleSaveTool} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save Tool</button>
                <button onClick={() => { setIsFormOpen(false); setCurrentTool(null); }} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-900 w-full h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold">Tools Hub (Procedural Memory)</h2>
                <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm" title="Add a new tool for the agent.">
                    <PlusIcon className="w-5 h-5" /> Add Tool
                </button>
            </div>

            <AnimatePresence>
                {isFormOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden flex-shrink-0">
                        {renderForm()}
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="flex-1 overflow-y-auto pr-2">
                 {isLoading ? (
                    <div className="flex-1 flex items-center justify-center"><p>Loading tools...</p></div>
                ) : (
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-800 sticky top-0">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Description</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tools.map(tool => (
                                <tr key={tool.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3 font-medium font-mono text-indigo-300">{tool.name}</td>
                                    <td className="p-3">{tool.description}</td>
                                    <td className="p-3">
                                        <div className="flex gap-4">
                                            <button onClick={() => handleOpenForm(tool)} title="Edit this tool."><EditIcon className="w-5 h-5 text-gray-400 hover:text-blue-400"/></button>
                                            <button onClick={() => handleDeleteTool(tool.id)} title="Delete this tool."><TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-500"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!isLoading && tools.length === 0 && (
                     <div className="text-center py-8 text-gray-500">
                        <p>No tools defined. Add one to give the agent new capabilities.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToolsHub;
