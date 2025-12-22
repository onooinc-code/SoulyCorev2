
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XIcon, UserCircleIcon, RefreshIcon, CheckIcon, BrainIcon } from '@/components/Icons';

interface ProfileModalProps {
    onClose: () => void;
}

const ProfileModal = ({ onClose }: ProfileModalProps) => {
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (e) {
            console.error("Failed to load static memory profile:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-white/5 flex justify-between items-center bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <UserCircleIcon className="w-5 h-5" />
                        </div>
                        <div>
                             <h2 className="text-lg font-bold text-white">Identity & Static Memory</h2>
                             <p className="text-[10px] text-gray-500 font-mono">Persistence: High (Global Across Sessions)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchProfile} className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400">
                             <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                            <XIcon className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>
                </header>

                <main className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {isLoading ? (
                        <div className="py-20 text-center text-gray-500 animate-pulse font-mono">Syncing Unified User Memory...</div>
                    ) : profile ? (
                        <>
                            {/* User Persona */}
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Core Identity</h3>
                                <div className="space-y-2">
                                    <p className="text-sm"><strong>Name:</strong> <span className="text-indigo-300 ml-2">{profile.name}</span></p>
                                    <p className="text-sm"><strong>AI Alias:</strong> <span className="text-indigo-300 ml-2">{profile.aiName}</span></p>
                                    <p className="text-sm"><strong>Role:</strong> <span className="text-indigo-300 ml-2">{profile.role || 'Partner'}</span></p>
                                </div>
                            </div>

                            {/* Preferences */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <CheckIcon className="w-3.5 h-3.5 text-green-400"/> Communication Style
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.preferences?.length > 0 ? (
                                        profile.preferences.map((pref: string, i: number) => (
                                            <span key={i} className="bg-gray-800 border border-white/5 px-3 py-1 rounded-full text-xs text-gray-300">
                                                {pref}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-600 italic">No specific styles learned yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Permanent Facts */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <BrainIcon className="w-3.5 h-3.5 text-purple-400"/> Harvested Permanent Facts
                                </h3>
                                <div className="space-y-2">
                                    {profile.facts && profile.facts.length > 0 ? (
                                        profile.facts.map((fact: string, i: number) => (
                                            <div key={i} className="bg-black/40 p-3 rounded-lg border-l-2 border-purple-500 text-sm text-gray-300">
                                                {fact}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-600 italic">Static memory buffer is empty.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-20 text-center text-red-400 font-mono">Memory Retrieval Failed.</div>
                    )}
                </main>

                <footer className="p-4 bg-gray-800/30 border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-500 italic">This profile represents the baseline context injected into every new conversation turn.</p>
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default ProfileModal;
