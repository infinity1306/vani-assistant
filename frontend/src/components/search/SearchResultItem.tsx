import { SearchResult } from '../../core/store/appStore';
import { motion } from 'framer-motion';

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onSelect: (id: string) => void;
  index: number;
}

export const SearchResultItem = ({ result, isSelected, onSelect, index }: SearchResultItemProps) => {
  const getIcon = () => {
    switch (result.type) {
      case 'file':
        return <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] flex items-center justify-center font-bold shadow-[inset_0_0_10px_rgba(0,240,255,0.2)]">F</div>;
      case 'memory':
        return <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-secondary)]/10 text-[var(--color-brand-secondary)] flex items-center justify-center font-bold shadow-[inset_0_0_10px_rgba(255,0,255,0.2)]">M</div>;
      case 'web':
        return <div className="w-10 h-10 rounded-lg bg-[var(--color-state-success)]/10 text-[var(--color-state-success)] flex items-center justify-center font-bold shadow-[inset_0_0_10px_rgba(0,255,157,0.2)]">W</div>;
      case 'agent':
        return <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-accent)]/10 text-[var(--color-brand-accent)] flex items-center justify-center font-bold shadow-[inset_0_0_10px_rgba(124,58,237,0.2)]">A</div>;
    }
  };

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={`flex items-center justify-between p-3 px-4 rounded-xl cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/40 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
          : 'hover:bg-white/5 border border-transparent'
      }`}
      onClick={() => onSelect(result.id)}
    >
      <div className="flex items-center space-x-4">
        {getIcon()}
        <div className="flex flex-col">
          <span className={`text-base tracking-wide font-display ${isSelected ? 'text-[var(--color-brand-primary)] text-glow-primary' : 'text-slate-200'}`}>
            {result.title}
          </span>
          <span className="text-xs text-slate-500 font-mono mt-0.5 opacity-80">
            {result.subtitle}
          </span>
        </div>
      </div>
      
      {isSelected && (
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono bg-[var(--color-brand-primary)]/20 px-2 py-1 rounded text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/30">
            ↵ open
          </span>
          <span className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded text-slate-400 border border-white/10">
            Alt+K options
          </span>
        </div>
      )}
    </motion.li>
  );
};
