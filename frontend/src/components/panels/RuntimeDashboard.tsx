import React from 'react';
import { useOSStore } from '../../core/store/useOSStore';

export const RuntimeDashboard: React.FC = () => {
  const { runtimeState, fps, latency, cpuHistory, ramHistory } = useOSStore();

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="bg-white/5 border border-white/5 p-4 relative overflow-hidden" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
        <div className="text-xs font-mono text-white/40 uppercase tracking-widest mb-1">Global State</div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${runtimeState === 'ERROR' ? 'bg-red-500' : 'bg-[#00F5FF] animate-pulse'} shadow-[0_0_10px_rgba(0,245,255,0.8)]`} />
          <div className="text-white font-mono uppercase tracking-widest text-lg">{runtimeState}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">CPU Usage</div>
            <div className="text-xl font-mono text-[#00F5FF] mt-1">{cpuHistory[cpuHistory.length - 1]?.toFixed(1)}%</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">RAM Usage</div>
            <div className="text-xl font-mono text-[#00F5FF] mt-1">{ramHistory[ramHistory.length - 1]?.toFixed(1)}%</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Latency</div>
            <div className="text-xl font-mono text-[#00F5FF] mt-1">{latency}ms</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/5">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">FPS</div>
            <div className="text-xl font-mono text-[#00F5FF] mt-1">{fps}</div>
        </div>
      </div>

      {/* Real Automation / Telemetry Graph */}
      <div className="flex-1 mt-4 border-t border-white/10 pt-4 flex flex-col">
        <div className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4">Live Telemetry</div>
        <div className="flex-1 w-full relative flex items-end justify-between gap-1 opacity-50">
            {cpuHistory.map((val, i) => (
                <div key={i} className="flex-1 bg-[#00F5FF] transition-all duration-300" style={{ height: `${Math.max(2, val)}%` }} />
            ))}
        </div>
      </div>
    </div>
  );
};
