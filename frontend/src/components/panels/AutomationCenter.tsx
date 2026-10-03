import React, { useState, useEffect } from 'react';
import { Zap, Plus, X, Activity, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../../core/store/useOSStore';
import { getConfig, updateConfig } from '../../core/api/client';

interface Automation {
  id: string;
  trigger: string;
  action: string;
  active: boolean;
}

export const AutomationCenter: React.FC = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTrigger, setNewTrigger] = useState('voice_keyword');
  const [newAction, setNewAction] = useState('execute_command');
  const [newActionData, setNewActionData] = useState('');
  const [config, setConfig] = useState<any>(null);

  const [offlineModels, setOfflineModels] = useState({
    wakeword_model_path: 'models/vani_v1.onnx',
    stt_model_size: 'small',
    tts_voice: 'en-IN-NeerjaNeural',
    intent_router_model: 'llama3.2:1b',
    intent_chat_model: 'gemma2:9b',
    intent_coder_model: 'deepseek-r1:8b',
  });

  // Load from backend config
  useEffect(() => {
    getConfig().then(data => {
      if (data) {
        setConfig(data);
        if (data.automations && Array.isArray(data.automations)) {
          setAutomations(data.automations);
        }
        
        // Extract model configuration for UI
        setOfflineModels({
          wakeword_model_path: data.wakeword?.model_path || 'models/vani_v1.onnx',
          stt_model_size: data.stt?.model_size || 'small',
          tts_voice: data.tts?.voice || 'en-IN-NeerjaNeural',
          intent_router_model: data.intent?.router_model || 'llama3.2:1b',
          intent_chat_model: data.intent?.chat_model || 'gemma2:9b',
          intent_coder_model: data.intent?.coder_model || 'deepseek-r1:8b',
        });
      }
    });
  }, []);

  const saveAutomations = async (items: Automation[]) => {
    setAutomations(items);
    if (config) {
      const newConfig = { ...config, automations: items };
      setConfig(newConfig);
      await updateConfig(newConfig);
    }
  };

  const handleCreate = () => {
    if (!newActionData.trim() && newAction === 'execute_command') return;
    
    const newAuto: Automation = {
      id: Math.random().toString(36).substring(7),
      trigger: newTrigger,
      action: newAction === 'execute_command' ? `CMD: ${newActionData}` : newAction,
      active: true
    };
    
    saveAutomations([...automations, newAuto]);
    setIsCreating(false);
    setNewActionData('');
    useOSStore.getState().addSystemEvent('New automation sequence registered.', 'success', 'automation');
  };

  const toggleAutomation = (id: string) => {
    const updated = automations.map(a => a.id === id ? { ...a, active: !a.active } : a);
    saveAutomations(updated);
  };

  const deleteAutomation = (id: string) => {
    const updated = automations.filter(a => a.id !== id);
    saveAutomations(updated);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pr-2 pb-10">
      <div className="text-xs font-mono text-[#00F5FF] uppercase tracking-widest mb-4 border-b border-[#00F5FF]/20 pb-2 flex justify-between items-center">
        <span>Active Sequences</span>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="p-1 hover:bg-[#00F5FF]/20 text-[#00F5FF] transition-colors rounded"
        >
          {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-3 mb-6 bg-white/5 border border-white/10 p-4 relative overflow-hidden"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          >
            <div className="text-[10px] font-mono text-white/50 uppercase">Trigger Event</div>
            <select 
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
              className="bg-black/50 border border-white/10 text-white font-mono text-xs p-2 outline-none"
            >
              <option value="voice_keyword">Voice Keyword (VANI)</option>
              <option value="system_boot">System Boot Complete</option>
              <option value="high_cpu">High CPU Usage</option>
              <option value="time_morning">Time: 08:00 AM</option>
            </select>

            <div className="text-[10px] font-mono text-white/50 uppercase mt-2">Action Pipeline</div>
            <select 
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
              className="bg-black/50 border border-white/10 text-white font-mono text-xs p-2 outline-none"
            >
              <option value="execute_command">Execute Command</option>
              <option value="switch_performance">Toggle Performance Mode</option>
              <option value="play_sound">Play Alert Sound</option>
            </select>

            {newAction === 'execute_command' && (
              <input 
                type="text"
                placeholder="Command to run..."
                value={newActionData}
                onChange={(e) => setNewActionData(e.target.value)}
                className="bg-black/50 border border-white/10 text-white font-mono text-xs p-2 outline-none placeholder:text-white/20 mt-1"
              />
            )}

            <button 
              onClick={handleCreate}
              className="mt-2 border border-[#00F5FF]/50 bg-[#00F5FF]/20 hover:bg-[#00F5FF]/30 text-[#00F5FF] transition-colors p-2 flex items-center justify-center gap-2"
            >
              <Zap className="w-3 h-3" />
              <span className="font-mono text-[10px] uppercase tracking-widest">Deploy Sequence</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3">
        {automations.length === 0 && !isCreating ? (
          <div className="text-white/40 font-mono text-xs text-center mt-6">
            No automation sequences deployed.
          </div>
        ) : (
          automations.map(auto => (
            <div 
              key={auto.id} 
              className={`p-3 bg-black/80 border transition-colors flex flex-col gap-2 relative ${auto.active ? 'border-white/10' : 'border-white/5 opacity-50'}`}
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className={`w-3 h-3 ${auto.active ? 'text-[#00F5FF]' : 'text-white/20'}`} />
                  <span className="font-mono text-[10px] uppercase text-white/50">{auto.id.toUpperCase()}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleAutomation(auto.id)} className="text-[10px] font-mono text-white/40 hover:text-white">
                    {auto.active ? 'DISABLE' : 'ENABLE'}
                  </button>
                  <button onClick={() => deleteAutomation(auto.id)} className="text-[10px] font-mono text-red-500/50 hover:text-red-500">
                    DEL
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 mt-1">
                <span className="font-mono text-[10px] text-white/30 uppercase">IF</span>
                <span className="font-mono text-xs text-white uppercase">{auto.trigger.replace('_', ' ')}</span>
                
                <span className="font-mono text-[10px] text-[#00F5FF]/50 uppercase mt-1">THEN</span>
                <span className="font-mono text-xs text-[#00F5FF] uppercase mt-1">{auto.action.replace('_', ' ')}</span>
              </div>
            </div>
          ))
        )}
      <div className="text-xs font-mono text-[#00F5FF] uppercase tracking-widest mb-4 w-full px-4 border-b border-[#00F5FF]/20 pb-2 mt-8 text-center flex items-center justify-center gap-2">
        <Server className="w-3 h-3" /> Offline Models
      </div>
      
      <div className="flex flex-col gap-3 px-2 w-full max-w-sm mb-6">
        {Object.entries(offlineModels).map(([key, val]) => (
          <div key={key} className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase text-white/50 pl-1">{key.toUpperCase()} MODEL</span>
            <input 
              type="text" 
              value={val}
              onChange={(e) => setOfflineModels(prev => ({ ...prev, [key]: e.target.value }))}
              className="bg-black/50 border border-white/10 text-[#00F5FF] text-xs font-mono p-2 focus:outline-none focus:border-[#00F5FF]/50 transition-colors"
            />
          </div>
        ))}
        <button 
          onClick={async () => {
            if (config) {
              const newConfig = { 
                ...config,
                wakeword: { ...config.wakeword, model_path: offlineModels.wakeword_model_path },
                stt: { ...config.stt, model_size: offlineModels.stt_model_size },
                tts: { ...config.tts, voice: offlineModels.tts_voice },
                intent: { 
                  ...config.intent, 
                  router_model: offlineModels.intent_router_model,
                  chat_model: offlineModels.intent_chat_model,
                  coder_model: offlineModels.intent_coder_model
                }
              };
              setConfig(newConfig);
              await updateConfig(newConfig);
            }
          }}
          className="mt-2 border border-white/10 bg-white/5 hover:bg-[#00F5FF]/20 hover:border-[#00F5FF]/50 hover:text-[#00F5FF] text-white/50 transition-colors p-2 text-[10px] font-mono uppercase tracking-widest flex items-center justify-center"
        >
          Save Model Config
        </button>
      </div>

      </div>
    </div>
  );
};
