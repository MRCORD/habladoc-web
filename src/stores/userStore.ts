import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import api from '@/lib/api'
import type { User, DoctorProfile, Specialty } from '@/types'

interface DoctorProfileCompletion {
  specialty_id: string;
  license_number: string;
  education: string;
  experience_years: number;
  languages: string[];
  [key: string]: unknown;
}

interface UserState {
  // State
  user: User | null
  doctorProfile: DoctorProfile | null
  specialty: Specialty | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchUser: () => Promise<void>
  fetchDoctorProfile: () => Promise<void>
  fetchSpecialty: (specialtyId: string) => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<void>
  updateDoctorProfile: (profileData: Partial<DoctorProfile>) => Promise<void>
  completeProfile: (profileData: any) => Promise<boolean>
  reset: () => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        doctorProfile: null,
        specialty: null,
        isLoading: false,
        error: null,

        // Actions
        fetchUser: async () => {
          try {
            set({ isLoading: true, error: null })
            const response = await api.post('/api/v1/users/auth/verify')
            if (response.data.success) {
              set({ user: response.data.data })
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user'
            set({ error: errorMessage })
          } finally {
            set({ isLoading: false })
          }
        },

        fetchDoctorProfile: async () => {
          try {
            set({ isLoading: true, error: null })
            const response = await api.get('/api/v1/doctors/profile/me')
            if (response.data.success) {
              set({ doctorProfile: response.data.data })
              // Fetch specialty if available
              if (response.data.data.specialty_id) {
                get().fetchSpecialty(response.data.data.specialty_id)
              }
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch doctor profile'
            set({ error: errorMessage })
          } finally {
            set({ isLoading: false })
          }
        },

        fetchSpecialty: async (specialtyId: string) => {
          try {
            const response = await api.get(`/api/v1/specialties/${specialtyId}`)
            if (response.data.success) {
              set({ specialty: response.data.data })
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch specialty'
            set({ error: errorMessage })
          }
        },

        updateUser: async (userData: Partial<User>) => {
          try {
            set({ isLoading: true, error: null })
            const response = await api.patch(`/api/v1/users/${get().user?.id}`, userData)
            if (response.data) {
              set({ user: { ...get().user!, ...response.data } })
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update user'
            set({ error: errorMessage })
          } finally {
            set({ isLoading: false })
          }
        },

        updateDoctorProfile: async (profileData: Partial<DoctorProfile>) => {
          try {
            set({ isLoading: true, error: null })
            const response = await api.patch(
              `/api/v1/doctors/profile/${get().doctorProfile?.id}`,
              profileData
            )
            if (response.data.success) {
              set({ doctorProfile: { ...get().doctorProfile!, ...response.data.data } })
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update doctor profile'
            set({ error: errorMessage })
          } finally {
            set({ isLoading: false })
          }
        },

        completeProfile: async (profileData: DoctorProfileCompletion) => {
          try {
            set({ isLoading: true, error: null });
            const response = await api.post('/api/v1/doctors/complete-profile', profileData);
            
            if (response.data.success) {
              set({ 
                doctorProfile: response.data.data,
                error: null 
              });
              return true;
            }
            return false;
          } catch (error: unknown) {
            if (error instanceof Error) {
              set({ error: error.message });
            } else if (typeof error === 'object' && error !== null && 'response' in error) {
              const apiError = error as { response?: { data?: { message?: string } } };
              set({ error: apiError.response?.data?.message || 'Failed to complete profile' });
            } else {
              set({ error: 'Failed to complete profile' });
            }
            return false;
          } finally {
            set({ isLoading: false });
          }
        },

        reset: () => {
          set({
            user: null,
            doctorProfile: null,
            specialty: null,
            isLoading: false,
            error: null,
          })
        },
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({
          user: state.user,
          doctorProfile: state.doctorProfile,
          specialty: state.specialty,
        }),
      }
    )
  )
)