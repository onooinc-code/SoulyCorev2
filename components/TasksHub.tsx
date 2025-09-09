
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, EditIcon, XIcon, CheckIcon } from './Icons';
import { useConversation } from '@/components/providers/ConversationProvider';
import