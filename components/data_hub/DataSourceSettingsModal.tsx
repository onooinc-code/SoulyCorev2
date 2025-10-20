"use client";

// components/data_hub/DataSourceSettingsModal.tsx
import React from 'react';
import type { DataSource } from '@/lib/types';
import {
    VercelPostgresModal,
    PineconeModal,
    VercelKVModal,
    VercelBlobModal,
    SupabaseModal,
    MySQLModal,
    GoogleDriveModal,
    VercelRedisModal,
    GraphDBModal,
    MongoDBModal,
} from './settings_modals';
import { XIcon } from '../Icons';

interface DataSourceSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: DataSource | null;
    onSaveSuccess: () => void;
}

const DataSourceSettingsModal = ({ isOpen, onClose, service, onSaveSuccess }: DataSourceSettingsModalProps) => {
    if (!isOpen || !service) {
        return null;
    }

    // A mapping from a key (like service.name or service.id) to the component.
    const componentMap: { [key: string]: React.FC<any> } = {
        'Vercel Postgres': VercelPostgresModal,
        'Pinecone KnowledgeBase': PineconeModal,
        // 'Upstash Vector': UpstashVectorModal, // Placeholder
        'Vercel KV': VercelKVModal,
        'Vercel Blob': VercelBlobModal,
        'Supabase': SupabaseModal,
        'Self-Hosted MySQL': MySQLModal,
        'Google Drive': GoogleDriveModal,
        'Vercel Redis': VercelRedisModal,
        'Vercel GraphDB': GraphDBModal,
        'Vercel MongoDB': MongoDBModal,
    };

    const ModalComponent = componentMap[service.name];

    if (!ModalComponent) {
        // Fallback for services without a specific modal yet
        return (
             <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4" onClick={onClose}>
                <div className="bg-gray-800 p-6 rounded-lg text-center" onClick={e => e.stopPropagation()}>
                    <header className="flex justify-between items-center pb-4 border-b border-gray-700 mb-4">
                        <h2 className="text-lg font-bold">Settings for {service.name}</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                    </header>
                    <p>This settings panel is not yet implemented.</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg">Close</button>
                </div>
            </div>
        );
    }

    return <ModalComponent service={service} onClose={onClose} onSaveSuccess={onSaveSuccess} />;
};

export default DataSourceSettingsModal;
