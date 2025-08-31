import { create } from 'zustand';
import type { User } from 'firebase/auth';

interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  atcoderId: string | null;
  setAtcoderId: (id: string | null) => void;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  isLoading: true,
  atcoderId: null,
  setAtcoderId: (id) => set({ atcoderId: id }),
  setUser: (user) => set({ currentUser: user, isLoading: false }),
}));
