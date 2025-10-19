"use client";

import { useState, useEffect, useCallback } from 'react';
import type { DataSource } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { useNotification } from './use-notifications';

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error' | string;

export interface ConnectionLogEntry {
    timestamp: string;
    message: string;
    status: 'pending' | 'success' | 'error' | 'info';
}

export const useDataSourceSettings = (
    service: DataSource, 
    onSaveSuccess: () => void,
    testStatusMessages?: Record<string, string>,
    testAction: 'test' | 'connect' = 'test'
) => {
    const { log } = useLog();
    const { addNotification } = useNotification();

    const [config, setConfig] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModified, setIsModified] = useState(false);
    const [initialState, setInitialState] = useState<Record<string, any>>({});
    
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [connectionLog, setConnectionLog] = useState<ConnectionLogEntry[]>([]);

    useEffect(() => {
        setIsLoading(true);
        log(`Fetching settings for ${service.name}`);
        // In a real app, this would be a fetch call, but since the service object is passed with config,
        // we can use it directly.
        const serviceConfig = service.config_json || {};
        setConfig(serviceConfig);
        setInitialState(serviceConfig);
        setIsModified(false);
        setConnectionStatus(service.status === 'connected' ? 'success' : 'idle');
        setIsLoading(false);
    }, [service, log]);

    useEffect(() => {
        if (!isLoading) {
            const hasChanged = JSON.stringify(config) !== JSON.stringify(initialState);
            setIsModified(hasChanged);
        }
    }, [config, initialState, isLoading]);

    const handleConfigChange = useCallback((key: string, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    }, []);

    const addLogEntry = (message: string, status: ConnectionLogEntry['status']) => {
        setConnectionLog(prev => [{ timestamp: new Date().toLocaleTimeString(), message, status }, ...prev]);
    };

    const handleTestConnection = useCallback(async (currentConfig: Record<string, any>, action?: string) => {
        setConnectionStatus('testing');
        setConnectionLog([]);
        const effectiveAction = action || testAction;
        log(`Simulating '${effectiveAction}' for ${service.name}...`);
        
        addLogEntry(`Initiating ${effectiveAction}...`, 'info');
        await new Promise(r => setTimeout(r, 1500));

        // Generic simulation logic
        let success = Math.random() > 0.2; // 80% success rate
        let finalStatus: ConnectionStatus = 'error';
        let logMessage = `Simulation failed for ${service.name}.`;

        if (action === 'disconnect') {
            success = true; // Disconnect always succeeds
            finalStatus = 'idle';
            logMessage = 'Disconnected successfully.';
            setConfig(prev => ({ ...prev, email: null }));
        } else if (success) {
            finalStatus = 'success';
            logMessage = testStatusMessages?.['success'] || 'Connection successful!';
            if(action === 'connect') {
                setConfig(prev => ({ ...prev, email: 'hedra@example.com' }));
            }
        } else {
            const specificError = Object.keys(testStatusMessages || {}).find(key => key !== 'success');
            finalStatus = specificError || 'error';
            logMessage = testStatusMessages?.[finalStatus] || 'An unknown error occurred.';
        }
        
        addLogEntry(logMessage, success ? 'success' : 'error');
        setConnectionStatus(finalStatus);

    }, [log, service.name, testAction, testStatusMessages]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        log(`Saving settings for ${service.name}`, { serviceId: service.id });
        try {
            const payload = { 
                config_json: config,
                // If the connection test was successful, update the status to connected.
                status: connectionStatus === 'success' ? 'connected' : service.status
            };

            const res = await fetch(`/api/data-sources/${service.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save settings');
            }
            addNotification({ type: 'success', title: 'Settings Saved', message: `Configuration for ${service.name} has been updated.` });
            onSaveSuccess();
        } catch (error) {
            const errorMessage = (error as Error).message;
            log(`Failed to save settings for ${service.name}`, { error: errorMessage }, 'error');
            addNotification({ type: 'error', title: 'Save Failed', message: errorMessage });
        } finally {
            setIsSaving(false);
        }
    }, [log, service, config, connectionStatus, onSaveSuccess, addNotification]);

    return {
        config,
        setConfig,
        handleConfigChange,
        isLoading,
        isSaving,
        isModified,
        setIsModified,
        handleSave,
        connectionStatus,
        setConnectionStatus,
        handleTestConnection,
        connectionLog,
        addLogEntry,
    };
};
