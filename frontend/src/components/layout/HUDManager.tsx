import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusPanel } from '../hud/StatusPanel';
import { CommandConsole } from '../hud/CommandConsole';
import { SystemEvents } from '../hud/SystemEvents';
import { WindowManager } from '../hud/WindowManager';
import { Dock } from '../hud/Dock';
import { useOSStore } from '../../core/store/useOSStore';

export const HUDManager: React.FC = () => {
  const [safeArea, setSafeArea] = useState({ padding: '24px' });
  const { runtimeState, triggerBootSequence } = useOSStore();

  const isOff = runtimeState === 'OFF';
  const isStarting = runtimeState === 'STARTING';
  const showHUD = !isOff && !isStarting;

  // Dynamic safe area calculation reacting to window resize
  useEffect(() => {
    const updateSafeArea = () => {
      // 24px minimum, scale up with large displays but cap at 48px
      const padding = Math.max(24, Math.min(window.innerWidth * 0.03, 48));
      setSafeArea({ padding: `${padding}px` });
    };
    
    window.addEventListener('resize', updateSafeArea);
    updateSafeArea();
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return (
    <div 
      className="absolute inset-0 z-20 pointer-events-none"
      style={{ padding: safeArea.padding }}
    >
      <AnimatePresence>
        {isOff && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto z-[110]"
          >
            <button 
              onClick={triggerBootSequence}
              className="w-32 h-32 rounded-full border border-vani-border bg-vani-background/50 backdrop-blur-md flex flex-col items-center justify-center gap-4 hover:border-vani-accent hover:bg-vani-accent/10 transition-all duration-500 group"
            >
              <div className="w-8 h-8 rounded-full border-2 border-vani-text-muted group-hover:border-vani-accent group-hover:shadow-[0_0_15px_rgba(0,255,255,0.5)] transition-all" />
              <span className="font-mono text-xs tracking-[0.2em] text-vani-text-muted group-hover:text-vani-accent transition-colors">AWAKEN</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHUD && (
          <motion.div 
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.5 }}
            className="w-full h-full relative grid"
            style={{
              gridTemplateColumns: '320px 1fr 320px',
              gridTemplateRows: 'auto 1fr auto',
              gridTemplateAreas: `
                "status . events"
                ". . ."
                ". console ."
              `,
              gap: '24px'
            }}
          >
            {/* HUD Zones - Enable pointer events only on interactive widgets */}
            <div style={{ gridArea: 'status' }} className="pointer-events-auto flex flex-col justify-start">
              <StatusPanel />
            </div>
            
            <div style={{ gridArea: 'events' }} className="pointer-events-auto flex flex-col justify-start items-end">
              <SystemEvents />
            </div>
            
            <div style={{ gridArea: 'console' }} className="pointer-events-auto flex flex-col justify-end items-center pb-8">
              <CommandConsole />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHUD && (
          <>
            <WindowManager />
            <Dock />
          </>
        )}
      </AnimatePresence>
      
    </div>
  );
};
