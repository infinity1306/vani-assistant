import { useAppStore } from '../store/appStore';
import { useOSStore } from '../store/useOSStore';

const API_BASE = "http://127.0.0.1:8005";
const WS_URL = "ws://127.0.0.1:8005/ws";

let ws: WebSocket | null = null;
let reconnectTimer: any = null;

export function initWebSocket() {
  if (ws) return;

  function connect() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Connected to VANI WebSocket bridge');
      useAppStore.getState().setOrbState('IDLE');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const store = useAppStore.getState();

        if (data.type === 'STATE_CHANGE' && data.payload?.orbState) {
          const state = data.payload.orbState;
          const text = data.payload.text;
          
          store.setOrbState(state);
          
          if (state === 'LISTENING') {
            store.setResponse(null);
            store.setInputQuery("");
          } else if (state === 'THINKING' && text) {
            store.setInputQuery(text);
          } else if (state === 'EXECUTING' && text) {
            store.setResponse(text);
          }
        } else if (data.type === 'CONTEXT_CHANGE' && data.payload) {
          const { app_name } = data.payload;
          if (app_name) {
            // Capitalize app name or format it as needed
            store.setActiveContext(app_name);
          }
        } else if (data.type === 'TELEMETRY_UPDATE' && data.payload) {
          useOSStore.getState().handleTelemetryUpdate(data.payload);
        } else if (data.type === 'MODULE_REGISTRY' && data.payload) {
          useOSStore.getState().setModuleRegistry(data.payload);
        } else if (data.type === 'BOOT_EVENT' && data.payload) {
          useOSStore.getState().addSystemEvent(data.payload.message, 'info', data.payload.module);
        }
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    ws.onopen = () => {
      console.log('Connected to VANI WebSocket bridge');
      useAppStore.getState().setOrbState('IDLE');
      
      // Request boot sequence on fresh connection
      if (ws) {
        ws.send(JSON.stringify({ type: 'REQUEST_BOOT_SEQUENCE' }));
      }
    };

    ws.onclose = () => {
      console.log('VANI WebSocket bridge disconnected. Reconnecting...');
      ws = null;
      useAppStore.getState().setOrbState('SLEEP');
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 3000);
    };

    ws.onerror = (err: Event) => {
      console.error('WebSocket error:', err);
      // Suppress UI error dispatch to prevent flashes on reload
      ws?.close();
    };
  }

  connect();
}

export interface CommandResponse {
  success: boolean;
  data: any;
  error?: string;
  execution_ms?: number;
}

export async function sendCommand(text: string): Promise<CommandResponse> {
  try {
    const response = await fetch(`${API_BASE}/command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("API Error:", error);
    window.dispatchEvent(new ErrorEvent('error', { message: `API Command Error: ${error.message || "Unknown error occurred"}` }));
    return {
      success: false,
      data: null,
      error: error.message || "Unknown error occurred",
    };
  }
}

export async function searchWebOrFiles(query: string): Promise<CommandResponse> {
  try {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error("Search API Error:", error);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}

export async function openFile(path: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/open`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    });
    const result = await response.json();
    if (!result.success) {
      window.dispatchEvent(new ErrorEvent('error', { message: `File Open Failed: ${result.error || 'Unknown error'}` }));
      return false;
    }
    return true;
  } catch (error) {
    console.error("Open API Error:", error);
    window.dispatchEvent(new ErrorEvent('error', { message: `Open API Error: ${error}` }));
    return false;
  }
}

export async function getConfig(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/api/config`);
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Get Config API Error:", error);
    return null;
  }
}

export async function updateConfig(configData: any): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(configData),
    });
    const data = await response.json();
    if (data.success && data.message) {
      useOSStore.getState().addSystemEvent(data.message, 'success', 'settings');
    }
    return data.success;
  } catch (error) {
    console.error("Update Config API Error:", error);
    return false;
  }
}
