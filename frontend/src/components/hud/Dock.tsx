import React from 'react';
import { motion } from 'framer-motion';
import { useOSStore } from '../../core/store/useOSStore';
import { Activity, Layers, Zap, Settings, Terminal } from 'lucide-react';

export const Dock: React.FC = () => {
  const { runtimeState, activePanel, setActivePanel } = useOSStore();

  if (runtimeState === 'OFF' || runtimeState === 'STARTING') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.6 }}
      className="absolute bottom-12 right-12 z-50 pointer-events-auto"
    >
      <div 
        className="flex flex-col gap-3 p-3 bg-[rgba(10,10,12,0.6)] backdrop-blur-xl border border-white/5"
        style={{
          clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
        }}
      >
        <DockIcon 
          icon={<Activity className="w-5 h-5" />} 
          label="RUNTIME" 
          onClick={() => setActivePanel(activePanel === 'runtime' ? 'none' : 'runtime')} 
          active={activePanel === 'runtime'} 
        />
        <DockIcon 
          icon={<Layers className="w-5 h-5" />} 
          label="MODULES" 
          onClick={() => setActivePanel(activePanel === 'modules' ? 'none' : 'modules')} 
          active={activePanel === 'modules'} 
        />
        <DockIcon 
          icon={<Zap className="w-5 h-5" />} 
          label="AUTOMATIONS" 
          onClick={() => setActivePanel(activePanel === 'automations' ? 'none' : 'automations')} 
          active={activePanel === 'automations'} 
        />
        <DockIcon 
          icon={<Settings className="w-5 h-5" />} 
          label="SETTINGS" 
          onClick={() => setActivePanel(activePanel === 'settings' ? 'none' : 'settings')} 
          active={activePanel === 'settings'} 
        />
        <DockIcon 
          icon={<Terminal className="w-5 h-5" />} 
          label="DEVELOPER" 
          onClick={() => setActivePanel(activePanel === 'developer' ? 'none' : 'developer')} 
          active={activePanel === 'developer'} 
        />
      </div>
    </motion.div>
  );
};

interface DockIconProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}

const DockIcon: React.FC<DockIconProps> = ({ icon, label, onClick, active }) => {
  return (
    <button 
      onClick={onClick}
      className={`
        relative group p-3 flex items-center justify-center transition-colors
        ${active ? 'text-[#00F5FF]' : 'text-white/40 hover:text-white'}
      `}
    >
      {/* Hover Background Shard */}
      <div 
        className={`
          absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity
          ${active ? 'bg-[#00F5FF]/10 opacity-100' : ''}
        `}
        style={{
          clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)'
        }}
      />
      
      {/* Active Indicator Line */}
      {active && (
        <motion.div 
          layoutId="dockActive"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-[#00F5FF]"
        />
      )}

      <div className="relative z-10">
        {icon}
      </div>

      {/* Tooltip */}
      <div className="absolute right-full mr-4 px-2 py-1 bg-black/80 border border-white/10 text-[10px] font-mono tracking-widest text-white/80 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
        {label}
      </div>
    </button>
  );
};
