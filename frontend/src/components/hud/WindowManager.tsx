import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../../core/store/useOSStore';
import { X } from 'lucide-react';
import { RuntimeDashboard } from '../panels/RuntimeDashboard';
import { ModuleManager } from '../panels/ModuleManager';
import { AutomationCenter } from '../panels/AutomationCenter';
import { SettingsApp } from '../panels/SettingsApp';
import { DeveloperMode } from '../panels/DeveloperMode';

export const WindowManager: React.FC = () => {
  const { isDashboardOpen, toggleDashboard, activePanel } = useOSStore();

  const renderActivePanel = () => {
    switch (activePanel) {
      case 'runtime': return <RuntimeDashboard />;
      case 'modules': return <ModuleManager />;
      case 'automations': return <AutomationCenter />;
      case 'settings': return <SettingsApp />;
      case 'developer': return <DeveloperMode />;
      default: return null;
    }
  };

  const getPanelTitle = () => {
    switch (activePanel) {
      case 'runtime': return 'VANI RUNTIME';
      case 'modules': return 'MODULE TOPOLOGIES';
      case 'automations': return 'AUTOMATION CENTER';
      case 'settings': return 'SYSTEM SETTINGS';
      case 'developer': return 'DEVELOPER CONSOLE';
      default: return 'NEXUS DASHBOARD';
    }
  };

  return (
    <AnimatePresence>
      {isDashboardOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300, filter: 'blur(10px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: 300, filter: 'blur(10px)' }}
          transition={{ type: 'spring', stiffness: 250, damping: 25, mass: 0.8 }}
          className="absolute right-0 top-0 bottom-0 w-[400px] pointer-events-auto z-40 p-6 flex flex-col justify-center"
        >
          {/* Main Shard Panel */}
          <div className="relative w-full h-[85vh] flex group">
            
            {/* Background Shard */}
            <motion.div 
              className="absolute inset-0 bg-[#0A0A0C]/90 backdrop-blur-3xl border-l border-t border-b border-white/10"
              style={{
                clipPath: 'polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)'
              }}
            >
              {/* Animated Grid Overlay */}
              <div 
                className="absolute inset-0 opacity-10" 
                style={{
                  backgroundImage: 'radial-gradient(circle at center, #00F5FF 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />
            </motion.div>

            {/* Content Container */}
            <div className="relative z-10 w-full h-full flex flex-col p-6 overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-[#00F5FF] rounded-sm rotate-45 shadow-[0_0_10px_rgba(0,245,255,0.8)]" />
                  <span className="font-mono text-sm tracking-widest text-[#00F5FF] uppercase">{getPanelTitle()}</span>
                </div>
                
                <button 
                  onClick={toggleDashboard}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic Content */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePanel}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {renderActivePanel()}
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
