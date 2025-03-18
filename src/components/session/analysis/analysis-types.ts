// Types for analysis components
import { TimelineEvent } from '@/contexts/timeline-context';

export interface EnhancedConsultationData {
  soap_subjective?: SoapSection;
  soap_objective?: SoapSection;
  soap_assessment?: SoapSection;
  soap_plan?: SoapSection;
  ai_patterns?: PatternItem[];
  ai_reasoning?: AIReasoning;
  ai_risks?: RiskItem[];
  ai_timeline?: Timeline;
  ai_confidence?: number;
  ai_suggestions?: Suggestion[];
  version?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SoapSection {
  summary?: string;
  metadata?: Record<string, unknown>;
  components?: Record<string, {
    content: SoapContent;
    metadata?: Record<string, unknown>;
    components?: string[];
    confidence?: number;
  }>;
  confidence?: number;
}

export interface SoapContent {
  current_symptoms?: Entity[];
  medication_effects?: MedicationEffect[];
  vital_signs?: Record<string, VitalSign>;
  diagnoses?: Entity[];
  findings?: Record<string, Finding>;
  system_findings?: Record<string, { findings: Entity[] }>;
  [key: string]: unknown;
}

export interface Entity {
  name: string;
  type?: string;
  confidence?: number;
  location?: string;
  duration?: string;
  intensity?: string;
  quality?: string;
  frequency?: string;
  context?: string;
  status?: string;
  progression?: string;
  value?: string;
  unit?: string;
  supporting_evidence?: string[];
  [key: string]: string | number | string[] | undefined;
}

export interface MedicationEffect {
  medication: string;
  effect: string;
  symptoms: string[];
  confidence?: number;
}

export interface VitalSign {
  value: string;
  unit?: string;
  confidence?: number;
}

export interface RiskItem {
  description: string;
  recommendation?: string;
  severity: 'high' | 'moderate' | 'low';
  category?: string;
  evidence?: string[];
  confidence?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PatternItem {
  description: string;
  type: string;
  evidence?: string[];
  confidence: number;
  metadata?: Record<string, unknown>;
  affected_components?: string[];
  [key: string]: unknown;
}

export interface Suggestion {
  text: string;
  type: string;
  confidence: number;
  [key: string]: unknown;
}

export interface Timeline {
  events: TimelineEvent[];
}

export interface Finding {
  description?: string;
  value?: string | number;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface AIReasoning {
  explanation: string;
  confidence: number;
  supporting_evidence?: string[];
  metadata?: Record<string, unknown>;
}

// Helper interface to convert SoapSection to SectionData
export interface SectionData {
  components?: Record<string, {
    content: SoapContent;
    confidence?: number;
  }>;
  summary?: string;
  metadata?: Record<string, unknown>;
  confidence?: number;
}

// Map risks severity to badge variants
export const severityToBadgeVariant = {
  'high': 'danger',
  'moderate': 'warning',
  'low': 'info'
} as const;

// Helper function to convert SoapSection to SectionData
export const convertToSectionData = (section?: SoapSection): SectionData => {
  if (!section) {
    return {};
  }

  return {
    components: section.components,
    summary: section.summary,
    metadata: section.metadata,
    confidence: section.confidence
  };
};

export interface AnalysisTabProps {
  enhancedData: EnhancedConsultationData;
  sessionId: string;
  collapsedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  entityFilter: {
    showActiveOnly: boolean;
    sortBy: string;
  };
  setEntityFilter: React.Dispatch<React.SetStateAction<{
    showActiveOnly: boolean;
    sortBy: string;
  }>>;
}