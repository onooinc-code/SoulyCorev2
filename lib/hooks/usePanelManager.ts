"use client";

import { useState, useCallback } from 'react';
import { useLog } from '@/components/providers/LogProvider';

export const usePanelManager = () => {
    const { log } = useLog();

    const [isConversationPanelOpen, setConversationPanelOpen] = useState(false);
    const [isConversationPanelMinimized, setIsConversationPanelMinimized] = useState(false);
    const [isConversationPanelPinned, setIsConversationPanelPinned] = useState(false);
    const [isLogPanelOpen, setLogPanelOpen] = useState(false);
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [isDataHubWidgetOpen, setDataHubWidgetOpen] = useState(false);
    
    return {
        isConversationPanelOpen,
        setConversationPanelOpen,
        isConversationPanelMinimized,
        setIsConversationPanelMinimized,
        isConversationPanelPinned,
        setIsConversationPanelPinned,
        isLogPanelOpen,
        setLogPanelOpen,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        isDataHubWidgetOpen,
        setDataHubWidgetOpen,
    };
};