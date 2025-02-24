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

export interface RecordingCreateData {
  session_id: string;
  duration: number;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: RecordingStatus;
  metadata: {
    sample_rate: number;
    channels: number;
    duration_seconds: number;
    original_name: string;
  };
  detected_components: string[] | null;
}

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

export enum SOAPComponent {
  CLINICAL_ENTITY = "clinical_entity",
  CHIEF_COMPLAINT = "chief_complaint",
  HISTORY_PRESENT_ILLNESS = "history_present_illness",
  PAST_MEDICAL_HISTORY = "past_medical_history",
  FAMILY_HISTORY = "family_history",
  SOCIAL_HISTORY = "social_history",
  REVIEW_OF_SYSTEMS = "review_of_systems",
  VITAL_SIGNS = "vital_signs",
  PHYSICAL_EXAM = "physical_exam",
  LAB_RESULTS = "lab_results",
  DIFFERENTIAL_DIAGNOSIS = "differential_diagnosis",
  CLINICAL_IMPRESSION = "clinical_impression",
  DIAGNOSTIC_PLAN = "diagnostic_plan",
  THERAPEUTIC_PLAN = "therapeutic_plan",
  EDUCATION_PLAN = "education_plan"
}

export interface Entity {
  name: string;
  type: string;
  spans: Array<{ start: number; end: number; text: string }>;
  attributes: Record<string, string | number>;
  confidence: number;
}

export interface Relationship {
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

export interface AnalysisResult {
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

export interface Transcription {
  id: string;
  recording_id: string;
  content: string;
  status: string;
  is_interim: boolean;
  created_at: string;
  updated_at: string;
}