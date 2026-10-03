import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore, RuntimeState } from '../../core/store/useOSStore';

const getStatusConfig = (state: RuntimeState) => {
  switch (state) {
    case 'LISTENING':
      return { text: 'AWAITING INPUT', color: 'bg-[#00F5FF]', shadow: 'shadow-[0_0_15px_rgba(0,245,255,0.8)]', animation: 'animate-pulse' };
    case 'THINKING':
      return { text: 'PROCESSING CONTEXT', color: 'bg-[#B026FF]', shadow: 'shadow-[0_0_15px_rgba(176,38,255,0.8)]', animation: 'animate-bounce' };
    case 'PROCESSING':
    case 'EXECUTING':
      return { text: 'EXECUTING DIRECTIVE', color: 'bg-[#00F5FF]', shadow: 'shadow-[0_0_15px_rgba(0,245,255,0.8)]', animation: 'animate-spin' };
    case 'SPEAKING':
      return { text: 'VOCALIZING', color: 'bg-[#00F5FF]', shadow: 'shadow-[0_0_15px_rgba(0,245,255,0.8)]', animation: 'animate-ping' };
    case 'ERROR':
      return { text: 'CRITICAL ERROR', color: 'bg-red-500', shadow: 'shadow-[0_0_15px_rgba(255,0,0,0.8)]', animation: 'animate-pulse' };
    case 'SHUTTING_DOWN':
      return { text: 'SHUTTING DOWN...', color: 'bg-yellow-500', shadow: 'shadow-[0_0_15px_rgba(255,255,0,0.8)]', animation: 'animate-pulse' };
    case 'READY':
    case 'IDLE':
    default:
      return { text: 'SYSTEM ONLINE', color: 'bg-[#00F5FF]', shadow: 'shadow-[0_0_15px_rgba(0,245,255,0.4)]', animation: 'animate-pulse' };
  }
};

const STATUS_ITEMS = [
  'CORE STABILITY 99.98%',
  'MEMORY LINKED',
  'VOICE ENGINE READY',
  'VISION READY',
  'NETWORK READY',
  'GPU ACCELERATION ACTIVE',
];

export const StatusPanel: React.FC = () => {
  const { runtimeState, fps, memoryUsage, performanceMode } = useOSStore();
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const config = getStatusConfig(runtimeState);

  useEffect(() => {
    // Staggered appearance of status items
    const interval = setInterval(() => {
      setVisibleItems((prev) => {
        if (prev < STATUS_ITEMS.length) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 150); 
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="flex flex-col gap-2 pointer-events-none z-50 w-[280px]"
    >
      {/* Node Header */}
      <div 
        className="flex items-center gap-3 mb-2 p-3 bg-white/5 backdrop-blur-md border border-white/10"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
      >
        {/* Animated Runtime Indicator */}
        <div className="relative w-3 h-3 flex items-center justify-center">
          {runtimeState === 'THINKING' ? (
             <div className="flex gap-[2px]">
               <div className={`w-1 h-1 rounded-full ${config.color} ${config.shadow} ${config.animation}`} style={{ animationDelay: '0ms' }} />
               <div className={`w-1 h-1 rounded-full ${config.color} ${config.shadow} ${config.animation}`} style={{ animationDelay: '150ms' }} />
               <div className={`w-1 h-1 rounded-full ${config.color} ${config.shadow} ${config.animation}`} style={{ animationDelay: '300ms' }} />
             </div>
          ) : runtimeState === 'SPEAKING' ? (
             <div className="flex gap-[1px] items-center h-full">
               <div className={`w-[2px] h-3 bg-[#00F5FF] shadow-[0_0_10px_rgba(0,245,255,0.8)] animate-pulse`} />
               <div className={`w-[2px] h-2 bg-[#00F5FF] shadow-[0_0_10px_rgba(0,245,255,0.8)] animate-pulse`} style={{ animationDelay: '100ms' }} />
               <div className={`w-[2px] h-4 bg-[#00F5FF] shadow-[0_0_10px_rgba(0,245,255,0.8)] animate-pulse`} style={{ animationDelay: '200ms' }} />
             </div>
          ) : (
            <>
              <div className={`absolute inset-0 rounded-full ${config.color} ${config.animation} opacity-50`} />
              <div className={`w-2 h-2 rounded-full ${config.color} ${config.shadow}`} />
            </>
          )}
        </div>

        <motion.span 
          key={config.text}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-mono text-xs tracking-[0.2em] uppercase font-bold ${runtimeState === 'ERROR' ? 'text-red-500' : 'text-vani-text-primary'}`}
        >
          {config.text}
        </motion.span>
      </div>

      {/* Staggered List items */}
      <AnimatePresence>
        {STATUS_ITEMS.slice(0, visibleItems).map((item, index) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, height: 0, x: -20 }}
            animate={{ opacity: 1, height: 'auto', x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.05 }}
            className="flex items-center gap-2 overflow-hidden px-2"
          >
            <span className="text-[#00F5FF] font-mono text-[10px] opacity-70">◆</span>
            <span className="text-vani-text-secondary font-mono text-[10px] tracking-widest uppercase">
              {item}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Real-time Dynamic Metrics - Shard Style */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: visibleItems === STATUS_ITEMS.length ? 1 : 0, y: visibleItems === STATUS_ITEMS.length ? 0 : 10 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
        className="mt-6 flex flex-col gap-1 p-3 bg-black/20 backdrop-blur-lg border border-[#00F5FF]/20"
        style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}
      >
        <div className="flex justify-between items-center border-b border-[#00F5FF]/30 pb-2 mb-2">
          <span className="text-vani-text-muted font-mono text-[10px] uppercase tracking-widest">Telemetry</span>
          <span className="text-[#00F5FF] font-mono text-[10px] uppercase font-bold">{performanceMode}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-vani-text-muted font-mono text-[10px] uppercase">FPS_RATE</span>
          <span className="text-white font-mono text-[10px] font-bold">{(fps || 0).toFixed(0)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-vani-text-muted font-mono text-[10px] uppercase">MEM_ALLOC</span>
          <span className="text-white font-mono text-[10px] font-bold">{(memoryUsage || 0).toFixed(1)} MB</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
