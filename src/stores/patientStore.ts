// src/stores/patientStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/lib/api';
import type { PatientProfile, User, ApiResponse } from '@/types';

// Interface for patient search/create response
interface PatientWithUser {
  user: User;
  profile: PatientProfile;
}

// Interface for API errors
interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

interface PatientState {
  patient: PatientWithUser | null;
  isLoading: boolean;
  error: string | null;
  showCreateForm: boolean;

  searchPatient: (documentNumber: string) => Promise<void>;
  createPatient: (patientData: {
    user: Partial<User>;
    profile: Partial<PatientProfile>;
  }) => Promise<boolean>;
  reset: () => void;
  setShowCreateForm: (show: boolean) => void;
}

export const usePatientStore = create<PatientState>()(
  devtools(
    (set) => ({
      patient: null,
      isLoading: false,
      error: null,
      showCreateForm: false,

      searchPatient: async (documentNumber: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.get<ApiResponse<PatientWithUser>>(
            `/api/v1/patients/search?document_number=${documentNumber}`
          );
          if (response.data.success) {
            set({ 
              patient: response.data.data,
              showCreateForm: false
            });
          }
        } catch (err: unknown) {
          const error = err as ApiError;
          if (error.response?.status === 404) {
            set({ 
              patient: null,
              showCreateForm: true
            });
          } else {
            set({ error: error.response?.data?.message || 'Error buscando paciente' });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      createPatient: async (patientData: {
        user: Partial<User>;
        profile: Partial<PatientProfile>;
      }) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post<ApiResponse<PatientWithUser>>(
            '/api/v1/patients', 
            patientData
          );
          if (response.data.success) {
            set({ 
              patient: response.data.data,
              showCreateForm: false 
            });
            return true;
          }
          return false;
        } catch (err: unknown) {
          const error = err as ApiError;
          set({ error: error.response?.data?.message || 'Error creando paciente' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      setShowCreateForm: (show) => set({ showCreateForm: show }),
      reset: () => set({ patient: null, error: null, showCreateForm: false })
    })
  )
);