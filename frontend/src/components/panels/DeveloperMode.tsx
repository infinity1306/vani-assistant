import React from 'react';
import { useOSStore } from '../../core/store/useOSStore';

export const DeveloperMode: React.FC = () => {
  const { systemEvents } = useOSStore();

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="text-xs font-mono text-white/40 uppercase tracking-widest mb-2">Raw Event Stream</div>
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/50 p-4 border border-white/5 font-mono text-[10px]" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
        {systemEvents.length === 0 ? (
          <div className="text-white/20">Waiting for events...</div>
        ) : (
          systemEvents.map(ev => (
            <div key={ev.id} className="mb-1">
              <span className="text-white/30">[{new Date(ev.timestamp).toISOString().split('T')[1].replace('Z','')}]</span>{' '}
              <span className={ev.type === 'error' ? 'text-red-500' : ev.type === 'warning' ? 'text-yellow-500' : ev.type === 'success' ? 'text-green-500' : 'text-[#00F5FF]'}>
                {ev.module ? `<${ev.module.toUpperCase()}> ` : ''}{ev.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
