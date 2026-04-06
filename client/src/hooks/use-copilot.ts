import { create } from 'zustand';

interface CopilotState {
  isOpen: boolean;
  openCopilot: () => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
}

export const useCopilot = create<CopilotState>((set) => ({
  isOpen: false,
  openCopilot: () => set({ isOpen: true }),
  closeCopilot: () => set({ isOpen: false }),
  toggleCopilot: () => set((state) => ({ isOpen: !state.isOpen })),
}));
