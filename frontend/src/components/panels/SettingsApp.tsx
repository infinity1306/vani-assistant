import React, { useEffect, useState } from 'react';
import { useOSStore } from '../../core/store/useOSStore';
import { getConfig, updateConfig } from '../../core/api/client';
import { Save } from 'lucide-react';

export const SettingsApp: React.FC = () => {
  const { performanceMode, setPerformanceMode } = useOSStore();
  const [config, setConfig] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getConfig().then(data => {
      if (data) setConfig(data);
    });
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    await updateConfig(config);
    setIsSaving(false);
  };

  const updateNestedConfig = (section: string, key: string, value: string) => {
    setConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  if (!config) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-white/40 font-mono text-sm">
        Loading configuration...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto custom-scrollbar pr-2 pb-10">
      
      {/* Graphics Mode */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-mono text-white/40 uppercase tracking-widest">Graphics Mode</div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setPerformanceMode('luxury')}
            className={`p-3 font-mono text-xs tracking-widest uppercase transition-colors border ${performanceMode === 'luxury' ? 'bg-[#00F5FF]/20 border-[#00F5FF] text-[#00F5FF]' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
            style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
          >
            Luxury
          </button>
          <button 
            onClick={() => setPerformanceMode('performance')}
            className={`p-3 font-mono text-xs tracking-widest uppercase transition-colors border ${performanceMode === 'performance' ? 'bg-[#00F5FF]/20 border-[#00F5FF] text-[#00F5FF]' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
            style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
          >
            Performance
          </button>
        </div>
      </div>
      
      {/* Offline Model Selection */}
      <div className="flex flex-col gap-4">
        <div className="text-xs font-mono text-[#00F5FF] uppercase tracking-widest border-b border-[#00F5FF]/20 pb-1">AI Engine Selection</div>
        
        {/* STT Model */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-white/50 uppercase">STT Model (Whisper)</label>
          <select 
            value={config.stt?.model_size || 'tiny'}
            onChange={(e) => updateNestedConfig('stt', 'model_size', e.target.value)}
            className="bg-black/50 border border-white/10 text-white font-mono text-xs p-2 outline-none focus:border-[#00F5FF]/50" 
            style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
          >
            <option value="tiny">Tiny (Fastest, Low RAM)</option>
            <option value="small">Small (Balanced)</option>
            <option value="medium">Medium (Accurate)</option>
            <option value="large-v2">Large V2 (Highest Accuracy)</option>
          </select>
        </div>

        {/* Intent Router Model */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-white/50 uppercase">Intent Router (Ollama)</label>
          <select 
            value={config.intent?.router_model || 'llama3.2:1b'}
            onChange={(e) => updateNestedConfig('intent', 'router_model', e.target.value)}
            className="bg-black/50 border border-white/10 text-white font-mono text-xs p-2 outline-none focus:border-[#00F5FF]/50" 
            style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
          >
            <option value="llama3.2:1b">llama3.2:1b (Ultra Fast)</option>
            <option value="llama3.1:latest">llama3.1:8b (Standard)</option>
            <option value="gemma2:9b">gemma2:9b (Accurate)</option>
          </select>
        </div>

        {/* Chat Model */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-white/50 uppercase">Chat Model (Ollama)</label>
          <select 
            value={config.intent?.chat_model || 'llama3.1:latest'}
            onChange={(e) => updateNestedConfig('intent', 'chat_model', e.target.value)}
            className="bg-black/50 border border-white/10 text-white font-mono text-xs p-2 outline-none focus:border-[#00F5FF]/50" 
            style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
          >
            <option value="llama3.2:1b">llama3.2:1b (Fast Response)</option>
            <option value="llama3.1:latest">llama3.1:8b (Smart Chat)</option>
            <option value="gemma2:9b">gemma2:9b (Creative)</option>
            <option value="deepseek-r1:8b">deepseek-r1:8b (Coding/Logic)</option>
          </select>
        </div>

        {/* TTS Voice */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-white/50 uppercase">TTS Voice (Edge TTS)</label>
          <select 
            value={config.tts?.voice || 'en-IN-NeerjaNeural'}
            onChange={(e) => updateNestedConfig('tts', 'voice', e.target.value)}
            className="bg-black/50 border border-white/10 text-white font-mono text-xs p-2 outline-none focus:border-[#00F5FF]/50" 
            style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
          >
            <option value="en-IN-NeerjaNeural">Neerja (Indian English Female)</option>
            <option value="en-US-AriaNeural">Aria (US English Female)</option>
            <option value="en-GB-SoniaNeural">Sonia (UK English Female)</option>
            <option value="en-US-GuyNeural">Guy (US English Male)</option>
          </select>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={isSaving}
        className="mt-4 border border-[#00F5FF]/30 bg-[#00F5FF]/10 hover:bg-[#00F5FF]/20 text-[#00F5FF] transition-colors p-3 flex items-center justify-center gap-2 group" 
        style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
      >
        <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="font-mono text-xs uppercase tracking-widest">{isSaving ? 'Saving...' : 'Apply Configuration'}</span>
      </button>
      
    </div>
  );
};
