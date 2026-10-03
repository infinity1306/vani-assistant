import { create } from 'zustand';

export type RuntimeState = 'OFF' | 'STARTING' | 'READY' | 'LISTENING' | 'THINKING' | 'PROCESSING' | 'SPEAKING' | 'EXECUTING' | 'IDLE' | 'ERROR' | 'SHUTTING_DOWN';
export type ModuleState = 'BOOTING' | 'INITIALIZING' | 'LOADING' | 'READY' | 'ACTIVE' | 'ERROR' | 'DISABLED' | 'OFFLINE';

export type OSModule = string; // Now dynamic based on backend
export type ActivePanel = 'none' | 'runtime' | 'modules' | 'automations' | 'settings' | 'developer';
export type AppMode = 'os' | 'superadmin';

export type DepthLayer = 0 | 1 | 2 | 3 | 4;
export type PerformanceMode = 'luxury' | 'performance';

export interface SystemEvent {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  module?: OSModule;
}

interface OSStoreState {
  // OS Global State
  runtimeState: RuntimeState;
  performanceMode: PerformanceMode;
  appMode: AppMode;
  
  // Module Lifecycles
  modules: Record<OSModule, any>;
  
  // Spatial Coordination
  activeDepthLayer: DepthLayer;
  isDashboardOpen: boolean;
  activePanel: ActivePanel;
  mousePosition: { x: number; y: number };

  // Real-time metrics
  fps: number;
  memoryUsage: number;
  latency: number;
  contextMemory: number;
  
  // Telemetry History
  cpuHistory: number[];
  ramHistory: number[];
  gpuHistory: number[];

  // Event Log
  systemEvents: SystemEvent[];

  // Actions
  setRuntimeState: (state: RuntimeState) => void;
  updateModuleState: (module: OSModule, state: ModuleState) => void;
  setModuleRegistry: (registry: Record<string, any>) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
  setActiveDepthLayer: (layer: DepthLayer) => void;
  toggleDashboard: () => void;
  setActivePanel: (panel: ActivePanel) => void;
  setMousePosition: (x: number, y: number) => void;
  updateMetrics: (metrics: Partial<{ fps: number; memoryUsage: number; latency: number; contextMemory: number }>) => void;
  handleTelemetryUpdate: (payload: { cpu: number; ram: number; gpu: number; fps: number; latency: number }) => void;
  addSystemEvent: (message: string, type?: SystemEvent['type'], module?: OSModule) => void;
  
  // High-Level Sequences
  triggerBootSequence: () => void;
  triggerShutdownSequence: () => void;
  setAppMode: (mode: AppMode) => void;
}

export const useOSStore = create<OSStoreState>((set, get) => ({
  runtimeState: 'OFF',
  performanceMode: 'luxury',
  appMode: 'os',

  modules: {},

  activeDepthLayer: 2, 
  isDashboardOpen: false,
  activePanel: 'none',
  mousePosition: { x: 0, y: 0 },

  fps: 60,
  memoryUsage: 45,
  latency: 12,
  contextMemory: 840,
  
  cpuHistory: Array(50).fill(0),
  ramHistory: Array(50).fill(0),
  gpuHistory: Array(50).fill(0),
  
  systemEvents: [],

  setRuntimeState: (state) => set({ runtimeState: state }),
  updateModuleState: (module, state) => set((prev) => ({ 
    modules: { 
      ...prev.modules, 
      [module]: typeof prev.modules[module] === 'object' 
        ? { ...prev.modules[module], status: state } 
        : { status: state } 
    } 
  })),
  setModuleRegistry: (registry) => set({ modules: registry }),
  setPerformanceMode: (mode) => set({ performanceMode: mode }),
  setActiveDepthLayer: (layer) => set({ activeDepthLayer: layer }),
  toggleDashboard: () => set((state) => {
    const isOpen = !state.isDashboardOpen;
    return { 
      isDashboardOpen: isOpen,
      activePanel: isOpen && state.activePanel === 'none' ? 'runtime' : (isOpen ? state.activePanel : 'none')
    };
  }),
  setActivePanel: (panel) => set({ 
    activePanel: panel,
    isDashboardOpen: panel !== 'none'
  }),
  setMousePosition: (x, y) => set({ mousePosition: { x, y } }),
  updateMetrics: (metrics) => set((state) => ({ ...state, ...metrics })),
  handleTelemetryUpdate: (payload) => set((state) => {
    const newCpu = [...state.cpuHistory.slice(1), payload.cpu];
    const newRam = [...state.ramHistory.slice(1), payload.ram];
    const newGpu = [...state.gpuHistory.slice(1), payload.gpu];
    return {
      cpuHistory: newCpu,
      ramHistory: newRam,
      gpuHistory: newGpu,
      fps: payload.fps,
      latency: payload.latency,
      memoryUsage: payload.ram
    };
  }),
  addSystemEvent: (message, type = 'info', module) => set((state) => ({
    systemEvents: [
      { id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), message, type, module },
      ...state.systemEvents
    ].slice(0, 50) // Keep last 50 events
  })),

  triggerBootSequence: () => {
    const { setRuntimeState, addSystemEvent } = get();
    
    setRuntimeState('STARTING');
    addSystemEvent('System boot sequence initiated.', 'info');
    
    // Send request to backend via the global ws object in client.ts
    // (This is handled by the WebSocket onopen event automatically if connection is established)

    // The backend will now stream BOOT_EVENTs and then MODULE_REGISTRY
    // So we don't need arbitrary timeouts here.
    setTimeout(() => {
        setRuntimeState('READY');
        addSystemEvent('VANI OS Ready.', 'success');
    }, 4000); // Fail-safe fallback timeout
  },

  triggerShutdownSequence: () => {
    const { setRuntimeState, addSystemEvent } = get();
    setRuntimeState('SHUTTING_DOWN');
    addSystemEvent('Initiating graceful shutdown...', 'warning');
    
    setTimeout(() => {
      setRuntimeState('OFF');
      addSystemEvent('System offline.', 'info');
    }, 2000);
  },
  setAppMode: (mode) => set({ appMode: mode })
}));
