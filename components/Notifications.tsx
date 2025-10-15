
"use client";

import React from 'react';
import { useNotification } from '@/lib/hooks/use-notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, CheckIcon, InfoIcon, WarningIcon } from './Icons';

const notificationIcons = {
  success: <CheckIcon className="w-6 h-6 text-green-400" />,
  error: <XIcon className="w-6 h-6 text-red-400" />,
  info: <InfoIcon className="w-6 h-6 text-blue-400" />,
  warning: <WarningIcon className="w-6 h-6 text-yellow-400" />,
};

const Notifications = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-5 right-5 z-[200] space-y-3">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="w-full max-w-sm p-4 bg-gray-800/80 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl flex items-start gap-3"
          >
            <div className="flex-shrink-0">
              {notificationIcons[notification.type]}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">{notification.title}</p>
              {notification.message && (
                <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;