
"use client";

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import type { DataSource } from '@/lib/types';
// FIX: Correct the import of VercelPostgresModal from the settings_modals barrel file.
import {
    VercelPostgresModal, PineconeModal, UpstashVectorModal,
    VercelKVModal, VercelBlobModal, SupabaseModal,
    MySQLModal, GoogleDriveModal
} from './settings_modals';

interface DataSourceSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: DataSource | null;
}

const DataSourceSettingsModal = ({ isOpen, onClose, service }: DataSourceSettingsModalProps) => {
    
    const renderModalContent = () => {
        if (!service) return null;

        switch (service.provider) {
            case 'Vercel':
                if (service.name.includes('Postgres')) return <VercelPostgresModal service={service} onClose={onClose} />;
                if (service.name.includes('KV')) return <VercelKVModal service={service} onClose={onClose} />;
                if (service.name.includes('Blob')) return <VercelBlobModal service={service} onClose={onClose} />;
                return null; 
            case 'Pinecone':
                return <PineconeModal service={service} onClose={onClose} />;
            case 'Upstash':
                return <UpstashVectorModal service={service} onClose={onClose} />;
            case 'Supabase':
                return <SupabaseModal service={service} onClose={onClose} />;
            case 'Self-Hosted':
                 return <MySQLModal service={service} onClose={onClose} />;
            case 'Google':
                return <GoogleDriveModal service={service} onClose={onClose} />;
            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && service && (
                renderModalContent()
            )}
        </AnimatePresence>
    );
};

export default DataSourceSettingsModal;