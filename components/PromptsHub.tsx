
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Prompt, PromptChainStep } from '@/lib/types';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { XIcon, PlusIcon, TrashIcon, EditIcon, MenuIcon, UserCircleIcon, ArrowDownOnSquareIcon, WarningIcon } from './Icons';
import { useConversation } from '@/components/providers/ConversationProvider';
import { useLog } from './providers/LogProvider';

const PromptsHub = () => {
    const { setStatus, clearError } = useConversation();
    const { log } = useLog();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [currentPrompt, setCurrentPrompt] = useState<Partial<Prompt> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<{ type: 'all' | 'folder' | 'tag'; value: string | null }>({ type: 'all', value: null });

    const singlePrompts = useMemo(() => prompts.filter(p => p.type === 'single'), [prompts]);

    const fetchPrompts = useCallback(async () => {
        clearError();
        log('Fetching all prompts...');
        setIsLoading(true);
        try {
            const res = await fetch('/api/prompts');
            if (!res.ok) throw new Error('Failed to fetch prompts');
            const data = await res.json();
            setPrompts(data);
            log(`Successfully fetched ${data.length} prompts.`);
        } catch (error) {
            const errorMessage = 'Could not load prompts.';
            setStatus({ error: errorMessage });
            log(errorMessage, { error: { message: (error as Error).message } }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [setStatus, clearError, log]);

    useEffect(() => {
        fetchPrompts();
    }, [fetchPrompts]);

    const handleOpenForm = (prompt: Partial<Prompt> | null = null) => {
        // This condition should only apply for toggling an existing prompt's edit form.
        if (prompt && currentPrompt?.id === prompt.id) {
            setCurrentPrompt(null);
            return;
        }
    
        const action = prompt ? 'edit' : 'new';
        log(`User opened prompt form for ${action} prompt.`, { promptId: prompt?.id });
        // Initialize with empty chain_definition for new prompts for robustness
        setCurrentPrompt(prompt || { type: 'single', name: '', content: '', chain_definition: [] });
    };

    const handleSavePrompt = async () => {
        if (!currentPrompt || !currentPrompt.name || (currentPrompt.type === 'single' && !currentPrompt.content)) {
             setStatus({ error: 'Name and Content are required for a single prompt.' });
             return;
        }
        if (currentPrompt.type === 'chain' && (!currentPrompt.chain_definition || currentPrompt.chain_definition.length === 0)) {
            setStatus({ error: 'A workflow must have at least one step.' });
            return;
        }
        
        clearError();
        const isUpdating = !!currentPrompt.id;
        const action = isUpdating ? 'Updating' : 'Creating';
        log(`${action} prompt...`, { promptData: currentPrompt });

        // For chains, set a placeholder content
        const promptToSave = { ...currentPrompt };
        if (promptToSave.type === 'chain') {
            promptToSave.content = `This is a chained prompt with ${promptToSave.chain_definition?.length || 0} step(s).`;
        }


        const url = isUpdating ? `/api/prompts/${currentPrompt.id}` : '/api/prompts';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(promptToSave),
            });
            if (!res.ok) throw new Error(`Failed to ${isUpdating ? 'update' : 'create'} prompt`);
            
            await fetchPrompts();
            setCurrentPrompt(null);
        } catch (error) {
            const errorMessage = (error as Error).message;
            setStatus({ error: errorMessage });
            log(`Failed to ${action.toLowerCase()} prompt.`, { error: { message: errorMessage } }, 'error');
        }
    };

    const handleDeletePrompt = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this prompt?')) {
            clearError();
            log(`Attempting to delete prompt with ID: ${id}`);
            try {
                const res = await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete prompt');
                log('Prompt deleted successfully.', { id });
                if (currentPrompt?.id === id) setCurrentPrompt(null);
                await fetchPrompts();
            } catch (error) {
                const errorMessage = (error as Error).message;
                setStatus({ error: errorMessage });
                log('Failed to delete prompt.', { id, error: { message: errorMessage } }, 'error');
            }
        } else {
            log('User cancelled prompt deletion.', { id });
        }
    };

    const handleChainDefinitionChange = (newChain: PromptChainStep[]) => {
        setCurrentPrompt(p => p ? { ...p, chain_definition: newChain } : null);
    };

    const folders = useMemo(() => {
        const folderSet = new Set(prompts.flatMap(p => p.folder ? [p.folder] : []));
        return Array.from(folderSet).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }));
    }, [prompts]);

    const tags = useMemo(() => {
        const tagSet = new Set(prompts.flatMap(p => p.tags || []));
        return Array.from(tagSet).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }));
    }, [prompts]);
    
    const filteredPrompts = useMemo(() => {
        let filtered = prompts;

        if (activeFilter.type === 'folder') {
            filtered = filtered.filter(p => p.folder === activeFilter.value);
        } else if (activeFilter.type === 'tag') {
            filtered = filtered.filter(p => p.tags?.includes(activeFilter.value!));
        }
        
        if (searchTerm) {
            const lowercasedSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(prompt => 
                prompt.name.toLowerCase().includes(lowercasedSearch) ||
                prompt.content.toLowerCase().includes(lowercasedSearch)
            );
        }
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }, [prompts, searchTerm, activeFilter]);
    
    const renderPromptForm = () => (
        <div className="bg-gray-800 p-4 rounded-lg mb-4 space-y-3">
            <h3 className="font-semibold text-lg">{currentPrompt?.id ? 'Edit Prompt' : 'New Prompt'}</h3>
            <div className="flex items-center gap-4 text-sm">
                <span>Type:</span>
                <label className="flex items-center gap-2">
                    <input type="radio" value="single" checked={currentPrompt?.type === 'single'} onChange={() => setCurrentPrompt(p => p ? ({...p, type: 'single'}) : null)} />
                    Single
                </label>
                 <label className="flex items-center gap-2">
                    <input type="radio" value="chain" checked={currentPrompt?.type === 'chain'} onChange={() => setCurrentPrompt(p => p ? ({...p, type: 'chain', chain_definition: p?.chain_definition || [] }) : null)} />
                    Workflow (Chain)
                </label>
            </div>
            <input value={currentPrompt?.name || ''} onChange={e => setCurrentPrompt(p => p ? {...p, name: e.target.value} : null)} placeholder="Prompt Name (e.g., 'Meeting Summarizer')" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
            
            {currentPrompt?.type === 'single' ? (
                <textarea value={currentPrompt?.content || ''} onChange={e => setCurrentPrompt(p => p ? {...p, content: e.target.value} : null)} placeholder="Prompt Content..." className="w-full p-2 bg-gray-700 rounded-lg text-sm font-mono" rows={5}></textarea>
            ) : (
                <WorkflowBuilder 
                    chainDefinition={currentPrompt?.chain_definition || []}
                    onChainChange={handleChainDefinitionChange}
                    singlePrompts={singlePrompts}
                />
            )}
            
            <div className="flex gap-4">
                <input value={currentPrompt?.folder || ''} onChange={e => setCurrentPrompt(p => p ? {...p, folder: e.target.value} : null)} placeholder="Folder (Optional)" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
                <input value={currentPrompt?.tags?.join(', ') || ''} onChange={e => setCurrentPrompt(p => p ? {...p, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)} : null)} placeholder="Tags, comma-separated" className="w-full p-2 bg-gray-700 rounded-lg text-sm"/>
            </div>
            <div className="flex gap-2">
                <button onClick={handleSavePrompt} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-500">Save Prompt</button>
                <button onClick={() => setCurrentPrompt(null)} className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
            </div>
        </div>
    );
    
    return (
        <div className="bg-gray-900 w-full h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold">Prompts Hub</h2>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                <div className="w-1/4 bg-gray-800/50 rounded-lg p-3 flex-shrink-0 flex flex-col overflow-y-auto">
                     <button onClick={() => handleOpenForm()} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 text-sm mb-4" title="Add a new reusable prompt.">
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

                <div className="flex-1 flex flex-col overflow-hidden">
                     <AnimatePresence>{currentPrompt && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden flex-shrink-0">{renderPromptForm()}</motion.div>}</AnimatePresence>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {isLoading ? <p className="text-center text-gray-400 py-8">Loading prompts...</p>
                        : filteredPrompts.length > 0 ? filteredPrompts.map(prompt => (
                            <div key={prompt.id} className={`bg-gray-800/50 p-4 rounded-lg border-l-4 ${prompt.type === 'chain' ? 'border-indigo-500' : 'border-gray-700'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-200 break-words">{prompt.name}</h4>
                                        {prompt.type === 'chain' && <span className="text-xs text-indigo-400 font-semibold">WORKFLOW</span>}
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0 ml-4">
                                        <button onClick={() => handleOpenForm(prompt)} title="Edit this prompt" className="p-2 rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-blue-400"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeletePrompt(prompt.id)} title="Delete this prompt" className="p-2 rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-gray-400 font-mono bg-gray-900 p-2 rounded-md whitespace-pre-wrap max-h-24 overflow-y-auto">{prompt.content}</p>
                            </div>
                        )) : <p className="text-center text-gray-400 py-8">No prompts found for this filter.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- New Refactored Workflow Builder ---

const WorkflowStepCard = ({ step, onUpdate, onRemove, singlePrompts, availableInputSteps }: {
    step: PromptChainStep;
    onUpdate: (stepNumber: number, newStepData: Partial<PromptChainStep>) => void;
    onRemove: (stepNumber: number) => void;
    singlePrompts: Prompt[];
    availableInputSteps: number[];
}) => {
    const getPromptVariables = (promptId: string): string[] => {
        const prompt = singlePrompts.find(p => p.id === promptId);
        if (!prompt) return [];
        const variableRegex = /{{\s*(\w+)\s*}}/g;
        const matches = [...prompt.content.matchAll(variableRegex)];
        return [...new Set(matches.map(match => match[1]))];
    };

    const handlePromptSelection = (promptId: string) => {
        const variables = getPromptVariables(promptId);
        const newInputMapping = variables.reduce((acc, varName) => {
            acc[varName] = { source: 'userInput' };
            return acc;
        }, {} as Record<string, { source: 'userInput' | 'stepOutput'; step?: number }>);
        onUpdate(step.step, { promptId, inputMapping: newInputMapping });
    };

    const handleMappingChange = (varName: string, source: string, sourceStep?: number) => {
        const newMapping = { ...step.inputMapping };
        if (source === 'userInput') {
            newMapping[varName] = { source: 'userInput' };
        } else if (source === 'stepOutput' && sourceStep) {
            newMapping[varName] = { source: 'stepOutput', step: sourceStep };
        }
        onUpdate(step.step, { inputMapping: newMapping });
    };
    
    const selectedPromptName = singlePrompts.find(p => p.id === step.promptId)?.name || 'Select a prompt...';

    return (
        <div className="flex items-start gap-3">
            <div className="p-2 cursor-grab" title="Drag to reorder step"><MenuIcon className="w-5 h-5 text-gray-500" /></div>
            <div className="flex-1 bg-gray-700/50 p-3 rounded-md">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-indigo-400">Step {step.step}</span>
                    <button onClick={() => onRemove(step.step)} className="text-red-400 hover:text-red-300 text-xs font-semibold">REMOVE</button>
                </div>
                <select value={step.promptId} onChange={(e) => handlePromptSelection(e.target.value)} className="w-full p-2 bg-gray-600 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <option value="">{selectedPromptName}</option>
                    {singlePrompts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {step.promptId && Object.keys(step.inputMapping).length > 0 && (
                    <div className="space-y-2 text-xs pl-4 border-l-2 border-gray-600">
                        <h5 className="font-semibold text-gray-400">Variable Inputs:</h5>
                        {Object.keys(step.inputMapping).map(varName => {
                             const mapping = step.inputMapping[varName];
                             const isInvalid = mapping.source === 'stepOutput' && (!mapping.step || !availableInputSteps.includes(mapping.step));
                            return (
                                <div key={varName} className={`flex items-center gap-2 p-2 rounded-md ${isInvalid ? 'bg-red-900/50 ring-1 ring-red-500' : 'bg-gray-800/50'}`}>
                                    {isInvalid && <span title={`Invalid source: Step ${mapping.step} is not available before the current step.`}><WarningIcon className="w-4 h-4 text-red-400 flex-shrink-0" /></span>}
                                    <span className="text-gray-300 font-mono bg-gray-700 px-1.5 py-0.5 rounded">{`{{${varName}}}`}</span>
                                    <span className="text-gray-500">&larr;</span>
                                    <select 
                                        value={mapping.source === 'stepOutput' ? `step_${mapping.step}` : 'userInput'}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === 'userInput') {
                                                handleMappingChange(varName, 'userInput');
                                            } else {
                                                const sourceStep = parseInt(val.split('_')[1], 10);
                                                handleMappingChange(varName, 'stepOutput', sourceStep);
                                            }
                                        }}
                                        className="p-1 bg-gray-600 rounded text-xs w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    >
                                        <option value="userInput">User Input</option>
                                        {availableInputSteps.map(prevStepNum => (
                                            <option key={prevStepNum} value={`step_${prevStepNum}`}>Output from Step {prevStepNum}</option>
                                        ))}
                                    </select>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const WorkflowBuilder = ({ chainDefinition, onChainChange, singlePrompts }: { chainDefinition: PromptChainStep[], onChainChange: (newChain: PromptChainStep[]) => void, singlePrompts: Prompt[] }) => {
    
    const handleReorder = (newOrder: PromptChainStep[]) => {
        const renumberedChain = newOrder.map((step, index) => ({
            ...step,
            step: index + 1,
        }));
        onChainChange(renumberedChain);
    };

    const addStep = () => {
        const newStep: PromptChainStep = {
            step: chainDefinition.length + 1,
            promptId: '',
            inputMapping: {}
        };
        onChainChange([...chainDefinition, newStep]);
    };

    const removeStep = (stepNumber: number) => {
        const newChain = chainDefinition
            .filter(s => s.step !== stepNumber)
            .map((s, index) => ({ ...s, step: index + 1 })); // Re-number steps
        onChainChange(newChain);
    };

    const updateStep = (stepNumber: number, newStepData: Partial<PromptChainStep>) => {
        const newChain = chainDefinition.map(s => s.step === stepNumber ? { ...s, ...newStepData } : s);
        onChainChange(newChain);
    };

    return (
        <div className="bg-gray-800 p-3 rounded-lg space-y-3 max-h-80 overflow-y-auto">
            <h4 className="text-sm font-semibold text-gray-300">Workflow Builder</h4>
             {chainDefinition.length === 0 ? (
                <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                    <p>This workflow has no steps.</p>
                    <p className="text-xs">Click "Add Step" to begin building your chain.</p>
                </div>
            ) : (
                <Reorder.Group axis="y" values={chainDefinition} onReorder={handleReorder} className="space-y-3">
                    {chainDefinition.map((step, index) => (
                         <Reorder.Item key={step.step} value={step} dragListener={false}>
                             <WorkflowStepCard
                                step={step}
                                onUpdate={updateStep}
                                onRemove={removeStep}
                                singlePrompts={singlePrompts}
                                availableInputSteps={Array.from({ length: index }, (_, i) => i + 1)}
                            />
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            )}
            <button onClick={addStep} className="w-full text-sm py-2 bg-indigo-600/50 hover:bg-indigo-600/70 rounded-md font-semibold transition-colors">+ Add Step</button>
        </div>
    );
};


export default PromptsHub;
