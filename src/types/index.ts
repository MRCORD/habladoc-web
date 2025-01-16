// types/index.ts
export interface User {
  id: string;
  auth_id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  roles: string[];
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  specialty_id: string;
  license_number: string;
  is_active: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  is_new?: boolean;
}