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

interface EnhancedConsultation {
  recording_id: string;
  soap_subjective?: {
    summary?: string;
    components?: Record<string, any>;
  };
  soap_objective?: {
    summary?: string;
    components?: Record<string, any>;
  };
  soap_assessment?: {
    summary?: string;
    components?: Record<string, any>;
  };
  soap_plan?: {
    summary?: string;
    components?: Record<string, any>;
  };
}

interface Transcription {
  recording_id: string;
  content: string;
  status: string;
  // ...other transcription fields
}

interface Entity {
  name: string;
  type: string;
  spans: Array<{ start: number; end: number; text: string }>;
  attributes: Record<string, string | number | boolean>;
  confidence: number;
}

interface Relationship {
  type: string;
  source: string;
  target: string;
  evidence: string;
  metadata: {
    impact: string;
    severity: string;
    certainty: string;
    direction: string;
    temporality: string;
    clinical_significance: string;
    confidence: number;
  };
  confidence: number;
}

interface AnalysisResult {
  id: string;
  content: {
    text: string;
    version: string;
    entities: Entity[];
    relationships: Relationship[];
    language: string;
    confidence: number;
  };
  confidence: number;
  created_at: string;
  session_id: string;
  updated_at: string;
  recording_id: string;
  analysis_type: string;
  model_metadata?: Record<string, string | number | boolean>;
}

interface SessionState {
  currentSession: SessionWithDetails | null;
  recordings: Recording[];
  transcriptions: Transcription[];
  clinicalAnalysis: Record<string, AnalysisResult[]>;
  enhancedAnalysis: Record<string, EnhancedConsultation>;
  todaySessions: Session[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSession: (sessionId: string) => Promise<void>;
  fetchRecordings: (sessionId: string) => Promise<void>;
  fetchSessionState: (sessionId: string) => Promise<void>;
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
      transcriptions: [],
      clinicalAnalysis: {},
      enhancedAnalysis: {},
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

      fetchSessionState: async (sessionId: string) => {
        try {
          interface SessionStateResponse {
            transcriptions: Transcription[];
            analysis_results: AnalysisResult[];
            enhanced_consultations: EnhancedConsultation[];
          }
          const response = await api.get<ApiResponse<SessionStateResponse>>(`/api/v1/analysis/session/${sessionId}/complete-state`);
          if (response.data.success) {
            const { transcriptions = [], analysis_results = [], enhanced_consultations = [] } = response.data.data || {};
            
            // Separate clinical analysis and enhanced analysis
            const clinicalAnalysis: Record<string, AnalysisResult[]> = {};
            const enhancedAnalysis: Record<string, EnhancedConsultation> = {};
            
            // Group clinical analysis by recording
            transcriptions.forEach((t: Transcription) => {
              const recordingAnalyses = analysis_results.filter((ar: AnalysisResult) => 
                ar.recording_id === t.recording_id && 
                ar.analysis_type === 'clinical_analysis'
              );
              if (recordingAnalyses.length > 0) {
                clinicalAnalysis[t.recording_id] = recordingAnalyses;
              }
            });
            // Map enhanced consultations
            enhanced_consultations.forEach((ec: EnhancedConsultation) => {
              if (ec.recording_id) {
                enhancedAnalysis[ec.recording_id] = ec;
              }
            });
            
            set({ transcriptions, clinicalAnalysis, enhancedAnalysis });
          }
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          set({ 
            error: apiError.response?.data?.message || apiError.message || 'Failed to fetch session state' 
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
          transcriptions: [],
          clinicalAnalysis: {},
          enhancedAnalysis: {},
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