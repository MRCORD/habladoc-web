// src/stores/sessionStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import api from '@/lib/api'
import type { Session, SessionData } from '@/types'

// Define Recording type to avoid using 'any'
interface Recording {
  id: string;
  session_id: string;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  duration?: number;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  is_processed: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface SessionState {
  currentSession: Session | null;
  recordings: Recording[];
  todaySessions: Session[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSession: (sessionId: string) => Promise<void>;
  fetchRecordings: (sessionId: string) => Promise<void>;
  fetchTodaySessions: (doctorId: string) => Promise<void>;
  addRecording: (recording: Recording) => void;
  updateSession: (sessionId: string, data: Partial<Session>) => Promise<void>;
  reset: () => void;
  startSession: (sessionData: SessionData) => Promise<string | false>;
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
        } catch (error) {
          const err = error as ApiError
          set({ error: err.response?.data?.message || err.message || 'Failed to fetch session' })
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
        } catch (error) {
          const err = error as ApiError
          set({ error: err.response?.data?.message || err.message || 'Failed to fetch recordings' })
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
        } catch (error) {
          const err = error as ApiError
          set({ error: err.response?.data?.message || err.message || 'Failed to fetch today\'s sessions' })
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
            
            set((state) => ({
              todaySessions: state.todaySessions.map((session) =>
                session.id === sessionId ? response.data.data : session
              )
            }))
          }
        } catch (error) {
          const err = error as ApiError
          set({ error: err.response?.data?.message || err.message || 'Failed to update session' })
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
          // Convert the sessionData to match the API expectations
          const apiData = {
            doctor_id: sessionData.doctorId,
            patient_id: sessionData.patientId,
            status: sessionData.status,
            session_type: sessionData.sessionType,
            scheduled_for: sessionData.scheduledFor,
            metadata: sessionData.metadata
          }
          const response = await api.post('/api/v1/sessions', apiData)
          if (response.data.success) {
            return response.data.data.id
          }
          return false
        } catch (error) {
          const err = error as ApiError
          set({ error: err.response?.data?.message || err.message || 'Failed to start session' })
          return false
        } finally {
          set({ isLoading: false })
        }
      },
    })
  )
)