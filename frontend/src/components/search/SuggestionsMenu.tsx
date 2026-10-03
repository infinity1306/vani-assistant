import React from 'react';
import { useAppStore } from '../../core/store/appStore';

export const AGENTS = [
  { trigger: '/system', name: 'System Agent', description: 'OS-level commands & settings' },
  { trigger: '/coding', name: 'Coding Agent', description: 'Code generation & analysis' },
  { trigger: '/browser', name: 'Browser Agent', description: 'Web search & automation' },
  { trigger: '/memory', name: 'Memory Agent', description: 'Recall past conversations' },
  { trigger: '/orchestrator', name: 'Orchestrator', description: 'Delegate to multiple agents' },
];

interface SuggestionsMenuProps {
  selectedIndex: number;
  onSelect: (trigger: string) => void;
}

export const SuggestionsMenu: React.FC<SuggestionsMenuProps> = ({ selectedIndex, onSelect }) => {
  const { inputQuery } = useAppStore();

  if (!inputQuery.startsWith('/')) {
    return null;
  }

  const queryTokens = inputQuery.split(' ');
  const currentToken = queryTokens[0].toLowerCase();
  
  // Only show if the current token is an incomplete command or exact match (before typing next word)
  if (queryTokens.length > 1 && AGENTS.some(a => a.trigger === currentToken)) {
      return null;
  }

  const filteredAgents = AGENTS.filter(agent => agent.trigger.startsWith(currentToken));

  if (filteredAgents.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 p-2 glass-panel glass-heavy shadow-2xl z-50">
      <div className="text-xs font-mono text-white/40 mb-2 px-2 uppercase tracking-wider">Agents</div>
      <ul className="flex flex-col gap-1">
        {filteredAgents.map((agent, index) => (
          <li
            key={agent.trigger}
            className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
              index === selectedIndex 
                ? 'bg-white/10 text-white border border-white/20' 
                : 'hover:bg-white/5 text-white/70 border border-transparent'
            }`}
            onClick={() => onSelect(agent.trigger)}
          >
            <div className="flex items-center space-x-3">
              <span className="font-mono font-bold text-[var(--color-brand-primary)]">
                {agent.trigger}
              </span>
              <span className="font-sans text-sm font-medium">
                {agent.name}
              </span>
            </div>
            <span className="text-xs font-sans text-white/50">
              {agent.description}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
