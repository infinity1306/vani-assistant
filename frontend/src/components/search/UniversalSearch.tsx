import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, SearchResult } from '../../core/store/appStore';
import { SearchResultItem } from './SearchResultItem';
import { searchWebOrFiles, openFile } from '../../core/api/client';

export const UniversalSearch: React.FC = () => {
  const { isSearchModalOpen, setSearchModalOpen, inputQuery, setInputQuery } = useAppStore();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchModalOpen) {
      // Small delay to ensure render
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchModalOpen]);

  useEffect(() => {
    if (!inputQuery) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchWebOrFiles(inputQuery);
      if (res.success && res.data) {
        setResults(res.data);
      }
    }, 200); // Debounce search
    return () => clearTimeout(timer);
  }, [inputQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setSearchModalOpen(false);
      setInputQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        const selected = results[selectedIndex];
        console.log('Selected:', selected);
        if (selected.type === 'file') {
          openFile(selected.subtitle); // Pass the subtitle since it contains the path
        }
      }
      setSearchModalOpen(false);
    }
  };

  if (!isSearchModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(5,5,8,0.6)] backdrop-blur-md"
      onClick={() => {
        setSearchModalOpen(false);
        setInputQuery('');
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl glass-panel glass-heavy shadow-[0_20px_60px_rgba(0,0,0,0.8),_0_0_40px_rgba(0,240,255,0.1)] overflow-hidden flex flex-col border-[var(--color-brand-primary)]/20"
      >
        {/* Search Input Area */}
        <div className="flex items-center p-5 border-b border-white/10 bg-[rgba(0,240,255,0.02)]">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--color-brand-primary)]/30 border-t-[var(--color-brand-primary)] animate-spin mr-5 shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-white text-3xl outline-none placeholder:text-slate-500 font-display tracking-wide"
            value={inputQuery}
            onChange={(e) => {
              setInputQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search files, memories, web..."
            spellCheck={false}
          />
          <button 
            onClick={() => {
              setSearchModalOpen(false);
              setInputQuery('');
            }}
            className="ml-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded border border-white/20 text-sm font-semibold transition-all shadow-lg flex items-center gap-2"
            title="Go Back"
          >
            ← Back
          </button>
        </div>

        {/* Results Area */}
        <div className="p-3 max-h-[600px] overflow-y-auto custom-scrollbar">
          {inputQuery.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center text-slate-500">
              <span className="text-4xl mb-4">⌘</span>
              <span className="font-mono text-sm tracking-widest uppercase">Start typing to scan the system</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-mono text-[var(--color-brand-primary)] uppercase tracking-widest px-4 py-2 opacity-80">
                Top Matches
              </div>
              <ul className="flex flex-col gap-1.5 px-2 pb-2">
                {results.map((result, idx) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    index={idx}
                    isSelected={idx === selectedIndex}
                    onSelect={(id) => {
                      const selected = results.find(r => r.id === id);
                      if (selected && selected.type === 'file') {
                        openFile(selected.subtitle);
                      }
                      setSearchModalOpen(false);
                    }}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
