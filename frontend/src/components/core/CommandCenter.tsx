import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "../../core/store/appStore";
import { sendCommand } from "../../core/api/client";
import { ContextPill } from "./ContextPill";
import { SuggestionsMenu, AGENTS } from "../search/SuggestionsMenu";

interface CommandCenterProps {
  errorMsg: string | null;
  onFocusInput: (focusFn: () => void) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ errorMsg, onFocusInput }) => {
  const { inputQuery, setInputQuery, orbState, setOrbState, isSearchModalOpen, setSearchModalOpen, response, setResponse } = useAppStore();
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Expose focus method to parent (App.tsx) so it can focus on shortcut press
    onFocusInput(() => {
      inputRef.current?.focus();
    });
  }, [onFocusInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (!inputQuery.startsWith('/')) {
        e.preventDefault();
        handleSubmit(e as any);
        return;
      }
    }

    if (inputQuery.startsWith('/')) {
      const queryTokens = inputQuery.split(' ');
      const currentToken = queryTokens[0].toLowerCase();
      const filteredAgents = AGENTS.filter(agent => agent.trigger.startsWith(currentToken));

      if (filteredAgents.length > 0 && queryTokens.length === 1) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSuggestionIndex(prev => (prev + 1) % filteredAgents.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSuggestionIndex(prev => (prev - 1 + filteredAgents.length) % filteredAgents.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSelectSuggestion(filteredAgents[suggestionIndex].trigger);
        }
      }
    }
  };

  const handleSelectSuggestion = (trigger: string) => {
    setInputQuery(trigger + ' ');
    setSuggestionIndex(0);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || orbState === 'THINKING') return;

    setOrbState('THINKING');
    setResponse(null);

    // Simulate thinking state slightly for visual delight
    await new Promise(r => setTimeout(r, 400));
    setOrbState('EXECUTING');

    const res = await sendCommand(inputQuery);
    if (res.success) {
      setResponse(typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2));
    } else {
      setResponse(`Error: ${res.error}`);
    }

    setOrbState('IDLE');
    setInputQuery("");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: isSearchModalOpen ? 0.2 : 1, scale: isSearchModalOpen ? 0.92 : 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`z-10 w-full max-w-3xl flex flex-col mt-24 relative ${isSearchModalOpen ? 'pointer-events-none' : ''}`}
    >
      <ContextPill />
      
      {/* Main Glass Command Bar */}
      <div className="glass-panel w-full flex items-center p-3 px-6 transition-all duration-300 focus-within:shadow-[0_0_30px_rgba(0,240,255,0.15)] focus-within:border-[rgba(0,240,255,0.4)]">
        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-5">
          {/* Status Indicator */}
          <div className={`w-3 h-3 rounded-full transition-all duration-500 shadow-[0_0_12px_currentColor] ${
            orbState === 'THINKING' ? 'bg-[var(--color-brand-secondary)] animate-pulse scale-110' : 
            orbState === 'EXECUTING' ? 'bg-[var(--color-state-success)] animate-pulse scale-125' : 
            orbState === 'LISTENING' ? 'bg-[var(--color-brand-primary)] animate-pulse scale-110' : 'bg-[var(--color-text-muted)] scale-100 shadow-none'
          }`} />
          
          {/* Text Input */}
          <textarea
            ref={inputRef as any}
            rows={1}
            className={`flex-1 bg-transparent border-none py-3 outline-none font-display tracking-wide transition-all duration-300 resize-none max-h-32 overflow-y-auto ${
              inputQuery.length > 0 ? 'text-white text-3xl text-glow' : 'text-slate-400 text-2xl'
            }`}
            value={inputQuery}
            onChange={(e) => {
              setInputQuery(e.target.value);
              setSuggestionIndex(0);
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={handleKeyDown as any}
            placeholder="Ask VANI..."
            disabled={orbState === 'THINKING'}
            spellCheck={false}
          />
          
          {/* Refresh Action */}
          <div 
            className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-slate-400 text-xs font-mono cursor-pointer hover:bg-[var(--color-brand-primary)]/20 hover:text-[var(--color-brand-primary)] hover:border-[var(--color-brand-primary)]/50 transition-all duration-300"
            title="Refresh UI (Ctrl+R)"
            onClick={() => window.location.reload()}
          >
            <span>↻</span>
          </div>

          {/* Universal Search Hint */}
          {!inputQuery && (
            <div 
              className="flex items-center space-x-1 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-slate-400 text-xs font-mono cursor-pointer hover:bg-[var(--color-brand-accent)]/20 hover:text-[var(--color-brand-accent)] hover:border-[var(--color-brand-accent)]/50 transition-all duration-300"
              onClick={() => setSearchModalOpen(true)}
            >
              <span>Ctrl K</span>
            </div>
          )}
        </form>
      </div>

      <SuggestionsMenu selectedIndex={suggestionIndex} onSelect={handleSelectSuggestion} />
      
      {/* Responses and Errors */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="mt-6 p-4 rounded-xl border-l-4 border-[var(--color-state-error)] bg-[rgba(255,0,85,0.1)] backdrop-blur-md shadow-[0_0_20px_rgba(255,0,85,0.2)]"
          >
            <div className="flex items-start gap-3">
              <span className="text-[var(--color-state-error)] text-lg">⚠️</span>
              <p className="text-[var(--color-state-error)] font-mono text-sm leading-relaxed text-glow-error">
                {errorMsg}
              </p>
            </div>
          </motion.div>
        )}
        
        {response && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="glass-panel glass-heavy w-full mt-6 p-6 text-cyan-50 text-sm font-mono overflow-y-auto max-h-[500px] border-t-[var(--color-brand-primary)]/30"
          >
            <pre className="whitespace-pre-wrap break-words">{response}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
