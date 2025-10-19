

"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ApiEndpoint } from '@/lib/types';
import StatusIndicator from './StatusIndicator';
// FIX: Corrected a relative import path for the `ServerIcon` component to use the absolute path alias `@`, resolving a module resolution error during the build process.
import { ServerIcon } from '@/components/Icons';

interface EndpointNavigatorPanelProps {
    endpoints: ApiEndpoint[];
    onSelectEndpoint: (endpoint: ApiEndpoint) => void;
    selectedEndpointId: string | null;
}

const EndpointNavigatorPanel = ({ endpoints, onSelectEndpoint, selectedEndpointId }: EndpointNavigatorPanelProps) => {
    const [