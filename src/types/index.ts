// src/types/index.ts

// Enums that match backend
export enum UserRole {
  ADMIN = "admin",
  DOCTOR = "doctor",
  PATIENT = "patient"
}

export enum SessionType {
  STANDARD = "standard",
  ONE_TIME = "one_time",
  FOLLOW_UP = "follow_up"
}

export enum SessionStatus {
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export enum RecordingStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  PROCESSED = "processed",
  FAILED = "failed"
}

// Base interfaces that match DB schemas
export interface User {
  id: string;
  auth0_id?: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  document_number?: string | null;
  roles: UserRole[];
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  specialty_id: string;
  license_number: string;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  date_of_birth?: string | null;
  gender?: string | null;
  blood_type?: string | null;
  allergies?: {
    conditions: Array<string | AllergyCondition>;
  } | null;
  emergency_contact?: Record<string, unknown> | null;
  insurance_info?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Session {
  id: string;
  doctor_id: string;
  patient_id: string;
  doctor_patient_id?: string;
  status: SessionStatus;
  session_type: SessionType;
  scheduled_for: string;
  started_at?: string | null;
  ended_at?: string | null;
  duration?: number | null;
  summary?: string | null;
  notes?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    first_name?: string;
    last_name?: string;
    document_number?: string;
  };
}

export interface Recording {
  id: string;
  session_id: string;
  status: RecordingStatus;
  duration?: number | null;
  file_path?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  is_processed: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  is_new?: boolean;
}

export interface SessionWithDetails extends Omit<Session, 'patient'> {
  patient: PatientProfile & {
    user: User;
  };
}

// Utility types for creating/updating
export type UserCreateData = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type UserUpdateData = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;

export type SessionCreateData = {
  doctor_id: string;
  patient_id: string;
  status: SessionStatus;
  session_type: SessionType;
  scheduled_for?: string;
  metadata?: Record<string, unknown>;
};

export type SessionUpdateData = Partial<Omit<Session, 'id' | 'created_at' | 'updated_at'>>;

export type RecordingCreateData = {
  session_id: string;
  status: RecordingStatus;
  duration?: number;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  metadata?: Record<string, unknown>;
};

// Additional types
export interface AllergyCondition {
  name: string;
  severity?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface InsuranceInfo {
  provider?: string;
  status?: string;
  plan_name?: string;
  policy_number?: string;
  expiration_date?: string;
  [key: string]: string | undefined; // Updated to match InsuranceInformation
}

// Complete profile type that matches the backend
export interface CompleteProfileData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  document_number?: string;
  specialty_id: string;
  license_number: string;
  languages: string[];
  consultation_fee: number;
}