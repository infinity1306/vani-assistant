import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../../core/store/useOSStore';
import { Mic, MicOff, Terminal } from 'lucide-react';
import { sendCommand } from '../../core/api/client';

export const CommandConsole: React.FC = () => {
  const { runtimeState, setRuntimeState } = useOSStore();
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  if (runtimeState === 'OFF' || runtimeState === 'STARTING') return null;

  const handleVoiceToggle = () => {
    if (runtimeState === 'LISTENING') {
      setRuntimeState('IDLE');
    } else {
      setRuntimeState('LISTENING');
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const command = inputValue.trim();
      setInputValue('');
      useOSStore.getState().addSystemEvent(`Executing command: ${command}`, 'info', 'terminal');
      
      const res = await sendCommand(command);
      if (res.success) {
        useOSStore.getState().addSystemEvent(`Command success: ${res.data}`, 'success', 'terminal');
      } else {
        useOSStore.getState().addSystemEvent(`Command failed: ${res.error}`, 'error', 'terminal');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.5 }}
      className="absolute bottom-12 w-full flex flex-col items-center justify-end z-50 pointer-events-auto"
    >
      <div className="relative group flex items-center justify-center">
        
        {/* Shard Background Shape */}
        <motion.div 
          animate={{ 
            boxShadow: isFocused 
              ? '0 0 50px rgba(0, 245, 255, 0.15), inset 0 0 20px rgba(0, 245, 255, 0.05)' 
              : '0 10px 40px rgba(0, 0, 0, 0.5)',
          }}
          className="absolute inset-0 bg-[rgba(10,10,12,0.7)] backdrop-blur-2xl border border-white/5 transition-colors duration-500 z-0"
          style={{ 
            clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)' 
          }}
        />

        {/* Dynamic Inner Glow Line */}
        <AnimatePresence>
          {isFocused && (
            <motion.div 
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-[#00F5FF] to-transparent opacity-50 z-10"
            />
          )}
        </AnimatePresence>

        <div className="relative z-10 flex items-center w-[600px] h-[52px] px-8">
          <Terminal className="w-4 h-4 text-[#00F5FF]/70 mr-4 shrink-0" />
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="AWAITING DIRECTIVE..."
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-[13px] tracking-widest placeholder:text-white/20"
            spellCheck={false}
          />

          {/* Typing Indicator / Cursor logic could go here */}
          
          {/* Voice Mode Toggle */}
          <button 
            onClick={handleVoiceToggle}
            className={`ml-4 p-2 relative group-button ${
              runtimeState === 'LISTENING' 
                ? 'text-[#00F5FF]' 
                : 'text-white/30 hover:text-white/80'
            }`}
          >
            <AnimatePresence mode="wait">
              {runtimeState === 'LISTENING' ? (
                <motion.div 
                  key="mic-on"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Mic className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="mic-off"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <MicOff className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Active Voice Glow */}
            {runtimeState === 'LISTENING' && (
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-0 bg-[#00F5FF] rounded-full blur-md -z-10"
              />
            )}
          </button>
        </div>
      </div>

      {/* Voice Visualizer */}
      <AnimatePresence>
        {runtimeState === 'LISTENING' && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: 10, filter: 'blur(5px)' }}
            animate={{ opacity: 1, height: 24, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, height: 0, y: -10, filter: 'blur(5px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-[600px] mt-4 flex justify-center items-end gap-[3px] overflow-hidden"
          >
            {[...Array(32)].map((_, i) => (
              <motion.div 
                key={i}
                animate={{ 
                  height: [
                    2, 
                    Math.random() * 20 + 4, 
                    Math.random() * 10 + 2, 
                    2
                  ] 
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.8 + Math.random() * 0.4,
                  ease: "easeInOut"
                }}
                className="w-1 bg-gradient-to-t from-[#00F5FF]/20 to-[#00F5FF] rounded-t-sm shadow-[0_0_8px_rgba(0,245,255,0.5)]"
                style={{
                  transformOrigin: 'bottom'
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
