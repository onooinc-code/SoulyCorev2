"use client";

import React from 'react';
import { useUIState } from '@/components/providers/UIStateProvider';
import ConversationPanel from './ConversationPanel';

const Sidebar = () => {
    const { isConversationPanelMinimized } = useUIState();
    return <ConversationPanel isMinimized={isConversationPanelMinimized} />;
};

export default Sidebar;
