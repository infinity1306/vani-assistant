import React from 'react';
import { useAppStore } from '../../core/store/appStore';

export const ContextPill: React.FC = () => {
  const { activeContext } = useAppStore();

  if (!activeContext) return null;

  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 mb-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md animate-pulse-slow w-fit mx-auto shadow-lg">
      <div className="w-2 h-2 rounded-full bg-[var(--color-brand-accent)] shadow-[0_0_8px_var(--color-brand-accent)] animate-pulse"></div>
      <span className="text-xs font-mono text-white/80 tracking-wide uppercase">
        {activeContext}
      </span>
    </div>
  );
};
