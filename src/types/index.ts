// src/types/index.ts
export interface User {
  id: string;
  auth_id: string;
  email: string;
  phone: string | null;
  document_number: string | null;
  first_name: string;
  last_name: string;
  roles: string[];
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  specialty_id: string;
  license_number: string;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Session {
  id: string;
  doctor_id: string;
  patient_id: string;
  status: SessionStatus;
  session_type: 'standard' | 'one_time' | 'follow_up';
  scheduled_for: string;
  started_at?: string;
  ended_at?: string;
  duration?: number;
  summary?: string;
  notes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  doctor_patient_id?: string;
  patient?: Patient; // Change this from simple patient info to full Patient type
}

export interface Recording {
  id: string;
  session_id: string;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  start_time: string;
  end_time?: string;
  duration?: number; // Make duration optional to match the type
  file_path: string; // Required now
  file_size?: number;
  mime_type?: string;
  is_processed: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  date_of_birth: string;
  gender: string;
  blood_type: string;
  allergies: string[];
  emergency_contact: string | null;
  insurance_info: {
    provider?: string;
    policy_number?: string;
    expiry_date?: string;
    [key: string]: unknown;
  };
  metadata: Record<string, unknown>;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  is_new?: boolean;
}