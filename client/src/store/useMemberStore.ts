import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MemberState {
    selectedMemberId: number | null;
    setSelectedMemberId: (id: number | null) => void;
    clearSelectedMember: () => void;
}

export const useMemberStore = create<MemberState>()(
    persist(
        (set) => ({
            selectedMemberId: null,
            setSelectedMemberId: (id) => set({ selectedMemberId: id }),
            clearSelectedMember: () => set({ selectedMemberId: null }),
        }),
        {
            name: 'coursemanager-member-storage',
        }
    )
);
