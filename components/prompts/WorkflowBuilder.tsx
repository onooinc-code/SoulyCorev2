"use client";

import React from 'react';
import { Reorder } from 'framer-motion';
import type { Prompt, PromptChainStep, Tool } from '@/lib/types';
import { MenuIcon, WarningIcon, WrenchScrewdriverIcon, DocumentTextIcon } from '../Icons';


const WorkflowStepCard = ({ step, onUpdate, onRemove, singlePrompts, tools, availableInputSteps }: {
    step: PromptChainStep;
    onUpdate: (stepNumber: number, newStepData: Partial<PromptChainStep>) => void;
    onRemove: (stepNumber: number) => void;
    singlePrompts: Prompt[];
    tools: Tool[];
    availableInputSteps: number[];
}) => {
    const getPromptVariables = (promptId: string): string[] => {
        const prompt = singlePrompts.find(p => p.id === promptId);
        if (!prompt) return [];
        const variableRegex = /{{\s*(\w+)\s*}}/g;
        const matches = [...prompt.content.matchAll(variableRegex)];
        return [...new Set(matches.map(match => match[1]))];
    };
    
    const getToolArguments = (toolId: string): string[] => {
        const tool = tools.find(t => t.id === toolId);
        // FIX: Corrected property name from schema_json to schemaJson.
        if (!tool || !tool.schemaJson) return [];
        try {
            // FIX: The tool schema can be either a JSON string or a pre-parsed object.
            // This check handles both cases to prevent an error when calling JSON.parse on an object.
            // FIX: Corrected property name from schema_json to schemaJson.
            const schema = typeof tool.schemaJson === 'string'
                ? JSON.parse(tool.schemaJson)
                : tool.schemaJson;
            return Object.keys(schema.properties || {});
        } catch (e) {
            return [];
        }
    }

    const handleSourceSelection = (sourceId: string, type: 'prompt' | 'tool') => {
        const variables = type === 'prompt' ? getPromptVariables(sourceId) : getToolArguments(sourceId);
        const newInputMapping = variables.reduce((acc, varName) => {
            acc[varName] = { source: 'userInput' };
            return acc;
        }, {} as Record<string, { source: 'userInput' | 'stepOutput'; step?: number }>);
        onUpdate(step.step, { [type === 'prompt' ? 'promptId' : 'toolId']: sourceId, inputMapping: newInputMapping });
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
    
    const selectedItemName = step.type === 'prompt'
        ? singlePrompts.find(p => p.id === step.promptId)?.name || 'Select a prompt...'
        : tools.find(t => t.id === step.toolId)?.name || 'Select a tool...';
    
    const itemVariables = step.type === 'prompt' ? getPromptVariables(step.promptId || '') : getToolArguments(step.toolId || '');

    return (
        <div className="flex items-start gap-3">
            <div className="p-2 cursor-grab" title="Drag to reorder step"><MenuIcon className="w-5 h-5 text-gray-500" /></div>
            <div className="flex-1 bg-gray-700/50 p-3 rounded-md">
                <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-indigo-400">Step {step.step}</span>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center text-xs p-1 bg-gray-600 rounded-md">
                            <button onClick={() => onUpdate(step.step, { type: 'prompt' })} className={`px-2 py-0.5 rounded flex items-center gap-1 ${step.type === 'prompt' ? 'bg-indigo-600 text-white' : ''}`}><DocumentTextIcon className="w-4 h-4"/> Prompt</button>
                            <button onClick={() => onUpdate(step.step, { type: 'tool' })} className={`px-2 py-0.5 rounded flex items-center gap-1 ${step.type === 'tool' ? 'bg-indigo-600 text-white' : ''}`}><WrenchScrewdriverIcon className="w-4 h-4"/> Tool</button>
                        </div>
                        <button onClick={() => onRemove(step.step)} className="text-red-400 hover:text-red-300 text-xs font-semibold">REMOVE</button>
                    </div>
                </div>

                {step.type === 'prompt' ? (
                    <select value={step.promptId || ''} onChange={(e) => handleSourceSelection(e.target.value, 'prompt')} className="w-full p-2 bg-gray-600 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        <option value="">{selectedItemName}</option>
                        {singlePrompts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                ) : (
                    <select value={step.toolId || ''} onChange={(e) => handleSourceSelection(e.target.value, 'tool')} className="w-full p-2 bg-gray-600 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        <option value="">{selectedItemName}</option>
                        {tools.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                )}

                {itemVariables.length > 0 && (
                    <div className="space-y-2 text-xs pl-4 border-l-2 border-gray-600">
                        <h5 className="font-semibold text-gray-400">Inputs / Arguments:</h5>
                        {itemVariables.map(varName => {
                             const mapping = step.inputMapping[varName];
                             const isInvalid = mapping && mapping.source === 'stepOutput' && (!mapping.step || !availableInputSteps.includes(mapping.step));
                            return (
                                <div key={varName} className={`flex items-center gap-2 p-2 rounded-md ${isInvalid ? 'bg-red-900/50 ring-1 ring-red-500' : 'bg-gray-800/50'}`}>
                                    {isInvalid && <span title={`Invalid source: Step ${mapping.step} is not available before the current step.`}><WarningIcon className="w-4 h-4 text-red-400 flex-shrink-0" /></span>}
                                    <span className="text-gray-300 font-mono bg-gray-700 px-1.5 py-0.5 rounded">{`{{${varName}}}`}</span>
                                    <span className="text-gray-500">&larr;</span>
                                    <select 
                                        value={mapping?.source === 'stepOutput' ? `step_${mapping.step}` : 'userInput'}
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

interface WorkflowBuilderProps {
    chainDefinition: PromptChainStep[];
    onChainChange: (newChain: PromptChainStep[]) => void;
    singlePrompts: Prompt[];
    tools: Tool[];
}

export const WorkflowBuilder = ({ chainDefinition, onChainChange, singlePrompts, tools }: WorkflowBuilderProps) => {
    
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
            type: 'prompt',
            promptId: '',
            toolId: null,
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
        const newChain = chainDefinition.map(s => {
            if (s.step === stepNumber) {
                // If type changes, reset the source ID
                if ('type' in newStepData && newStepData.type !== s.type) {
                    return { ...s, ...newStepData, promptId: null, toolId: null, inputMapping: {} };
                }
                return { ...s, ...newStepData };
            }
            return s;
        });
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
                         <Reorder.Item key={step.step} value={step}>
                             <WorkflowStepCard
                                step={step}
                                onUpdate={updateStep}
                                onRemove={removeStep}
                                singlePrompts={singlePrompts}
                                tools={tools}
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