import { create } from 'zustand';

interface UiState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  complianceAcknowledged: boolean;
  setComplianceAcknowledged: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: (localStorage.getItem('getlux-theme') as 'light' | 'dark') || 'light',
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('getlux-theme', next);
    set({ theme: next });
  },
  complianceAcknowledged: false,
  setComplianceAcknowledged: (v: boolean) => set({ complianceAcknowledged: v }),
}));
