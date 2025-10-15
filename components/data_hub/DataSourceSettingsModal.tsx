
"use client";

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import type { DataSource } from '@/lib/types';
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

        // Routing logic based on service provider and name
        if (service.provider === 'Vercel') {
            if (service.name.includes('Postgres')) return <VercelPostgresModal service={service} onClose={onClose} />;
            if (service.name.includes('KV')) return <VercelKVModal service={service} onClose={onClose} />;
            if (service.name.includes('Blob')) return <VercelBlobModal service={service} onClose={onClose} />;
        }
        if (service.provider === 'Pinecone') {
            return <PineconeModal service={service} onClose={onClose} />;
        }
        if (service.provider === 'Upstash') {
            return <UpstashVectorModal service={service} onClose={onClose} />;
        }
        if (service.provider === 'Supabase') {
            return <SupabaseModal service={service} onClose={onClose} />;
        }
        if (service.provider === 'Self-Hosted' || service.provider === 'CPanel') {
            return <MySQLModal service={service} onClose={onClose} />;
        }
        if (service.provider === 'Google' || service.provider === 'Official') {
            return <GoogleDriveModal service={service} onClose={onClose} />;
        }

        // A fallback modal could be rendered here for unhandled providers
        return null;
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
