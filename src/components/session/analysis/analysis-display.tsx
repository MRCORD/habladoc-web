import React, { useState, useEffect, useCallback } from "react";
import { 
  ChevronDown, 
  ChevronUp,
  AlertTriangle, 
  FileText, 
  Activity, 
  MessageCircle, 
  Stethoscope,
  Brain,
  Clock,
  Zap,
  Lightbulb,
  BarChart2,
  CheckCircle,
  Calendar,
  Filter
} from "lucide-react";
import { ErrorMessage } from "@/components/common/error-message";
import { AnalysisDisplaySkeleton } from "@/components/common/loading-skeletons";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import api from "@/lib/api";
import EntityGroups from "../entity/entity-groups";
import { highlightEntitiesInText } from "@/utils/highlightEntities";
import { AttributeTag, toSentenceCase } from "@/components/common/attribute-tag";
import ConsultationTimeline, { getConfidenceInfo } from "../timeline/consultation-timeline";
import { TimelineEvent } from '@/contexts/timeline-context';
import DiagnosisManagement from '@/components/session/diagnosis/DiagnosisManagement';

// Type definitions for the component
interface EnhancedConsultationData {
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

interface SoapSection {
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

interface SoapContent {
  current_symptoms?: Entity[];
  medication_effects?: MedicationEffect[];
  vital_signs?: Record<string, VitalSign>;
  diagnoses?: Entity[];
  findings?: Record<string, Finding>;
  system_findings?: Record<string, { findings: Entity[] }>;
  [key: string]: unknown;
}

interface Entity {
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

interface MedicationEffect {
  medication: string;
  effect: string;
  symptoms: string[];
  confidence?: number;
}

interface VitalSign {
  value: string;
  unit?: string;
  confidence?: number;
}

interface RiskItem {
  description: string;
  recommendation?: string;
  severity: 'high' | 'moderate' | 'low';
  category?: string;
  evidence?: string[];
  confidence?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface PatternItem {
  description: string;
  type: string;
  evidence?: string[];
  confidence: number;
  metadata?: Record<string, unknown>;
  affected_components?: string[];
  [key: string]: unknown;
}

interface Suggestion {
  text: string;
  type: string;
  confidence: number;
  [key: string]: unknown;
}

interface Timeline {
  events: TimelineEvent[];
}

interface Finding {
  description?: string;
  value?: string | number;
  status?: string;
  metadata?: Record<string, unknown>;
}

interface AIReasoning {
  explanation: string;
  confidence: number;
  supporting_evidence?: string[];
  metadata?: Record<string, unknown>;
}

interface AnalysisDisplayProps {
  sessionId: string;
}

// Helper interface to convert SoapSection to SectionData
interface SectionData {
  components?: Record<string, {
    content: SoapContent;
    confidence?: number;
  }>;
  summary?: string;
  metadata?: Record<string, unknown>;
  confidence?: number;
}

// Helper function to convert SoapSection to SectionData
const convertToSectionData = (section?: SoapSection): SectionData => {
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

// Map risks severity to badge variants
const severityToBadgeVariant = {
  'high': 'danger',
  'moderate': 'warning',
  'low': 'info'
} as const;

export default function AnalysisDisplay({ sessionId }: AnalysisDisplayProps) {
  const [enhancedData, setEnhancedData] = useState<EnhancedConsultationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    Subjective: false,
    Objective: false,
    Assessment: false,
    Plan: false,
    Risks: false,
    Patterns: false,
    Timeline: false,
    Suggestions: false
  });
  const [entityFilter, setEntityFilter] = useState({
    showActiveOnly: false,
    sortBy: "confidence"
  });

  const fetchEnhancedConsultation = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await api.get(`/api/v1/analysis/session/${sessionId}/complete-state`);
      
      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "No se pudieron obtener los datos de la consulta médica"
        );
      }
      
      const { enhanced_consultations } = response.data.data;
      
      // Process the data to ensure entity names are in sentence case
      const processedData = enhanced_consultations && enhanced_consultations.length > 0
        ? processEntityNames(enhanced_consultations[0])
        : null;
      
      setEnhancedData(processedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al obtener los datos de la consulta médica";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Process entity names to ensure sentence case
  const processEntityNames = (data: EnhancedConsultationData): EnhancedConsultationData => {
    const processEntity = (entity: Entity): Entity => {
      return {
        ...entity,
        name: toSentenceCase(entity.name)
      };
    };

    const processSection = (section?: SoapSection): SoapSection | undefined => {
      if (!section) return undefined;
      
      const processedComponents: Record<string, { 
        content: SoapContent; 
        metadata?: Record<string, unknown>; 
        components?: string[]; 
        confidence?: number; 
      }> = {};
      
      if (section.components) {
        Object.entries(section.components).forEach(([key, component]) => {
          const processedContent: SoapContent = { ...component.content };
          
          if (processedContent.current_symptoms) {
            processedContent.current_symptoms = processedContent.current_symptoms.map(processEntity);
          }
          
          if (processedContent.diagnoses) {
            processedContent.diagnoses = processedContent.diagnoses.map(processEntity);
          }
          
          processedComponents[key] = {
            ...component,
            content: processedContent
          };
        });
      }
      
      return {
        ...section,
        components: section.components ? processedComponents : undefined
      };
    };
    
    return {
      ...data,
      soap_subjective: processSection(data.soap_subjective),
      soap_objective: processSection(data.soap_objective),
      soap_assessment: processSection(data.soap_assessment),
      soap_plan: processSection(data.soap_plan)
    };
  };

  useEffect(() => {
    fetchEnhancedConsultation();
  }, [fetchEnhancedConsultation]);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Enhanced risk display with categories
  const renderEnhancedRisks = (risks: RiskItem[]) => {
    // Categorize risks
    const risksByCategory = risks.reduce((acc, risk) => {
      const category = risk.category || 'clinical';
      if (!acc[category]) acc[category] = [];
      acc[category].push(risk);
      return acc;
    }, {} as Record<string, RiskItem[]>);
    
    return (
      <div className="space-y-6">
        {Object.entries(risksByCategory).map(([category, categoryRisks]) => (
          <div key={category} className="space-y-3">
            <h5 className="font-medium text-neutral-900 dark:text-neutral-100 capitalize">
              {category === 'clinical' ? 'Riesgos Clínicos' :
               category === 'medication' ? 'Riesgos de Medicación' :
               category === 'adherence' ? 'Riesgos de Adherencia' :
               'Otros Riesgos'}
            </h5>
            
            {categoryRisks.map((risk, idx) => (
              <Card key={idx} variant="default" highlight={severityToBadgeVariant[risk.severity] || 'danger'}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-danger-500 dark:text-danger-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{risk.description}</div>
                        <Badge 
                          variant={severityToBadgeVariant[risk.severity] || 'danger'}
                          size="sm"
                        >
                          {risk.severity === 'high' ? 'Alto' :
                           risk.severity === 'moderate' ? 'Moderado' : 'Bajo'}
                        </Badge>
                      </div>
                      
                      {risk.recommendation && (
                        <div className="flex items-start gap-2 p-2 bg-primary-50 dark:bg-primary-900/20 rounded text-sm mt-2">
                          <CheckCircle className="h-4 w-4 text-primary-500 mt-0.5" />
                          <div>{risk.recommendation}</div>
                        </div>
                      )}
                      
                      {risk.evidence && risk.evidence.length > 0 && (
                        <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                          <strong>Evidencia:</strong>
                          <ul className="mt-1 space-y-1 pl-4">
                            {risk.evidence.map((ev, evIdx) => (
                              <li key={evIdx} className="list-disc list-outside">{ev}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Get all symptoms from various sections
  const getAllSymptoms = (): Entity[] => {
    const symptoms: Entity[] = [];
    
    // Get symptoms from history of present illness
    if (enhancedData?.soap_subjective?.components?.history_present_illness?.content?.current_symptoms) {
      symptoms.push(...enhancedData.soap_subjective.components.history_present_illness.content.current_symptoms);
    }
    
    // Get symptoms from review of systems if available
    if (enhancedData?.soap_subjective?.components?.review_of_systems?.content?.system_findings) {
      const systemFindings = enhancedData.soap_subjective.components.review_of_systems.content.system_findings;
      Object.values(systemFindings).forEach(system => {
        if (system.findings) {
          symptoms.push(...system.findings);
        }
      });
    }
    
    return symptoms;
  };

  // Get all diagnoses
  const getAllDiagnoses = (): Entity[] => {
    if (enhancedData?.soap_assessment?.components?.clinical_impression?.content?.diagnoses) {
      return enhancedData.soap_assessment.components.clinical_impression.content.diagnoses;
    }
    return [];
  };

  // Find relationships between symptoms and diagnoses
  const findClinicalRelationships = (diagnoses: Entity[], symptoms: Entity[]): Array<{diagnosis: Entity, symptoms: Entity[]}> => {
    const relationships: Array<{diagnosis: Entity, symptoms: Entity[]}> = [];
    
    diagnoses.forEach(diagnosis => {
      const relatedSymptoms = symptoms.filter(symptom => {
        // Simple matching based on name or evidence
        return diagnosis.supporting_evidence?.includes(symptom.name) ||
               diagnosis.name.toLowerCase().includes(symptom.name.toLowerCase()) ||
               symptom.name.toLowerCase().includes(diagnosis.name.toLowerCase());
      });
      
      if (relatedSymptoms.length > 0) {
        relationships.push({
          diagnosis,
          symptoms: relatedSymptoms
        });
      }
    });
    
    return relationships;
  };

  if (isLoading) return <AnalysisDisplaySkeleton />;
  if (error) return <ErrorMessage message={error} />;

  // Extract key data from the enhanced consultation
  const soapSubjective = enhancedData?.soap_subjective || {};
  const soapObjective = enhancedData?.soap_objective || {};
  const soapAssessment = enhancedData?.soap_assessment || {};
  const soapPlan = enhancedData?.soap_plan || {};
  const aiRisks = enhancedData?.ai_risks || [];
  const aiPatterns = enhancedData?.ai_patterns || [];
  const aiTimeline = enhancedData?.ai_timeline?.events || [];
  const aiSuggestions = enhancedData?.ai_suggestions || [];
  
  // Convert SOAP sections to SectionData for EntityGroups component
  const subjectiveData = convertToSectionData(soapSubjective);
  const objectiveData = convertToSectionData(soapObjective);
  const assessmentData = convertToSectionData(soapAssessment);
  const planData = convertToSectionData(soapPlan);
  
  // Process entities for highlighting and display
  const allSymptoms = getAllSymptoms();
  const allDiagnoses = getAllDiagnoses();
  const allEntities = [...allSymptoms, ...allDiagnoses];
  
  // Group high priority risks
  const highPriorityRisks = aiRisks.filter(risk => risk.severity === 'high');
  
  // Find clinical relationships
  const clinicalRelationships = findClinicalRelationships(allDiagnoses, allSymptoms);

  return (
    <div className="space-y-6">
      {/* Top nav tabs */}
      <Card variant="default" className="p-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex-none overflow-x-auto flex-nowrap whitespace-nowrap max-w-full">
            <TabsTrigger value="summary" className="flex-none items-center gap-1.5 min-w-[100px]">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="subjective" className="flex-none items-center gap-1.5 min-w-[100px]">
              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Subjetiva</span>
            </TabsTrigger>
            <TabsTrigger value="objective" className="flex-none items-center gap-1.5 min-w-[100px]">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Objetiva</span>
            </TabsTrigger>
            <TabsTrigger value="assessment" className="flex-none items-center gap-1.5 min-w-[100px]">
              <Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Diagnóstica</span>
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex-none items-center gap-1.5 min-w-[100px]">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Plan</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex-none items-center gap-1.5 min-w-[100px]">
              <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Análisis IA</span>
            </TabsTrigger>
          </TabsList>

          {/* Wrap all TabsContent components inside Tabs */}
          {!enhancedData ? (
            <Card variant="default">
              <CardContent className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                  <Lightbulb className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                </div>
                <CardTitle className="mb-2">No hay análisis disponible</CardTitle>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-4">
                  El análisis de la consulta se generará automáticamente una vez que las grabaciones sean procesadas.
                </p>
                <Badge variant="default" className="inline-flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  <span>Esperando procesamiento...</span>
                </Badge>
              </CardContent>
            </Card>
          ) : (
            <>
              <TabsContent value="summary" className="mt-0">
                <div className="space-y-6">
                  {/* Confidence score panel */}
                  {enhancedData.ai_confidence !== undefined && (
                    <Card variant="default" highlight="primary">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BarChart2 className="h-5 w-5 text-primary-500" />
                            <CardTitle>Confianza Global</CardTitle>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  enhancedData.ai_confidence >= 0.8 ? 'bg-success-500' : 
                                  enhancedData.ai_confidence >= 0.6 ? 'bg-primary-500' : 
                                  'bg-warning-500'
                                }`}
                                style={{ width: `${Math.round(enhancedData.ai_confidence * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {Math.round(enhancedData.ai_confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                    
                  {/* High priority alerts */}
                  {highPriorityRisks.length > 0 && (
                    <Card variant="default" highlight="danger">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-danger-500" />
                          <CardTitle>Alertas Críticas</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {highPriorityRisks.map((risk, index) => (
                          <Card 
                            key={index}
                            variant="bordered"
                            highlight={severityToBadgeVariant[risk.severity]}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start">
                                <AlertTriangle className="h-5 w-5 text-danger-500 mr-2 mt-0.5" />
                                <div>
                                  <h4 className="font-medium">{risk.description}</h4>
                                  {risk.recommendation && (
                                    <p className="mt-1 text-sm font-medium">
                                      Recomendación: {risk.recommendation}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                    
                  {/* Summary cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key diagnoses */}
                    <Card variant="default">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-5 w-5 text-primary-500" />
                          <CardTitle>Diagnósticos Principales</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {soapAssessment?.components?.clinical_impression?.content?.diagnoses
                          ?.filter(d => d.confidence && d.confidence >= 0.7)
                          .map((diagnosis, idx) => (
                            <Card 
                              key={idx}
                              variant="flat"
                              className={`${diagnosis.confidence ? getConfidenceInfo(diagnosis.confidence).colorClass : ""}`}
                            >
                              <CardContent className="p-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{diagnosis.name}</span>
                                  <Badge variant="default" size="sm">
                                    {Math.round((diagnosis.confidence || 0) * 100)}% confianza
                                  </Badge>
                                </div>
                                {diagnosis.location && (
                                  <div className="mt-1 text-sm">
                                    <AttributeTag label="Ubicación" value={diagnosis.location} />
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )) || (
                          <p className="text-neutral-500 dark:text-neutral-400 italic">
                            No hay diagnósticos principales
                          </p>
                        )}
                      </CardContent>
                    </Card>
                      
                    {/* Key symptoms */}
                    <Card variant="default">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-danger-500" />
                          <CardTitle>Síntomas Clave</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {allSymptoms
                          ?.filter(s => s.confidence && s.confidence >= 0.8)
                          .slice(0, 5)
                          .map((symptom, idx) => (
                            <Card 
                              key={idx}
                              variant="flat"
                              className={`${symptom.confidence ? getConfidenceInfo(symptom.confidence).colorClass : ""}`}
                            >
                              <CardContent className="p-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">
                                    {symptom.status === "active" && 
                                      <span className="text-primary-500 mr-1">●</span>}
                                    {symptom.name}
                                  </span>
                                  <Badge variant="default" size="sm">
                                    {Math.round((symptom.confidence || 0) * 100)}% confianza
                                  </Badge>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {symptom.duration && (
                                    <AttributeTag label="Duración" value={symptom.duration} />
                                  )}
                                  {symptom.intensity && (
                                    <AttributeTag label="Intensidad" value={symptom.intensity} />
                                  )}
                                  {symptom.location && (
                                    <AttributeTag label="Ubicación" value={symptom.location} />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )) || (
                          <p className="text-neutral-500 dark:text-neutral-400 italic">
                            No hay síntomas principales
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                    
                  {/* Clinical Relationships */}
                  {clinicalRelationships.length > 0 && (
                    <Card variant="default">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Filter className="h-5 w-5 text-info-500" />
                          <CardTitle>Relaciones Clínicas</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {clinicalRelationships.map((rel, idx) => (
                          <Card 
                            key={idx}
                            variant="flat"
                            className="bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800"
                          >
                            <CardContent className="p-3">
                              <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 flex items-center justify-between">
                                <div>{rel.diagnosis.name}</div>
                                <Badge variant="default" size="sm">
                                  {Math.round((rel.diagnosis.confidence || 0) * 100)}% confianza
                                </Badge>
                              </div>
                              <div className="pl-4 border-l-2 border-info-300 dark:border-info-700">
                                <div className="text-sm text-neutral-600 dark:text-neutral-300 mb-1">Síntomas relacionados:</div>
                                <div className="flex flex-wrap gap-2">
                                  {rel.symptoms.map((symptom, i) => (
                                    <Badge key={i} variant="default" size="sm">
                                      {symptom.name}
                                      {symptom.intensity && <span className="ml-1">({symptom.intensity})</span>}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                    
                  {/* Patterns & connections */}
                  {aiPatterns.length > 0 && (
                    <Section
                      title="Patrones y Conexiones"
                      icon={<Filter className="h-5 w-5 text-warning-500" />}
                      isCollapsible={true}
                      defaultCollapsed={collapsedSections.Patterns}
                      actions={
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSection('Patterns')}
                          className="h-8 w-8"
                        >
                          {collapsedSections.Patterns ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronUp className="h-5 w-5" />
                          )}
                        </Button>
                      }
                    >
                      <div className="space-y-3">
                        {aiPatterns.map((pattern, idx) => (
                          <Card
                            key={idx}
                            variant="flat"
                            className={`${getConfidenceInfo(pattern.confidence).colorClass}`}
                          >
                            <CardContent className="p-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">
                                  {pattern.type === 'clinical_correlation' ? 'Correlación Clínica' : 
                                  pattern.type === 'medication_effect' ? 'Efecto del Medicamento' : 
                                  pattern.type === 'symptom_progression' ? 'Progresión de Síntomas' :
                                  'Patrón Identificado'}
                                </span>
                                <Badge variant="default" size="sm">
                                  {Math.round(pattern.confidence * 100)}% confianza
                                </Badge>
                              </div>
                              <p className="text-sm">{pattern.description}</p>
                              {pattern.evidence && pattern.evidence.length > 0 && (
                                <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                                  <strong>Evidencia:</strong> {pattern.evidence.join(', ')}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="subjective" className="mt-0">
                <div className="space-y-6">
                  <Section
                    title="Evaluación subjetiva"
                    icon={<MessageCircle className="h-5 w-5" />}
                    isCollapsible={true}
                    defaultCollapsed={collapsedSections.Subjective}
                    actions={
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSection('Subjective')}
                        className="h-8 w-8"
                      >
                        {collapsedSections.Subjective ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronUp className="h-5 w-5" />
                        )}
                      </Button>
                    }
                  >
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg text-neutral-900 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                      {soapSubjective.summary ? (
                        <div>
                          {highlightEntitiesInText(soapSubjective.summary, allEntities)}
                        </div>
                      ) : (
                        <p className="text-neutral-500 dark:text-neutral-400 italic">
                          No hay datos subjetivos disponibles.
                        </p>
                      )}
                    </div>
                  </Section>
                  
                  {/* Entities section */}
                  {!collapsedSections.Subjective && (
                    <EntityGroups
                      sectionData={subjectiveData}
                      soapSection="subjective"
                      showTitle={true}
                      filter={entityFilter}
                      setFilter={setEntityFilter}
                    />
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="objective" className="mt-0">
                <div className="space-y-6">
                  <Section
                    title="Evaluación objetiva"
                    icon={<Activity className="h-5 w-5" />}
                    isCollapsible={true}
                    defaultCollapsed={collapsedSections.Objective}
                    actions={
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSection('Objective')}
                        className="h-8 w-8"
                      >
                        {collapsedSections.Objective ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronUp className="h-5 w-5" />
                        )}
                      </Button>
                    }
                  >
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg text-neutral-900 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                      {soapObjective.summary ? (
                        <div>{highlightEntitiesInText(soapObjective.summary, allEntities)}</div>
                      ) : (
                        <p className="text-neutral-500 dark:text-neutral-400 italic">
                          No hay datos objetivos disponibles.
                        </p>
                      )}
                    </div>
                  </Section>
                  
                  {/* Entities section */}
                  {!collapsedSections.Objective && (
                    <EntityGroups
                      sectionData={objectiveData}
                      soapSection="objective"
                      showTitle={true}
                      filter={entityFilter}
                      setFilter={setEntityFilter}
                    />
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="assessment" className="mt-0">
                <div className="space-y-6">
                  <Section
                    title="Evaluación diagnóstica"
                    icon={<Stethoscope className="h-5 w-5" />}
                    isCollapsible={true}
                    defaultCollapsed={collapsedSections.Assessment}
                    actions={
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSection('Assessment')}
                        className="h-8 w-8"
                      >
                        {collapsedSections.Assessment ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronUp className="h-5 w-5" />
                        )}
                      </Button>
                    }
                  >
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg text-neutral-900 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                      {soapAssessment.summary ? (
                        <div>
                          {highlightEntitiesInText(soapAssessment.summary, allEntities)}
                        </div>
                      ) : (
                        <p className="text-neutral-500 dark:text-neutral-400 italic">
                          No hay datos de evaluación diagnóstica disponibles.
                        </p>
                      )}
                    </div>
                  </Section>
                  
                  {/* Entities section */}
                  {!collapsedSections.Assessment && (
                    <div className="space-y-6">
                      <EntityGroups
                        sectionData={assessmentData}
                        soapSection="assessment"
                        showTitle={true}
                        filter={entityFilter}
                        setFilter={setEntityFilter}
                      />
                                      
                    {/* Diagnosis Management Component */}
                    <div className="mt-4">
                      <DiagnosisManagement sessionId={sessionId} />
                    </div>
                    
                      {/* Clinical Relationships */}
                      {clinicalRelationships.length > 0 && (
                        <Section
                          title="Relaciones Diagnósticas"
                          icon={<Filter className="h-5 w-5 text-info-500" />}
                          variant="default"
                        >
                          <div className="space-y-4">
                            {clinicalRelationships.map((rel, idx) => (
                              <Card 
                                key={idx}
                                variant="flat"
                                className="bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800"
                              >
                                <CardContent className="p-3">
                                  <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                                    {rel.diagnosis.name}
                                  </div>
                                  <div className="pl-4 border-l-2 border-info-300 dark:border-info-700">
                                    <div className="text-sm text-neutral-600 dark:text-neutral-300 mb-1">Síntomas relacionados:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {rel.symptoms.map((symptom, i) => (
                                        <Badge key={i} variant="default" size="sm">
                                          {symptom.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </Section>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="plan" className="mt-0">
                <div className="space-y-6">
                  <Section
                    title="Plan de Tratamiento"
                    icon={<CheckCircle className="h-5 w-5" />}
                    isCollapsible={true}
                    defaultCollapsed={collapsedSections.Plan}
                    actions={
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSection('Plan')}
                        className="h-8 w-8"
                      >
                        {collapsedSections.Plan ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronUp className="h-5 w-5" />
                        )}
                      </Button>
                    }
                  >
                    <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg text-neutral-900 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                      {soapPlan?.summary ? (
                        <div>{highlightEntitiesInText(soapPlan.summary, allEntities)}</div>
                      ) : (
                        <p className="text-neutral-500 dark:text-neutral-400 italic">
                          No hay información del plan disponible.
                        </p>
                      )}
                    </div>
                  </Section>
                  
                  {/* Plan entities and recommendations */}
                  {!collapsedSections.Plan && (
                    <div className="space-y-6">
                      <EntityGroups
                        sectionData={planData}
                        soapSection="plan"
                        showTitle={true}
                        filter={entityFilter}
                        setFilter={setEntityFilter}
                      />
                      
                      {/* Treatment Recommendations */}
                      {soapPlan?.components?.therapeutic_plan && (
                        <Section
                          title="Recomendaciones de Tratamiento"
                          icon={<CheckCircle className="h-5 w-5 text-success-500" />}
                          variant="default"
                        >
                          <div className="space-y-4">
                            {Object.entries(soapPlan.components.therapeutic_plan.content || {}).map(([key, plan]) => {
                              if (!plan || typeof plan !== 'object' || 
                                  key === 'medications' || Array.isArray(plan)) return null;
                              
                              return (
                                <Card key={key} variant="flat">
                                  <CardContent className="p-4">
                                    <h5 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 capitalize">
                                      {toSentenceCase(key.replace('_', ' '))}
                                    </h5>
                                    <div className="text-sm text-neutral-700 dark:text-neutral-300">
                                      {JSON.stringify(plan)}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </Section>
                      )}
                      
                      {/* Suggested Follow-up */}
                      {aiSuggestions && aiSuggestions.filter(s => s.type === 'follow_up').length > 0 && (
                        <Section
                          title="Seguimiento Recomendado"
                          icon={<Calendar className="h-5 w-5 text-primary-500" />}
                          variant="default"
                        >
                          <div className="space-y-3">
                            {aiSuggestions
                              .filter(s => s.type === 'follow_up' || s.text.toLowerCase().includes('seguimiento'))
                              .map((suggestion, idx) => (
                                <Card 
                                  key={idx}
                                  variant="flat"
                                  className="border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20"
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-center mb-1 gap-2">
                                      <Calendar className="h-4 w-4 text-primary-500" />
                                      <span className="font-medium">Seguimiento</span>
                                    </div>
                                    <p className="text-sm">{suggestion.text}</p>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </Section>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="insights" className="mt-0">
                <div className="space-y-6">
                  {/* Risks section */}
                  <Section
                    title="Riesgos Identificados"
                    icon={<AlertTriangle className="h-5 w-5 text-danger-500" />}
                    isCollapsible={true}
                    defaultCollapsed={collapsedSections.Risks}
                    actions={
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSection('Risks')}
                        className="h-8 w-8"
                      >
                        {collapsedSections.Risks ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronUp className="h-5 w-5" />
                        )}
                      </Button>
                    }
                  >
                    {aiRisks.length > 0 ? (
                      renderEnhancedRisks(aiRisks)
                    ) : (
                      <p className="text-neutral-500 dark:text-neutral-400 italic">
                        No se han identificado riesgos.
                      </p>
                    )}
                  </Section>
                  
                  {/* Patterns section */}
                  <Section
                    title="Patrones Clínicos"
                    icon={<Brain className="h-5 w-5 text-warning-500" />}
                    isCollapsible={true}
                    defaultCollapsed={collapsedSections.Patterns}
                    actions={
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSection('Patterns')}
                        className="h-8 w-8"
                      >
                        {collapsedSections.Patterns ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronUp className="h-5 w-5" />
                        )}
                      </Button>
                    }
                  >
                    <div className="space-y-3">
                      {aiPatterns.length > 0 ? (
                        aiPatterns.map((pattern, idx) => (
                          <Card
                            key={idx}
                            variant="flat"
                            className={`${getConfidenceInfo(pattern.confidence).colorClass}`}
                          >
                            <CardContent className="p-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">
                                  {pattern.type === 'clinical_correlation' ? 'Correlación Clínica' : 
                                  pattern.type === 'medication_effect' ? 'Efecto del Medicamento' : 
                                  pattern.type === 'symptom_progression' ? 'Progresión de Síntomas' :
                                  'Patrón Identificado'}
                                </span>
                                <Badge variant="default" size="sm">
                                  {Math.round(pattern.confidence * 100)}% confianza
                                </Badge>
                              </div>
                              <p className="text-sm">{pattern.description}</p>
                              {pattern.evidence && pattern.evidence.length > 0 && (
                                <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                                  <strong>Evidencia:</strong> {pattern.evidence.join(', ')}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <p className="text-neutral-500 dark:text-neutral-400 italic">
                          No se han identificado patrones clínicos.
                        </p>
                      )}
                    </div>
                  </Section>

                  {/* Timeline section */}
                  {aiTimeline && aiTimeline.length > 0 && (
                    <ConsultationTimeline
                      events={aiTimeline}
                      isCollapsed={collapsedSections.Timeline}
                      onToggleCollapse={() => toggleSection('Timeline')}
                    />
                  )}

                  {/* Suggestions section */}
                  {aiSuggestions && aiSuggestions.length > 0 && (
                    <Section
                      title="Sugerencias"
                      icon={<Lightbulb className="h-5 w-5 text-warning-500" />}
                      isCollapsible={true}
                      defaultCollapsed={collapsedSections.Suggestions}
                      actions={
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSection('Suggestions')}
                          className="h-8 w-8"
                        >
                          {collapsedSections.Suggestions ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronUp className="h-5 w-5" />
                          )}
                        </Button>
                      }
                    >
                      <div className="space-y-3">
                        {aiSuggestions.map((suggestion, idx) => (
                          <Card 
                            key={idx}
                            variant="flat"
                            className="border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20"
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center mb-1 gap-2">
                                <Zap className="h-4 w-4 text-warning-500" />
                                <span className="font-medium">
                                  {suggestion.type === 'treatment' ? 'Sugerencia de Tratamiento' : 
                                  suggestion.type === 'diagnosis' ? 'Sugerencia de Diagnóstico' : 
                                  suggestion.type === 'follow_up' ? 'Sugerencia de Seguimiento' :
                                  'Sugerencia'}
                                </span>
                              </div>
                              <p className="text-sm">{suggestion.text}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </Card>
    </div>
  );
}