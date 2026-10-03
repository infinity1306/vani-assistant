import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../../core/store/useOSStore';
import { 
  LogOut, Plus, Trash2, Check, Calendar, Lightbulb, 
  Shield, Settings, Clock, ChevronRight, Cpu, Power,
  Volume2, VolumeX, Mic, Eye, Brain, Zap
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────
interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: number;
}

interface Idea {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  tags: string[];
}

interface AgendaItem {
  id: string;
  time: string;
  title: string;
  done: boolean;
}

// ─── Persistence Helpers ──────────────────────────────────────────────────
const STORAGE_KEY = 'vani_superadmin';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    tasks: [] as Task[],
    ideas: [] as Idea[],
    agenda: [] as AgendaItem[],
  };
}

function saveData(data: { tasks: Task[]; ideas: Idea[]; agenda: AgendaItem[] }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Sub-components ──────────────────────────────────────────────────────

const ProfileCard: React.FC = () => {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="sa-card flex items-center gap-5 p-6">
      {/* Profile Image */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
          <Shield className="w-7 h-7 text-white/60" />
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-[#0a0a0a]" />
      </div>
      <div className="flex-1">
        <p className="text-white/40 text-xs font-light tracking-wide">{greeting}</p>
        <h2 className="text-white text-lg font-semibold tracking-tight mt-0.5">Commander</h2>
        <p className="text-white/30 text-[11px] font-mono mt-1">CLEARANCE: OMEGA • SESSION ACTIVE</p>
      </div>
    </div>
  );
};

const SystemOverrides: React.FC = () => {
  const [overrides, setOverrides] = useState({
    voiceEngine: true,
    visionModule: false,
    neuralCore: true,
    stealthMode: false,
    autoExec: true,
    telemetry: true,
  });

  const toggleOverride = (key: keyof typeof overrides) => {
    setOverrides(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const overrideList = [
    { key: 'voiceEngine' as const, label: 'Voice Engine', icon: Volume2, offIcon: VolumeX },
    { key: 'visionModule' as const, label: 'Vision Module', icon: Eye },
    { key: 'neuralCore' as const, label: 'Neural Core', icon: Brain },
    { key: 'stealthMode' as const, label: 'Stealth Mode', icon: Shield },
    { key: 'autoExec' as const, label: 'Auto Execute', icon: Zap },
    { key: 'telemetry' as const, label: 'Telemetry', icon: Cpu },
  ];

  return (
    <div className="sa-card p-5">
      <h3 className="sa-section-title mb-4">
        <Settings className="w-3.5 h-3.5" /> System Overrides
      </h3>
      <div className="space-y-2">
        {overrideList.map(item => {
          const Icon = item.icon;
          const active = overrides[item.key];
          return (
            <button
              key={item.key}
              onClick={() => toggleOverride(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                active 
                  ? 'bg-white/[0.04] border border-white/10' 
                  : 'bg-transparent border border-transparent hover:border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white/70' : 'text-white/20'}`} />
                <span className={`text-xs font-medium ${active ? 'text-white/80' : 'text-white/30'}`}>
                  {item.label}
                </span>
              </div>
              <div className={`w-8 h-4 rounded-full transition-all duration-300 relative ${
                active ? 'bg-white/20' : 'bg-white/5'
              }`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 ${
                  active ? 'left-[18px] bg-white' : 'left-0.5 bg-white/20'
                }`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────

export const SuperAdminPanel: React.FC = () => {
  const { setAppMode, addSystemEvent } = useOSStore();
  const [data, setData] = useState(loadData);
  const [activeTab, setActiveTab] = useState<'tasks' | 'ideas' | 'agenda'>('tasks');
  
  // Task input
  const [newTask, setNewTask] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  
  // Idea input
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaBody, setNewIdeaBody] = useState('');
  
  // Agenda input
  const [newAgendaTime, setNewAgendaTime] = useState('');
  const [newAgendaTitle, setNewAgendaTitle] = useState('');

  // Persist on change
  useEffect(() => {
    saveData(data);
  }, [data]);

  // ─── Task Actions ────────────────────────────────────────────────────
  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      text: newTask.trim(),
      done: false,
      priority: newTaskPriority,
      createdAt: Date.now(),
    };
    setData(prev => ({ ...prev, tasks: [task, ...prev.tasks] }));
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t),
    }));
  };

  const deleteTask = (id: string) => {
    setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  };

  // ─── Idea Actions ───────────────────────────────────────────────────
  const addIdea = () => {
    if (!newIdeaTitle.trim()) return;
    const idea: Idea = {
      id: crypto.randomUUID(),
      title: newIdeaTitle.trim(),
      body: newIdeaBody.trim(),
      createdAt: Date.now(),
      tags: [],
    };
    setData(prev => ({ ...prev, ideas: [idea, ...prev.ideas] }));
    setNewIdeaTitle('');
    setNewIdeaBody('');
  };

  const deleteIdea = (id: string) => {
    setData(prev => ({ ...prev, ideas: prev.ideas.filter(i => i.id !== id) }));
  };

  // ─── Agenda Actions ─────────────────────────────────────────────────
  const addAgendaItem = () => {
    if (!newAgendaTitle.trim() || !newAgendaTime.trim()) return;
    const item: AgendaItem = {
      id: crypto.randomUUID(),
      time: newAgendaTime,
      title: newAgendaTitle.trim(),
      done: false,
    };
    setData(prev => ({
      ...prev,
      agenda: [...prev.agenda, item].sort((a, b) => a.time.localeCompare(b.time)),
    }));
    setNewAgendaTime('');
    setNewAgendaTitle('');
  };

  const toggleAgendaItem = (id: string) => {
    setData(prev => ({
      ...prev,
      agenda: prev.agenda.map(a => a.id === id ? { ...a, done: !a.done } : a),
    }));
  };

  const deleteAgendaItem = (id: string) => {
    setData(prev => ({ ...prev, agenda: prev.agenda.filter(a => a.id !== id) }));
  };

  const handleExit = () => {
    addSystemEvent('Super Admin session terminated.', 'warning');
    setAppMode('os');
  };

  const priorityColors: Record<Task['priority'], string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-400',
    medium: 'bg-blue-400',
    low: 'bg-white/20',
  };

  const tabs = [
    { id: 'tasks' as const, label: 'Tasks', icon: Check, count: data.tasks.filter(t => !t.done).length },
    { id: 'ideas' as const, label: 'Ideas', icon: Lightbulb, count: data.ideas.length },
    { id: 'agenda' as const, label: 'Agenda', icon: Calendar, count: data.agenda.filter(a => !a.done).length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[200] sa-root"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[#050505]" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 h-full flex">
        
        {/* ─── Left Sidebar ─────────────────────────────────────────── */}
        <motion.aside
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-[320px] h-full border-r border-white/[0.06] flex flex-col p-5 gap-4 overflow-y-auto sa-scrollbar"
        >
          <ProfileCard />
          <SystemOverrides />
          
          {/* Exit Button */}
          <button
            onClick={handleExit}
            className="mt-auto mx-3 mb-3 flex items-center justify-center gap-2 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-white/30 transition-all duration-300 group"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-xs font-medium tracking-wide">Exit Super Admin</span>
          </button>
        </motion.aside>

        {/* ─── Main Content ─────────────────────────────────────────── */}
        <motion.main
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 h-full flex flex-col overflow-hidden"
        >
          {/* Header */}
          <header className="px-8 pt-6 pb-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h1 className="text-white text-xl font-semibold tracking-tight">Control Center</h1>
              <p className="text-white/30 text-xs mt-1 font-mono">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white/[0.08] text-white border border-white/10'
                        : 'text-white/30 hover:text-white/60 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                        activeTab === tab.id ? 'bg-white/10 text-white/70' : 'bg-white/5 text-white/30'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto sa-scrollbar p-8">
            <AnimatePresence mode="wait">
              
              {/* ─── TASKS TAB ───────────────────────────────────────── */}
              {activeTab === 'tasks' && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Add Task */}
                  <div className="sa-card p-4 mb-6 flex gap-3">
                    <input
                      type="text"
                      value={newTask}
                      onChange={e => setNewTask(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTask()}
                      placeholder="Add a new task..."
                      className="sa-input flex-1"
                    />
                    <select
                      value={newTaskPriority}
                      onChange={e => setNewTaskPriority(e.target.value as Task['priority'])}
                      className="sa-input w-28 text-center"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <button onClick={addTask} className="sa-btn-primary">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Task List */}
                  <div className="space-y-2">
                    {data.tasks.length === 0 ? (
                      <div className="text-center py-16 text-white/20 text-sm">No tasks yet. Add one above.</div>
                    ) : (
                      data.tasks.map((task, i) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`sa-card p-4 flex items-center gap-4 group ${task.done ? 'opacity-40' : ''}`}
                        >
                          <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]} shrink-0`} />
                          <button
                            onClick={() => toggleTask(task.id)}
                            className={`w-5 h-5 rounded border shrink-0 flex items-center justify-center transition-all ${
                              task.done ? 'bg-white/10 border-white/20' : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            {task.done && <Check className="w-3 h-3 text-white/60" />}
                          </button>
                          <span className={`flex-1 text-sm ${task.done ? 'line-through text-white/30' : 'text-white/80'}`}>
                            {task.text}
                          </span>
                          <span className="text-[10px] text-white/15 font-mono">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* ─── IDEAS TAB ───────────────────────────────────────── */}
              {activeTab === 'ideas' && (
                <motion.div
                  key="ideas"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Add Idea */}
                  <div className="sa-card p-5 mb-6 flex flex-col gap-3">
                    <input
                      type="text"
                      value={newIdeaTitle}
                      onChange={e => setNewIdeaTitle(e.target.value)}
                      placeholder="Idea title..."
                      className="sa-input"
                    />
                    <textarea
                      value={newIdeaBody}
                      onChange={e => setNewIdeaBody(e.target.value)}
                      placeholder="Describe your idea..."
                      rows={3}
                      className="sa-input resize-none"
                    />
                    <button onClick={addIdea} className="sa-btn-primary self-end px-6">
                      <Plus className="w-4 h-4 mr-2" /> Save Idea
                    </button>
                  </div>

                  {/* Ideas Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {data.ideas.length === 0 ? (
                      <div className="col-span-2 text-center py-16 text-white/20 text-sm">Your ideas vault is empty.</div>
                    ) : (
                      data.ideas.map((idea, i) => (
                        <motion.div
                          key={idea.id}
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="sa-card p-5 group relative"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="w-3.5 h-3.5 text-yellow-500/60" />
                              <h4 className="text-white/90 text-sm font-semibold">{idea.title}</h4>
                            </div>
                            <button
                              onClick={() => deleteIdea(idea.id)}
                              className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          {idea.body && (
                            <p className="text-white/40 text-xs leading-relaxed">{idea.body}</p>
                          )}
                          <p className="text-white/15 text-[10px] font-mono mt-3">
                            {new Date(idea.createdAt).toLocaleDateString()}
                          </p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* ─── AGENDA TAB ──────────────────────────────────────── */}
              {activeTab === 'agenda' && (
                <motion.div
                  key="agenda"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Add Agenda Item */}
                  <div className="sa-card p-4 mb-6 flex gap-3 items-center">
                    <input
                      type="time"
                      value={newAgendaTime}
                      onChange={e => setNewAgendaTime(e.target.value)}
                      className="sa-input w-32 text-center"
                    />
                    <input
                      type="text"
                      value={newAgendaTitle}
                      onChange={e => setNewAgendaTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addAgendaItem()}
                      placeholder="What's on your agenda?"
                      className="sa-input flex-1"
                    />
                    <button onClick={addAgendaItem} className="sa-btn-primary">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Agenda Timeline */}
                  <div className="relative pl-8">
                    {/* Timeline line */}
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-white/[0.06]" />

                    <div className="space-y-3">
                      {data.agenda.length === 0 ? (
                        <div className="text-center py-16 text-white/20 text-sm">No agenda items for today.</div>
                      ) : (
                        data.agenda.map((item, i) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`sa-card p-4 flex items-center gap-4 relative group ${item.done ? 'opacity-40' : ''}`}
                          >
                            {/* Timeline dot */}
                            <div className={`absolute -left-[26px] w-2.5 h-2.5 rounded-full border-2 border-[#050505] ${
                              item.done ? 'bg-white/20' : 'bg-white/50'
                            }`} />
                            
                            <button
                              onClick={() => toggleAgendaItem(item.id)}
                              className={`w-5 h-5 rounded border shrink-0 flex items-center justify-center transition-all ${
                                item.done ? 'bg-white/10 border-white/20' : 'border-white/10 hover:border-white/30'
                              }`}
                            >
                              {item.done && <Check className="w-3 h-3 text-white/60" />}
                            </button>
                            
                            <div className="flex items-center gap-3 flex-1">
                              <Clock className="w-3 h-3 text-white/20 shrink-0" />
                              <span className="text-white/50 text-xs font-mono w-14 shrink-0">{item.time}</span>
                              <ChevronRight className="w-3 h-3 text-white/10 shrink-0" />
                              <span className={`text-sm ${item.done ? 'line-through text-white/30' : 'text-white/80'}`}>
                                {item.title}
                              </span>
                            </div>
                            
                            <button
                              onClick={() => deleteAgendaItem(item.id)}
                              className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </motion.div>
  );
};
