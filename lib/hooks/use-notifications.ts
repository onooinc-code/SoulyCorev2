
"use client";

import { useContext } from 'react';
import { NotificationContext } from '@/components/providers/NotificationProvider';

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};