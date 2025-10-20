"use client";

// components/dashboard/panels/HedraGoalsPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Subsystem, HedraGoal } from '@/lib/types';
import SubsystemCard from '../SubsystemCard';
import DependencyGraph from '../DependencyGraph';
import SubsystemDetailModal from '../SubsystemDetailModal';
import DashboardPanel from '../DashboardPanel';
import { EditIcon, XIcon } from '../../Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AiAnalysisModal = ({
  isOpen,
  onClose,
  result,
}: {
  isOpen: boolean;
  onClose: () => void;
  result: { title: string; content: string } | null;
}) => (
  <AnimatePresence>
    {isOpen && result && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[101] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h3 className="font-bold text-lg mb-4">{result.title}</h3>
            <div className="prose-custom max-h-80 overflow-y-auto text-gray-300 whitespace-pre-wrap">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.content}</ReactMarkdown>
            </div>
            <button
              onClick={onClose}
              className="mt-6 px-4 py-2 bg-indigo-600 rounded-lg w-full"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const EditGoalModal = ({
    isOpen,
    onClose,
    goalKey,
    goalContent,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    goalKey: string;
    goalContent: string;
    onSave: (key: string, content: string) => void;
}) => {
    const [content, setContent] = useState(goalContent);
    const titleMap: Record<string, string> = {
        main_goal: 'المهمة الأساسية (Main Goal)',
        ideas: 'المخطط الاستراتيجي (Strategic Plan)',
        status: 'الحالة الراهنة (Current Status)',
    }

    return (
        <AnimatePresence>
            {isOpen && (
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[102] p-4"
                    onClick={onClose}
                 >
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col h-auto max-h-[80vh]"
                        onClick={e => e.stopPropagation()}
                    >
                         <header className="flex justify-between items-center p-4 border-b border-gray-700">
                             <h2 className="text-lg font-bold">Edit: {titleMap[goalKey] || goalKey}</h2>
                             <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700"><XIcon className="w-5 h-5"/></button>
                         </header>
                         <main className="p-4 flex-1 overflow-y-auto">
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="w-full h-full min-h-[300px] bg-gray-900/50 text-gray-200 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                            />
                         </main>
                         <footer className="flex justify-end gap-2 p-4 border-t border-gray-700">
                            <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md text-sm">Cancel</button>
                            <button onClick={() => onSave(goalKey, content)} className="px-4 py-2 bg-green-600 rounded-md text-sm">Save Changes</button>
                         </footer>
                    </motion.div>
                 </motion.div>
            )}
        </AnimatePresence>
    )
}

const HedraGoalsPanel = () => {
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [hedraGoals, setHedraGoals] = useState<Record<string, HedraGoal> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubsystem, setSelectedSubsystem] = useState<Subsystem | null>(
    null
  );
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<{key: string, content: string} | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subsystemsRes, goalsRes] = await Promise.all([
        fetch('/api/subsystems'),
        fetch('/api/hedra-goals'),
      ]);
      if (!subsystemsRes.ok || !goalsRes.ok)
        throw new Error('Failed to fetch panel data');
      
      const subsystemsData = await subsystemsRes.json();
      const goalsData = await goalsRes.json();

      setSubsystems(subsystemsData);
      setHedraGoals(goalsData);
    } catch (error) {
      console.error('HedraGoalsPanel Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAiAction = async (
    subsystem: Subsystem,
    action: 'summary' | 'risk'
  ) => {
    const url =
      action === 'summary'
        ? '/api/dashboard/ai-summary'
        : '/api/dashboard/ai-risk-assessment';
    const title =
      action === 'summary'
        ? `AI Summary for ${subsystem.name}`
        : `AI Risk Assessment for ${subsystem.name}`;

    setAiAnalysisResult({ title, content: 'Analyzing with Gemini...' });
    setIsAiModalOpen(true);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subsystem }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI analysis failed');
      setAiAnalysisResult({ title, content: data.result });
    } catch (error) {
      setAiAnalysisResult({ title, content: `Error: ${(error as Error).message}` });
    }
  };
  
  const handleOpenEditModal = (key: string, content: string) => {
    setEditingGoal({ key, content });
    setIsEditModalOpen(true);
  };

  const handleSaveChanges = async (key: string, content: string) => {
      if (!key) return;
      try {
        const res = await fetch('/api/hedra-goals', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [key]: { content } }),
        });
        if (!res.ok) throw new Error("Failed to save goals");
        await fetchData(); // Refresh data
        setIsEditModalOpen(false);
        setEditingGoal(null);
      } catch (error) {
          console.error("Failed to save Hedra goals:", error);
      }
  };


  if (isLoading) {
    return (
      <DashboardPanel title="Hedra Strategic Goals">
        <div className="p-4 bg-gray-900/50 rounded-lg text-gray-400 text-center">
          Loading Ecosystem Command Center...
        </div>
      </DashboardPanel>
    );
  }

  const GoalCard = ({ title, goal, onEdit }: { title: string, goal: HedraGoal, onEdit: () => void }) => (
    <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-indigo-500 relative group">
        <button onClick={onEdit} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <EditIcon className="w-4 h-4" />
        </button>
        <h4 className="font-bold text-white">{title}</h4>
        <div className="prose-custom text-sm text-gray-300 mt-1 max-h-24 overflow-y-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{goal.content}</ReactMarkdown>
        </div>
    </div>
  );


  return (
    <DashboardPanel title="Hedra Strategic Goals">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {hedraGoals?.main_goal && <GoalCard title="المهمة الأساسية" goal={hedraGoals.main_goal} onEdit={() => handleOpenEditModal('main_goal', hedraGoals.main_goal.content)} />}
        {hedraGoals?.ideas && <GoalCard title="المخطط الاستراتيجي" goal={hedraGoals.ideas} onEdit={() => handleOpenEditModal('ideas', hedraGoals.ideas.content)} />}
        {hedraGoals?.status && <GoalCard title="الحالة الراهنة" goal={hedraGoals.status} onEdit={() => handleOpenEditModal('status', hedraGoals.status.content)} />}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <h3 className="text-xl font-bold text-center mb-4 text-indigo-300">
          Ecosystem Command Center
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="font-semibold text-center mb-4">Dependency Map</h4>
            <DependencyGraph subsystems={subsystems} />
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="font-semibold text-center mb-4">Subsystems</h4>
            <Reorder.Group
              axis="y"
              values={subsystems}
              onReorder={setSubsystems}
              className="space-y-3"
            >
              {subsystems.map((sub) => (
                // FIX: Added the wrapping Reorder.Item here in the parent component.
                <Reorder.Item key={sub.id} value={sub}>
                  <SubsystemCard
                    subsystem={sub}
                    onOpenDetails={() => setSelectedSubsystem(sub)}
                    onAiAction={handleAiAction}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedSubsystem && (
          <SubsystemDetailModal
            subsystem={selectedSubsystem}
            onClose={() => setSelectedSubsystem(null)}
          />
        )}
      </AnimatePresence>

      <AiAnalysisModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        result={aiAnalysisResult}
      />
      
      {editingGoal && (
        <EditGoalModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            goalKey={editingGoal.key}
            goalContent={editingGoal.content}
            onSave={handleSaveChanges}
        />
      )}
    </DashboardPanel>
  );
};

export default HedraGoalsPanel;
