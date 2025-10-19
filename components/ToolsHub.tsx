// components/ToolsHub.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tool } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { useAppContext } from '@/components/providers/AppProvider';
import { PlusIcon, TrashIcon, EditIcon, XIcon } from '@/components/Icons';

// FIX: Create a specific type for the form state to handle schema_json as a string.
type ToolFormState = Omit<Partial<Tool>, 'schema_json'> & { schema_json: string };

const ToolsHub = () => {
    const { log } = useLog();
    const { setStatus, clearError } = useAppContext();
    const [tools, setTools] = useState<Tool[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    // FIX: Use the new ToolFormState for the component's state.
    const [currentTool, setCurrentTool] = useState<ToolFormState | null>(null);
    const [jsonError, setJsonError] = useState<string | null>(null);

    const fetchTools = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/tools');
            if (!res.ok) throw new Error("Failed to fetch tools");
            const data = await res.json();
            setTools(data);
        } catch (error) {
            log('Error fetching tools', { error }, 'error');
            setStatus({ error: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [log, setStatus]);

    useEffect(() => {
        fetchTools();
    }, [fetchTools]);

    // FIX: Update function signature and logic to use the new ToolFormState.
    const handleOpenForm = (tool: Tool | null = null) => {
        const action = tool ? 'edit' : 'new';
        log(`User opened tool form for ${action} tool.`, { toolId: tool?.id });

        let toolForForm: ToolFormState;
        if (tool) {
            toolForForm = { 
                ...tool,
                schema_json: JSON.stringify(tool.schema_json, null, 2)
            };
        } else {
            toolForForm = {
                name: '',
                description: '',
                schema_json: JSON.stringify({
                    "type": "OBJECT",
                    "properties": {
                        "query": { "type": "STRING", "description": "The search query." }
                    },
                    "required": ["query"]
                }, null, 2)
            };
        }
        setCurrentTool(toolForForm);
        setJsonError(null);
        setIsFormOpen(true);
    };

    const handleSaveTool = async () => {
        if (!currentTool || !currentTool.name) return;

        try {
            // FIX: Validate the schema_json string, which is now the correct type in state.
            if (currentTool.schema_json) JSON.parse(currentTool.schema_json);
            setJsonError(null);
        } catch (e) {
            setJsonError('Invalid JSON format in schema.');
            log('Tool save failed due to invalid JSON.', { error: (e as Error).message }, 'error');
            return;
        }

        clearError();
        const isUpdating = !!currentTool.id;
        const action = isUpdating ? 'Updating' : 'Creating';
        log(`${action} tool...`, { toolData: currentTool });

        const url = isUpdating ? `/api/tools/${currentTool.id}` : '/api/tools';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentTool),
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="font-semibold text-lg">{currentTool?.id ? 'Edit Tool' : 'New Tool'}</h3>
                    <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <input value={currentTool?.name || ''} onChange={e => setCurrentTool(t => t ? {...t, name: e.target.value} : null)} placeholder="Tool Name (e.g., 'web_search')" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                    <textarea value={currentTool?.description || ''} onChange={e => setCurrentTool(t => t ? {...t, description: e.target.value} : null)} placeholder="Tool Description" className="w-full p-2 bg-gray-700 rounded-lg text-sm" rows={3}></textarea>
                     <div>
                        <label className="text-xs text-gray-400">Tool Schema (OpenAPI/JSON format for Gemini Function Calling)</label>
                        <textarea 
                            // FIX: Correctly bind to the string-based schema_json in the form state.
                            value={currentTool?.schema_json || ''} 
                            // FIX: Update the state with the new string value from the textarea.
                            onChange={e => setCurrentTool(t => t ? {...t, schema_json: e.target.value} : null)} 
                            className={`w-full p-2 bg-gray-700 rounded-lg text-sm font-mono ${jsonError ? 'border border-red-500' : ''}`}
                            rows={8}
                        ></textarea>
                         {jsonError && <p className="text-xs text-red-400 mt-1">{jsonError}</p>}
                    </div>
                </div>
                <div className="flex gap-2 p-4 border-t border-gray-700">
                    <button onClick={handleSaveTool} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save Tool</button>
                    <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                </div>
            </motion.div>
        </motion.div>
    );

    return (
        <div className="w-full h-full flex flex-col p-6 bg-gray-900">
            <header className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold">Tools Hub</h2>
                <button onClick={() => handleOpenForm()} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm">
                    <PlusIcon className="w-5 h-5" /> Add Tool
                </button>
            </header>
            
            <main className="flex-1 overflow-y-auto pr-2 space-y-3">
                {isLoading ? (
                    <p className="text-center text-gray-400 py-8">Loading tools...</p>
                ) : tools.length > 0 ? (
                    tools.map(tool => (
                        <motion.div
                            key={tool.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-800 p-4 rounded-lg"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-200">{tool.name}</h4>
                                    <p className="text-sm text-gray-400 mt-1">{tool.description}</p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0 ml-4">
                                    <button onClick={() => handleOpenForm(tool)} title="Edit tool" className="p-2 text-gray-400 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDeleteTool(tool.id)} title="Delete tool" className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                     <div className="text-center py-16 text-gray-500">
                        <h3 className="text-lg font-semibold">No Tools Defined</h3>
                        <p>Add a tool to define a new capability for your agent.</p>
                    </div>
                )}
            </main>

            <AnimatePresence>
                {isFormOpen && currentTool && renderForm()}
            </AnimatePresence>
        </div>
    );
};

export default ToolsHub;