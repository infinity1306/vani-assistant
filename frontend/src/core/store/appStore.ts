import { create } from 'zustand';

export type OrbState = 'SLEEP' | 'IDLE' | 'LISTENING' | 'THINKING' | 'EXECUTING';

export interface SearchResult {
  id: string;
  type: 'file' | 'memory' | 'web' | 'agent';
  title: string;
  subtitle: string;
  score: number;
}

interface AppState {
  orbState: OrbState;
  setOrbState: (state: OrbState) => void;
  isPanelOpen: boolean;
  setPanelOpen: (isOpen: boolean) => void;
  activeContext: string | null;
  setActiveContext: (context: string | null) => void;
  inputQuery: string;
  setInputQuery: (query: string) => void;
  isSearchModalOpen: boolean;
  setSearchModalOpen: (isOpen: boolean) => void;
  searchResults: SearchResult[];
  setSearchResults: (results: SearchResult[]) => void;
  response: string | null;
  setResponse: (res: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  orbState: 'IDLE',
  setOrbState: (state) => set({ orbState: state }),
  isPanelOpen: false,
  setPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),
  activeContext: 'Desktop', // Defaults to Desktop until OS tracker kicks in
  setActiveContext: (context) => set({ activeContext: context }),
  inputQuery: '',
  setInputQuery: (query) => set({ inputQuery: query }),
  isSearchModalOpen: false,
  setSearchModalOpen: (isOpen) => set({ isSearchModalOpen: isOpen }),
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),
  response: null,
  setResponse: (res) => set({ response: res }),
}));
