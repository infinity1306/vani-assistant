import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../../core/store/useOSStore';

export const BootSequence: React.FC = () => {
  const { runtimeState, modules, systemEvents } = useOSStore();
  
  // Only show when starting
  const isBooting = runtimeState === 'STARTING';

  // Get the latest boot-related events to show in the terminal
  const bootLogs = systemEvents
    .filter(e => e.timestamp > Date.now() - 10000) // recent events
    .slice(0, 5)
    .reverse();

  return (
    <AnimatePresence>
      {isBooting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0 z-[100] bg-vani-background flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Digital Grid Scanline Effect */}
          <motion.div 
            initial={{ translateY: '-100%' }}
            animate={{ translateY: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 border-t border-vani-accent opacity-20 bg-gradient-to-b from-vani-accent/5 to-transparent h-32 w-full"
          />

          <div className="relative z-10 flex flex-col items-center w-full max-w-2xl">
            {/* VANI Logo / Core representation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="w-24 h-24 mb-16 relative flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-vani-accent animate-spin" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-2 rounded-full border-r-2 border-b-2 border-vani-accent-glow animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
              <div className="w-2 h-2 rounded-full bg-vani-accent animate-pulse" />
            </motion.div>

            {/* Module Initialization Status */}
            <div className="grid grid-cols-2 gap-x-16 gap-y-4 mb-16 w-full px-12">
              {Object.entries(modules).map(([modName, stateObj]) => {
                const state = typeof stateObj === 'string' ? stateObj : (typeof (stateObj as any)?.status === 'string' ? (stateObj as any).status : 'UNKNOWN');
                const isActive = state === 'READY' || state === 'ACTIVE';
                const isError = state === 'ERROR';
                return (
                  <div key={modName} className="flex justify-between items-center border-b border-vani-border pb-1">
                    <span className="font-mono text-xs uppercase text-vani-text-primary tracking-widest">{modName}</span>
                    <span className={`font-mono text-[10px] uppercase tracking-widest ${isActive ? 'text-vani-accent' : isError ? 'text-red-500' : 'text-vani-text-muted animate-pulse'}`}>
                      {state}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Terminal Logs */}
            <div className="h-32 w-full flex flex-col items-center justify-end overflow-hidden px-12">
              <AnimatePresence mode="popLayout">
                {bootLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`font-mono text-[10px] tracking-[0.2em] mb-2 ${log.type === 'success' ? 'text-vani-accent' : log.type === 'warning' ? 'text-yellow-400' : 'text-vani-text-muted'}`}
                  >
                    {log.message.toUpperCase()}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
