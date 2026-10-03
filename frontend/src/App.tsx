import { useState, useEffect, useRef } from "react";
import { initWebSocket } from "./core/api/client";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { register, isRegistered, unregister } from '@tauri-apps/plugin-global-shortcut';
import { SpatialEnvironment } from "./components/layout/SpatialEnvironment";
import { useOSStore } from "./core/store/useOSStore";
import { BootSequence } from "./components/layout/BootSequence";
import { HUDManager } from "./components/layout/HUDManager";
import { SuperAdminPanel } from "./components/superadmin/SuperAdminPanel";
import "./components/superadmin/superadmin.css";

function App() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toggleDashboard, setMousePosition, appMode, setAppMode, addSystemEvent } = useOSStore();
  const keyBufferRef = useRef<string>('');
  const keyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SECRET_CODE = '0113';

  useEffect(() => {
    // Initialize WebSocket connection
    initWebSocket();

    // Setup global shortcut
    const setupShortcut = async () => {
      // Prevent crash when running in browser (non-Tauri environment)
      if (!('__TAURI_INTERNALS__' in window)) {
        console.warn('Tauri environment not detected. Global shortcuts disabled.');
        return;
      }
      try {
        const shortcut = 'CommandOrControl+Space';
        try {
          const alreadyRegistered = await isRegistered(shortcut);
          if (alreadyRegistered) {
            await unregister(shortcut);
          }
        } catch (e) {
          console.warn('Failed to unregister existing shortcut', e);
        }
        
        try {
          await register(shortcut, async (event) => {
            if (event.state === 'Pressed') {
              const win = getCurrentWindow();
              const isVisible = await win.isVisible();
              if (isVisible) {
                await win.hide();
              } else {
                await win.show();
                await win.setFocus();
              }
            }
          });
        } catch (registerError: any) {
          if (registerError.toString().includes('already registered')) {
            console.warn('Shortcut already registered, ignoring.');
          } else {
            throw registerError;
          }
        }
      } catch (e: any) {
        console.error('Failed to setup global shortcut:', e);
        // Do not pollute the UI with error message if it's a known Tauri limitation
        // setErrorMsg('Shortcut Error: ' + e.toString());
      }
    };
    setupShortcut();

    // Escape key to hide
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        try {
            await getCurrentWindow().hide();
        } catch(e) {}
      } else if (e.key === 'k' && (e.metaKey || e.ctrlKey || e.altKey)) {
        e.preventDefault();
        toggleDashboard();
      } else if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        window.location.reload();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Secret code listener — listens for '0113' typed anywhere
    const handleSecretCode = (e: KeyboardEvent) => {
      // Only listen for digit keys
      if (!/^[0-9]$/.test(e.key)) return;
      
      keyBufferRef.current += e.key;
      
      // Reset buffer after 2 seconds of inactivity
      if (keyTimerRef.current) clearTimeout(keyTimerRef.current);
      keyTimerRef.current = setTimeout(() => {
        keyBufferRef.current = '';
      }, 2000);

      // Check if the code matches
      if (keyBufferRef.current.endsWith(SECRET_CODE)) {
        keyBufferRef.current = '';
        const currentMode = useOSStore.getState().appMode;
        if (currentMode === 'os') {
          addSystemEvent('Super Admin access granted.', 'success');
          setAppMode('superadmin');
        } else {
          addSystemEvent('Returning to VANI OS.', 'info');
          setAppMode('os');
        }
      }
    };
    window.addEventListener('keydown', handleSecretCode);

    // Global Error Handlers
    const handleGlobalError = (e: ErrorEvent) => {
      setErrorMsg(`Runtime Error: ${e.message}`);
    };
    window.addEventListener('error', handleGlobalError);

    // Global Mouse Tracking for Parallax
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition(e.clientX, e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleSecretCode);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('mousemove', handleMouseMove);
      try {
        unregister('CommandOrControl+Space').catch(() => {});
      } catch (e) {
        // Ignore synchronous errors in browser
      }
    };
  }, [toggleDashboard, setMousePosition, setAppMode, addSystemEvent]);

  // ─── Super Admin Mode ─────────────────────────────────────────────
  if (appMode === 'superadmin') {
    return <SuperAdminPanel />;
  }

  return (
    <>
      <BootSequence />
      
      <SpatialEnvironment>
        {/* OS DRAG REGION & MAIN WORKSPACE (Depth Layer 2) */}
        <div data-tauri-drag-region className="w-full h-full flex flex-col relative z-20 pointer-events-none">
          
          {errorMsg && (
            <div className="absolute top-4 left-4 text-red-500 font-mono text-xs z-[100] bg-black/80 p-2 rounded pointer-events-auto">
              {errorMsg}
            </div>
          )}

          {/* HUD Manager handles Status, Events, Console, and Dashboard */}
          <HUDManager />

        </div>
      </SpatialEnvironment>
    </>
  );
}

export default App;
