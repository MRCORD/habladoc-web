// src/stores/sessionStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/lib/api';
import type { 
  Session, 
  SessionWithDetails,
  SessionCreateData, 
  ApiResponse,
  Recording
} from '@/types';

interface SessionState {
  currentSession: SessionWithDetails | null;
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
  startSession: (sessionData: SessionCreateData) => Promise<string | false>;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
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
          set({ isLoading: true, error: null });
          const response = await api.get<ApiResponse<SessionWithDetails>>(`/api/v1/sessions/${sessionId}`);
          if (response.data.success) {
            set({ currentSession: response.data.data });
          }
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          set({ 
            error: apiError.response?.data?.message || apiError.message || 'Failed to fetch session' 
          });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchRecordings: async (sessionId: string) => {
        try {
          const response = await api.get<ApiResponse<Recording[]>>(`/api/v1/recordings/session/${sessionId}`);
          if (response.data.success) {
            set({ recordings: response.data.data });
          }
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          set({ 
            error: apiError.response?.data?.message || apiError.message || 'Failed to fetch recordings' 
          });
        }
      },

      fetchTodaySessions: async (doctorId: string) => {
        try {
          set({ isLoading: true, error: null });
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const response = await api.get<Session[]>(`/api/v1/sessions/doctor/${doctorId}/list`, {
            params: {
              from_date: today.toISOString(),
              to_date: tomorrow.toISOString()
            }
          });

          if (response.data) {
            set({ todaySessions: response.data });
          }
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          set({ 
            error: apiError.response?.data?.message || apiError.message || 'Failed to fetch today\'s sessions' 
          });
        } finally {
          set({ isLoading: false });
        }
      },

      addRecording: (recording: Recording) => 
        set((state) => ({
          recordings: [...state.recordings, recording]
        })),

      updateSession: async (sessionId: string, data: Partial<Session>) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.patch<ApiResponse<SessionWithDetails>>(`/api/v1/sessions/${sessionId}`, data);
          if (response.data.success) {
            const updatedSession = response.data.data;
            set({ currentSession: updatedSession });
            
            // Update todaySessions with properly typed patient data
            set((state) => ({
              todaySessions: state.todaySessions.map((session) =>
                session.id === sessionId ? {
                  ...updatedSession,
                  patient: updatedSession.patient ? {
                    id: updatedSession.patient.user.id,
                    first_name: updatedSession.patient.user.first_name,
                    last_name: updatedSession.patient.user.last_name,
                    document_number: updatedSession.patient.user.document_number || undefined
                  } : undefined
                } : session
              )
            }));
          }
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          set({ 
            error: apiError.response?.data?.message || apiError.message || 'Failed to update session' 
          });
        } finally {
          set({ isLoading: false });
        }
      },

      reset: () => {
        set({
          currentSession: null,
          recordings: [],
          todaySessions: [],
          isLoading: false,
          error: null,
        });
      },

      startSession: async (sessionData: SessionCreateData) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post<ApiResponse<Session>>('/api/v1/sessions', sessionData);
          if (response.data.success) {
            return response.data.data.id;
          }
          return false;
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          set({ 
            error: apiError.response?.data?.message || apiError.message || 'Failed to start session' 
          });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },
    })
  )
);