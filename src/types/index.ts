export interface User {
  id: string;
  auth_id?: string;  // Made optional
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

export type SessionType = 'standard' | 'one_time' | 'follow_up';
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface SessionData {
  doctorId: string;
  patientId: string;
  status: SessionStatus;
  sessionType: SessionType;
  scheduledFor?: string;
  metadata?: Record<string, any>;
}

export interface Session {
  id: string;
  doctorId: string;
  patientId: string;
  status: SessionStatus;
  sessionType: SessionType;
  scheduledFor: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  summary?: string;
  notes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  doctorPatientId?: string;
  patient?: Patient;
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

export interface Allergy {
  name: string;
  severity?: string;
  notes?: string;
}

export interface Patient {
  id: string;
  date_of_birth: string;
  gender: string;
  blood_type: string;
  allergies: { conditions: Allergy[] };
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

export interface PatientSearchResult {
  profile: {
    id: string;
    user_id: string;
    date_of_birth: string | null;
    gender: string | null;
    blood_type: string | null;
    allergies: { conditions: Allergy[] } | null;
    emergency_contact: string | null;
    insurance_info: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
  };
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  is_new?: boolean;
}