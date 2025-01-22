import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import api from '@/lib/api'
import type { Session, Recording } from '@/types'

interface SessionData {
  doctorId: string
  patientId: string
  startTime?: string
  endTime?: string
  status?: string
}

interface SessionState {
  // State
  currentSession: Session | null
  recordings: Recording[]
  todaySessions: Session[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchSession: (sessionId: string) => Promise<void>
  fetchRecordings: (sessionId: string) => Promise<void>
  fetchTodaySessions: (doctorId: string) => Promise<void>
  addRecording: (recording: Recording) => void
  updateSession: (sessionId: string, data: Partial<Session>) => Promise<void>
  reset: () => void
  startSession: (sessionData: SessionData) => Promise<string | false>
}

export const useSessionStore = create<SessionState>()(
  devtools(
    (set) => ({
      // Initial state
      currentSession: null,
      recordings: [],
      todaySessions: [],
      isLoading: false,
      error: null,

      // Actions
      fetchSession: async (sessionId: string) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.get(`/api/v1/sessions/${sessionId}`)
          if (response.data.success) {
            set({ currentSession: response.data.data })
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch session'
          set({ error: errorMessage })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchRecordings: async (sessionId: string) => {
        try {
          const response = await api.get(`/api/v1/recordings/session/${sessionId}`)
          if (response.data.success) {
            set({ recordings: response.data.data })
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch recordings'
          set({ error: errorMessage })
        }
      },

      fetchTodaySessions: async (doctorId: string) => {
        try {
          set({ isLoading: true, error: null })
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)

          const response = await api.get(`/api/v1/sessions/doctor/${doctorId}/list`, {
            params: {
              from_date: today.toISOString(),
              to_date: tomorrow.toISOString()
            }
          })

          if (response.data) {
            set({ todaySessions: response.data })
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch today\'s sessions'
          set({ error: errorMessage })
        } finally {
          set({ isLoading: false })
        }
      },

      addRecording: (recording: Recording) => 
        set((state) => ({
          recordings: [...state.recordings, recording]
        })),

      updateSession: async (sessionId: string, data: Partial<Session>) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.patch(`/api/v1/sessions/${sessionId}`, data)
          if (response.data.success) {
            set({ currentSession: response.data.data })
            
            // Update session in todaySessions if it exists
            set((state) => ({
              todaySessions: state.todaySessions.map((session) =>
                session.id === sessionId ? response.data.data : session
              )
            }))
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update session'
          set({ error: errorMessage })
        } finally {
          set({ isLoading: false })
        }
      },

      reset: () => {
        set({
          currentSession: null,
          recordings: [],
          todaySessions: [],
          isLoading: false,
          error: null,
        })
      },

      startSession: async (sessionData: SessionData) => {
        try {
          set({ isLoading: true, error: null })
          const response = await api.post('/api/v1/sessions', sessionData)
          if (response.data.success) {
            return response.data.data.id
          }
          return false
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to start session'
          set({ error: errorMessage })
          return false
        } finally {
          set({ isLoading: false })
        }
      },
    })
  )
)