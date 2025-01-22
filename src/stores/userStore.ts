import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import api from '@/lib/api'
import type { User, DoctorProfile, Specialty } from '@/types'

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
          } catch (error) {
            set({ error: 'Failed to fetch user' })
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
          } catch (error) {
            set({ error: 'Failed to fetch doctor profile' })
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
          } catch (error) {
            console.error('Failed to fetch specialty')
          }
        },

        updateUser: async (userData: Partial<User>) => {
          try {
            set({ isLoading: true, error: null })
            const response = await api.patch(`/api/v1/users/${get().user?.id}`, userData)
            if (response.data) {
              set({ user: { ...get().user!, ...response.data } })
            }
          } catch (error) {
            set({ error: 'Failed to update user' })
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
          } catch (error) {
            set({ error: 'Failed to update doctor profile' })
          } finally {
            set({ isLoading: false })
          }
        },

        completeProfile: async (profileData: any) => {
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
          } catch (err: any) {
            set({ error: err.response?.data?.message || 'Failed to complete profile' });
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