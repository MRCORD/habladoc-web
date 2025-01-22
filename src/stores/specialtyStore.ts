// stores/specialtyStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/lib/api';
import type { Specialty } from '@/types';

interface SpecialtyState {
  specialties: Specialty[];
  searchTerm: string;
  isDropdownOpen: boolean;
  isLoading: boolean;
  error: string | null;
  
  fetchSpecialties: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setDropdownOpen: (isOpen: boolean) => void;
  reset: () => void;
}

export const useSpecialtyStore = create<SpecialtyState>()(
  devtools(
    (set, get) => ({
      specialties: [],
      searchTerm: '',
      isDropdownOpen: false,
      isLoading: false,
      error: null,

      fetchSpecialties: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.get('/api/v1/specialties');
          if (response.data.success) {
            set({ specialties: response.data.data });
          }
        } catch (err) {
          set({ error: 'Failed to load specialties' });
        } finally {
          set({ isLoading: false });
        }
      },

      setSearchTerm: (term) => set({ searchTerm: term, isDropdownOpen: true }),
      setDropdownOpen: (isOpen) => set({ isDropdownOpen: isOpen }),
      reset: () => set({ searchTerm: '', isDropdownOpen: false, error: null }),
    })
  )
);