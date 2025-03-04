// src/stores/diagnosisStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  Diagnosis, 
  DiagnosisCreateData, 
  DiagnosisUpdateData 
} from '@/types/diagnosis';

// Interface for the store state and actions
interface DiagnosisState {
  // Session-specific diagnoses map
  diagnosesMap: Record<string, Diagnosis[]>;
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Getters
  getCurrentSessionDiagnoses: () => Diagnosis[];
  getDiagnosesBySessionId: (sessionId: string) => Diagnosis[];
  
  // CRUD operations
  setCurrentSession: (sessionId: string) => void;
  addDiagnosis: (sessionId: string, diagnosisData: DiagnosisCreateData) => Diagnosis;
  updateDiagnosis: (diagnosisId: string, data: DiagnosisUpdateData) => void;
  removeDiagnosis: (diagnosisId: string) => void;
  clearSessionDiagnoses: (sessionId: string) => void;
  clearAllDiagnoses: () => void;
}

export const useDiagnosisStore = create<DiagnosisState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        diagnosesMap: {},
        currentSessionId: null,
        isLoading: false,
        error: null,
        
        // Getter for current session diagnoses
        getCurrentSessionDiagnoses: () => {
          const { currentSessionId, diagnosesMap } = get();
          if (!currentSessionId) return [];
          return diagnosesMap[currentSessionId] || [];
        },
        
        // Getter for diagnoses by session ID
        getDiagnosesBySessionId: (sessionId: string) => {
          return get().diagnosesMap[sessionId] || [];
        },
        
        // Set current session
        setCurrentSession: (sessionId: string) => {
          set({ 
            currentSessionId: sessionId,
            // Initialize the session diagnoses array if it doesn't exist
            diagnosesMap: {
              ...get().diagnosesMap,
              [sessionId]: get().diagnosesMap[sessionId] || []
            }
          });
        },
        
        // Add a diagnosis
        addDiagnosis: (sessionId: string, diagnosisData: DiagnosisCreateData) => {
          set({ isLoading: true, error: null });
          
          try {
            // Create a new diagnosis with generated ID and timestamps
            const newDiagnosis: Diagnosis = {
              id: uuidv4(),
              ...diagnosisData,
              createdAt: new Date().toISOString(),
            };
            
            // Update the diagnoses map
            set(state => {
              const sessionDiagnoses = state.diagnosesMap[sessionId] || [];
              return {
                diagnosesMap: {
                  ...state.diagnosesMap,
                  [sessionId]: [...sessionDiagnoses, newDiagnosis]
                },
                isLoading: false
              };
            });
            
            return newDiagnosis;
          } catch (error) {
            console.error('Error adding diagnosis:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to add diagnosis',
              isLoading: false 
            });
            throw error;
          }
        },
        
        // Update a diagnosis
        updateDiagnosis: (diagnosisId: string, data: DiagnosisUpdateData) => {
          set({ isLoading: true, error: null });
          
          try {
            const { currentSessionId } = get();
            if (!currentSessionId) {
              throw new Error('No active session');
            }
            
            // Find and update the diagnosis
            set(state => {
              const sessionDiagnoses = state.diagnosesMap[currentSessionId] || [];
              const updatedDiagnoses = sessionDiagnoses.map(diagnosis => {
                if (diagnosis.id === diagnosisId) {
                  return {
                    ...diagnosis,
                    ...data,
                    updatedAt: new Date().toISOString()
                  };
                }
                return diagnosis;
              });
              
              return {
                diagnosesMap: {
                  ...state.diagnosesMap,
                  [currentSessionId]: updatedDiagnoses
                },
                isLoading: false
              };
            });
          } catch (error) {
            console.error('Error updating diagnosis:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update diagnosis',
              isLoading: false 
            });
          }
        },
        
        // Remove a diagnosis
        removeDiagnosis: (diagnosisId: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const { currentSessionId } = get();
            if (!currentSessionId) {
              throw new Error('No active session');
            }
            
            // Remove the diagnosis
            set(state => {
              const sessionDiagnoses = state.diagnosesMap[currentSessionId] || [];
              const updatedDiagnoses = sessionDiagnoses.filter(
                diagnosis => diagnosis.id !== diagnosisId
              );
              
              return {
                diagnosesMap: {
                  ...state.diagnosesMap,
                  [currentSessionId]: updatedDiagnoses
                },
                isLoading: false
              };
            });
          } catch (error) {
            console.error('Error removing diagnosis:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to remove diagnosis',
              isLoading: false 
            });
          }
        },
        
        // Clear all diagnoses for a session
        clearSessionDiagnoses: (sessionId: string) => {
          set(state => ({
            diagnosesMap: {
              ...state.diagnosesMap,
              [sessionId]: []
            }
          }));
        },
        
        // Clear all diagnoses for all sessions
        clearAllDiagnoses: () => {
          set({ diagnosesMap: {} });
        }
      }),
      {
        name: 'diagnosis-storage',
        partialize: (state) => ({
          diagnosesMap: state.diagnosesMap
        }),
      }
    )
  )
);