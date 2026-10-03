import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../../core/store/useOSStore';

export const SystemEvents: React.FC = () => {
  const { systemEvents } = useOSStore();
  
  // Show the 5 most recent events, reversed so newest is at the top or bottom depending on flex direction
  // Since we use flex-col, let's keep newest at the top
  const displayEvents = [...systemEvents]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-2 pointer-events-none z-50 w-[300px]">
      <AnimatePresence>
        {displayEvents.map((event) => (
          <motion.div
            key={event.id}
            layout
            initial={{ opacity: 0, x: 50, filter: 'blur(10px)', scale: 0.9 }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, x: 20, filter: 'blur(5px)', scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }}
            className={`
              relative p-3 backdrop-blur-md border flex items-center gap-3 overflow-hidden
              ${event.type === 'success' ? 'bg-[#00F5FF]/10 border-[#00F5FF]/30' : 
                event.type === 'warning' ? 'bg-[#FF9900]/10 border-[#FF9900]/30' : 
                'bg-white/5 border-white/10'
              }
            `}
            style={{ 
              clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' 
            }}
          >
            {/* Shard Highlight Line */}
            <div 
              className={`absolute top-0 left-0 w-1 h-full 
                ${event.type === 'success' ? 'bg-[#00F5FF]' : 
                  event.type === 'warning' ? 'bg-[#FF9900]' : 
                  'bg-white/50'
                }
              `} 
            />
            
            <div className={`w-2 h-2 rounded-sm rotate-45 shrink-0
                ${event.type === 'success' ? 'bg-[#00F5FF] shadow-[0_0_8px_rgba(0,245,255,0.8)]' : 
                  event.type === 'warning' ? 'bg-[#FF9900] shadow-[0_0_8px_rgba(255,153,0,0.8)]' : 
                  'bg-white/50'
                }
            `} />
            
            <span className={`font-mono text-[11px] uppercase tracking-wider
                ${event.type === 'success' ? 'text-[#00F5FF]' : 
                  event.type === 'warning' ? 'text-[#FF9900]' : 
                  'text-vani-text-secondary'
                }
            `}>
              {event.message}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
