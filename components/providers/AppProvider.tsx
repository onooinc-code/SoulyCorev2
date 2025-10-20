"use client";

import { useConversation } from '@/components/providers/ConversationProvider';
import { useLog } from './LogProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { useUIState } from '@/components/providers/UIStateProvider';

// This hook combines all individual context hooks into a single one for convenience.
// It assumes that the necessary providers are wrapping the component where this hook is used.
export const useAppContext = () => {
    const conversation = useConversation();
    const log = useLog();
    const settings = useSettings();
    const uiState = useUIState();

    return {
        ...conversation,
        ...log,
        ...settings,
        ...uiState,
    };
};
