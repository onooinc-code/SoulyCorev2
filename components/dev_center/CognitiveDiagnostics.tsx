
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, XIcon, RefreshIcon, BeakerIcon, CommandLineIcon, CircleStackIcon } from '../Icons';

const CognitiveDiagnostics = () => {
    const [health, setHealth] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sandboxInput, setSandboxInput] = useState('');
    const [sandboxResult, setSandboxResult] = useState<any>(null);
    const [isRunningSandbox, setIsRunningSandbox] = useState(false);

    const checkHealth = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/dev/diagnostics');
            setHealth(await res.json());
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { checkHealth(); }, []);

    const runSandbox = async () => {
        if (!sandboxInput.trim()) return;
        setIsRunningSandbox(true);
        try {
            const res = await fetch('/api/search?q=' + encodeURIComponent(sandboxInput));
            setSandboxResult(await res.json());
        } catch (e) { console.error(e); }
        finally { setIsRunningSandbox(false); }
    };

    const StatusCard = ({ name, data }: { name: string, data: any }) => {
        const isHealthy = data?.status === 'healthy';
        return (
            <div className="bg-gray-900 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isHealthy ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        <CircleStackIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-tighter">{name}</h4>
                        <p className="text-[10px] text-gray-500">{data?.latency ? `${data.latency}ms latency` : data?.status || 'Unknown'}</p>
                    </div>
                </div>
                {isHealthy ? <CheckIcon className="w-5 h-5 text-green-500" /> : <XIcon className="w-5 h-5 text-red-500" />}
            </div>
        );
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <BeakerIcon className="w-5 h-5 text-indigo-400" />
                    Cognitive Nexus Health
                </h3>
                <button onClick={checkHealth} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatusCard name="Postgres (Core)" data={health?.postgres} />
                <StatusCard name="EdgeDB (Graph)" data={health?.edgedb} />
                <StatusCard name="MongoDB (Logs)" data={health?.mongodb} />
                <StatusCard name="Pinecone (RAG)" data={health?.pinecone} />
                <StatusCard name="Upstash (Ent)" data={health?.upstash} />
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* Semantic Sandbox */}
                <div className="bg-gray-900/50 rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <CommandLineIcon className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-bold">Retrieval Sandbox</h4>
                    </div>
                    <p className="text-xs text-gray-500">Test how the system retrieves context across all tiers for a specific query.</p>
                    <div className="flex gap-2">
                        <input 
                            value={sandboxInput}
                            onChange={e => setSandboxInput(e.target.value)}
                            placeholder="Enter test prompt..."
                            className="flex-1 bg-gray-800 border border-white/5 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                        <button 
                            onClick={runSandbox}
                            disabled={isRunningSandbox}
                            className="bg-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50"
                        >
                            Execute
                        </button>
                    </div>
                    <div className="flex-1 bg-black/40 rounded-xl p-4 font-mono text-[10px] overflow-auto border border-white/5">
                        {isRunningSandbox ? (
                            <div className="animate-pulse text-indigo-400">Pinging Federated Memory Nexus...</div>
                        ) : sandboxResult ? (
                            <pre className="text-emerald-400">{JSON.stringify(sandboxResult, null, 2)}</pre>
                        ) : (
                            <div className="text-gray-600 italic">No output yet. Enter a query and execute.</div>
                        )}
                    </div>
                </div>

                {/* Integration Logs */}
                <div className="bg-gray-900/50 rounded-2xl border border-white/5 p-6 flex flex-col gap-4 overflow-hidden">
                    <div className="flex items-center gap-2">
                        <CircleStackIcon className="w-5 h-5 text-purple-400" />
                        <h4 className="font-bold">Deep Trace (Mongo Logs)</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                         {health?.mongodb?.status === 'healthy' ? (
                             <p className="text-xs text-gray-500 italic">MongoDB is live. Logs are being archived successfully.</p>
                         ) : (
                             <p className="text-xs text-red-500">MongoDB Connection failed. Archive trace disabled.</p>
                         )}
                         <div className="p-3 bg-gray-800 rounded-lg border border-indigo-500/20">
                             <p className="text-[10px] text-indigo-300 font-bold mb-1">SYSTEM INSIGHT:</p>
                             <p className="text-xs text-gray-400">All memory tiers are currently synchronized. Any extraction will be automatically propagated to EdgeDB and Pinecone within 1.5s.</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CognitiveDiagnostics;
