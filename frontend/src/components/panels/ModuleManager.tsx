import React from 'react';
import { useOSStore } from '../../core/store/useOSStore';
import { Cpu, Database, Eye, Mic, Brain, Server, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

export const ModuleManager: React.FC = () => {
  const { modules } = useOSStore();

  const getModuleIcon = (mod: string) => {
    switch(mod.toLowerCase()) {
      case 'voice':
      case 'stt':
      case 'tts': return <Mic className="w-4 h-4" />;
      case 'vision': return <Eye className="w-4 h-4" />;
      case 'memory': return <Database className="w-4 h-4" />;
      case 'neural':
      case 'intent': return <Cpu className="w-4 h-4" />;
      case 'reasoning':
      case 'chat': return <Brain className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const moduleEntries = Object.entries(modules);

  if (moduleEntries.length === 0) {
    return (
      <div className="flex flex-col h-full gap-3 overflow-y-auto custom-scrollbar pr-2">
        <div className="text-white/40 font-mono text-sm text-center mt-10">No modules registered. Backend may be OFFLINE.</div>
      </div>
    );
  }

  // Pre-defined topology order for visual graph
  const topologyOrder = ['voice', 'vision', 'neural', 'reasoning', 'memory'];
  
  // Sort modules based on topology order, put unknowns at the end
  const sortedModules = [...moduleEntries].sort((a, b) => {
    const idxA = topologyOrder.indexOf(a[0].toLowerCase());
    const idxB = topologyOrder.indexOf(b[0].toLowerCase());
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full items-center pt-4 pb-12 overflow-y-auto custom-scrollbar">
      <div className="text-xs font-mono text-[#00F5FF] uppercase tracking-widest mb-6 w-full px-4 border-b border-[#00F5FF]/20 pb-2 text-center">
        System Topology
      </div>

      <div className="relative flex flex-col items-center gap-2 w-full px-4">
        {/* Animated Data Stream Background Line */}
        <div className="absolute top-0 bottom-0 w-[1px] bg-white/5 left-1/2 -translate-x-1/2 z-0">
           <motion.div 
             animate={{ y: ["0%", "100%"] }}
             transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
             className="w-full h-20 bg-gradient-to-b from-transparent via-[#00F5FF]/50 to-transparent"
           />
        </div>

        {sortedModules.map(([modName, modData]: [string, any], index) => {
          const state = typeof modData === 'string' ? modData : (typeof modData?.status === 'string' ? modData.status : 'OFFLINE');
          const isActive = state === 'READY' || state === 'ACTIVE';
          const isError = state === 'ERROR';
          
          return (
            <React.Fragment key={modName}>
              <div 
                className="p-3 w-full max-w-[240px] bg-black/80 backdrop-blur-md border border-white/10 flex flex-col relative group hover:border-[#00F5FF]/50 transition-colors z-10" 
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
              >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-sm bg-white/5 ${isActive ? 'text-[#00F5FF] shadow-[0_0_10px_rgba(0,245,255,0.3)]' : isError ? 'text-red-500' : 'text-white/30'}`}>
                      {getModuleIcon(modName)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-white font-mono text-[11px] uppercase tracking-widest truncate">{modName}</div>
                      <div className={`font-mono text-[9px] uppercase tracking-widest ${isActive ? 'text-[#00F5FF]' : isError ? 'text-red-500' : 'text-white/40'}`}>
                          {state}
                      </div>
                    </div>
                </div>
                
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                    <div className="text-[9px] font-mono text-white/40">
                        <span className={typeof modData?.health === 'string' && modData.health === 'healthy' ? 'text-green-400' : 'text-white/80'}>
                            {typeof modData?.health === 'string' ? modData.health : 'ok'}
                        </span>
                    </div>
                    <div className="text-[9px] font-mono text-[#00F5FF]/50">
                        {typeof modData?.latency === 'number' ? modData.latency : '<1'}ms
                    </div>
                </div>

                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00F5FF] shadow-[0_0_8px_rgba(0,245,255,0.8)] opacity-50 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              {/* Connecting Arrow */}
              {index < sortedModules.length - 1 && (
                <div className="py-1 z-10">
                  <ArrowDown className="w-3 h-3 text-white/20" />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  );
};
