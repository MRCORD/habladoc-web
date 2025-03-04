// src/types/diagnosis.ts
// Types for the ICD-11 diagnosis integration

export interface ICDSelectedEntity {
    iNo: string;
    linearizationUri: string;
    foundationUri: string;
    code: string;
    title: string;
    selectedText: string;
    searchQuery?: string;
  }
  
  export enum DiagnosisType {
    PRIMARY = 'primary',
    SECONDARY = 'secondary',
    DIFFERENTIAL = 'differential'
  }
  
  export enum DiagnosisStatus {
    CONFIRMED = 'confirmed',
    SUSPECTED = 'suspected',
    HISTORY = 'history',
    RULED_OUT = 'ruled_out'
  }
  
  export interface Diagnosis {
    id: string;
    code: string;
    title: string;
    titleSpanish?: string;
    type: DiagnosisType;
    status: DiagnosisStatus;
    confidence: number;
    notes?: string;
    icdUri?: string;
    createdAt: string;
    updatedAt?: string;
  }
  
  export interface DiagnosisCreateData {
    code: string;
    title: string;
    titleSpanish?: string;
    type: DiagnosisType;
    status: DiagnosisStatus;
    confidence: number;
    notes?: string;
    icdUri?: string;
  }
  
  export interface DiagnosisUpdateData {
    type?: DiagnosisType;
    status?: DiagnosisStatus;
    confidence?: number;
    notes?: string;
  }
  
  // Add to the session state for diagnoses management
  export interface SessionDiagnosesState {
    diagnoses: Diagnosis[];
    isLoading: boolean;
    error: string | null;
    
    // Functions
    addDiagnosis: (sessionId: string, diagnosis: DiagnosisCreateData) => Promise<void>;
    updateDiagnosis: (diagnosisId: string, data: DiagnosisUpdateData) => Promise<void>;
    removeDiagnosis: (diagnosisId: string) => Promise<void>;
    fetchDiagnoses: (sessionId: string) => Promise<void>;
  }