import React, { useState, useEffect, useCallback } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
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
import api from "@/lib/api";
import EntityGroups from "../entity/entity-groups";
import { highlightEntitiesInText } from "@/utils/highlightEntities";
import { AttributeTag, toSentenceCase } from "@/components/common/attribute-tag";
import ConsultationTimeline, { getConfidenceInfo } from "../timeline/consultation-timeline";
import { TimelineEvent } from '@/contexts/timeline-context';

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

  // Helper function to get risk severity color
  const getRiskSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high':
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800";
      case 'moderate':
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800";
      case 'low':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    }
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
            <h5 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
              {category === 'clinical' ? 'Riesgos Clínicos' :
               category === 'medication' ? 'Riesgos de Medicación' :
               category === 'adherence' ? 'Riesgos de Adherencia' :
               'Otros Riesgos'}
            </h5>
            
            {categoryRisks.map((risk, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${getRiskSeverityColor(risk.severity)}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{risk.description}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        risk.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        risk.severity === 'moderate' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {risk.severity === 'high' ? 'Alto' :
                         risk.severity === 'moderate' ? 'Moderado' : 'Bajo'}
                      </span>
                    </div>
                    
                    {risk.recommendation && (
                      <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm mt-2">
                        <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div>{risk.recommendation}</div>
                      </div>
                    )}
                    
                    {risk.evidence && risk.evidence.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
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
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) return <AnalysisDisplaySkeleton />;
  if (error) return <ErrorMessage message={error} />;

  // Enhanced tabs for more clinical context
  const tabs = [
    { id: "summary", label: "Resumen", icon: <FileText className="h-4 w-4" /> },
    { id: "subjective", label: "Subjetiva", icon: <MessageCircle className="h-4 w-4" /> },
    { id: "objective", label: "Objetiva", icon: <Activity className="h-4 w-4" /> },
    { id: "assessment", label: "Diagnóstica", icon: <Stethoscope className="h-4 w-4" /> },
    { id: "plan", label: "Plan", icon: <CheckCircle className="h-4 w-4" /> },
    { id: "insights", label: "Análisis IA", icon: <Brain className="h-4 w-4" /> }
  ];
  
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
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-2 border border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {!enhancedData ? (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
            <Lightbulb className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No hay análisis disponible
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
            El análisis de la consulta se generará automáticamente una vez que las grabaciones sean procesadas.
          </p>
          <div className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-full">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Esperando procesamiento...
          </div>
        </div>
      ) : (
        <>
          {/* SUMMARY TAB */}
          {activeTab === "summary" && (
            <div className="space-y-6">
              {/* Confidence score - similar to original */}
              {enhancedData.ai_confidence !== undefined && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                      <BarChart2 className="h-5 w-5 text-blue-500 mr-2" />
                      Confianza Global
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            enhancedData.ai_confidence >= 0.8 ? 'bg-green-500' : 
                            enhancedData.ai_confidence >= 0.6 ? 'bg-blue-500' : 
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.round(enhancedData.ai_confidence * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(enhancedData.ai_confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* High priority alerts - similar to original */}
              {highPriorityRisks.length > 0 && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border-l-4 border-red-500">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    Alertas Críticas
                  </h3>
                  <div className="space-y-4">
                    {highPriorityRisks.map((risk, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border ${getRiskSeverityColor(risk.severity)}`}
                      >
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                          <div>
                            <h4 className="font-medium">{risk.description}</h4>
                            {risk.recommendation && (
                              <p className="mt-1 text-sm font-medium">
                                Recomendación: {risk.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Summary cards - similar to original but enhanced */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Key diagnoses */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <Stethoscope className="h-5 w-5 text-blue-500 mr-2" />
                    Diagnósticos Principales
                  </h3>
                  <div className="space-y-3">
                    {soapAssessment?.components?.clinical_impression?.content?.diagnoses
                      ?.filter(d => d.confidence && d.confidence >= 0.7)
                      .map((diagnosis, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-lg border ${diagnosis.confidence ? getConfidenceInfo(diagnosis.confidence).colorClass : ""}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{diagnosis.name}</span>
                            <span className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                              {Math.round((diagnosis.confidence || 0) * 100)}% confianza
                            </span>
                          </div>
                          {diagnosis.location && (
                            <div className="mt-1 text-sm">
                              <AttributeTag label="Ubicación" value={diagnosis.location} />
                            </div>
                          )}
                        </div>
                      )) || (
                      <p className="text-gray-500 dark:text-gray-400 italic">
                        No hay diagnósticos principales
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Key symptoms */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <Activity className="h-5 w-5 text-red-500 mr-2" />
                    Síntomas Clave
                  </h3>
                  <div className="space-y-3">
                    {allSymptoms
                      ?.filter(s => s.confidence && s.confidence >= 0.8)
                      .slice(0, 5)
                      .map((symptom, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-lg border ${symptom.confidence ? getConfidenceInfo(symptom.confidence).colorClass : ""}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {symptom.status === "active" && "● "}{symptom.name}
                            </span>
                            <span className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                              {Math.round((symptom.confidence || 0) * 100)}% confianza
                            </span>
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
                        </div>
                      )) || (
                      <p className="text-gray-500 dark:text-gray-400 italic">
                        No hay síntomas principales
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Clinical Relationships */}
              {clinicalRelationships.length > 0 && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <Filter className="h-5 w-5 text-indigo-500 mr-2" />
                    Relaciones Clínicas
                  </h3>
                  
                  <div className="space-y-4">
                    {clinicalRelationships.map((rel, idx) => (
                      <div key={idx} className="p-3 border border-indigo-200 dark:border-indigo-800 rounded-lg 
                                             bg-indigo-50 dark:bg-indigo-900/20">
                        <div className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center justify-between">
                          <div>{rel.diagnosis.name}</div>
                          <span className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                            {Math.round((rel.diagnosis.confidence || 0) * 100)}% confianza
                          </span>
                        </div>
                        <div className="pl-4 border-l-2 border-indigo-300 dark:border-indigo-700">
                          <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Síntomas relacionados:</div>
                          <div className="flex flex-wrap gap-2">
                            {rel.symptoms.map((symptom, i) => (
                              <span key={i} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 
                                                    rounded-md border border-gray-200 dark:border-gray-700">
                                {symptom.name}
                                {symptom.intensity && <span className="ml-1">({symptom.intensity})</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Patterns & connections */}
              {aiPatterns.length > 0 && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                      <Filter className="h-5 w-5 text-purple-500 mr-2" />
                      Patrones y Conexiones
                    </h3>
                    <button 
                      onClick={() => toggleSection('Patterns')}
                      className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      {collapsedSections.Patterns ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  {!collapsedSections.Patterns && (
                    <div className="space-y-3">
                      {aiPatterns.map((pattern, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-lg border ${getConfidenceInfo(pattern.confidence).colorClass}`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">
                              {pattern.type === 'clinical_correlation' ? 'Correlación Clínica' : 
                              pattern.type === 'medication_effect' ? 'Efecto del Medicamento' : 
                              pattern.type === 'symptom_progression' ? 'Progresión de Síntomas' :
                              'Patrón Identificado'}
                            </span>
                            <span className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                              {Math.round(pattern.confidence * 100)}% confianza
                            </span>
                          </div>
                          <p className="text-sm">{pattern.description}</p>
                          {pattern.evidence && pattern.evidence.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <strong>Evidencia:</strong> {pattern.evidence.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* SUBJECTIVE TAB - Enhanced with proper header hierarchy */}
          {activeTab === "subjective" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Evaluación subjetiva
                  </h2>
                  <button 
                    onClick={() => toggleSection('Subjective')}
                    className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    {collapsedSections.Subjective ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {/* Summary section */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                  {soapSubjective.summary ? (
                    <div>
                      {highlightEntitiesInText(soapSubjective.summary, allEntities)}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                      No hay datos subjetivos disponibles.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Entities section - with a single, unified header */}
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
          )}
          
          {/* OBJECTIVE TAB */}
          {activeTab === "objective" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Evaluación objetiva
                  </h2>
                  <button 
                    onClick={() => toggleSection('Objective')}
                    className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    {collapsedSections.Objective ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {/* Summary section */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                  {soapObjective.summary ? (
                    <div>{highlightEntitiesInText(soapObjective.summary, allEntities)}</div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                      No hay datos objetivos disponibles.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Entities section - with a single, unified header */}
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
          )}
          
          {/* ASSESSMENT TAB */}
          {activeTab === "assessment" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    <Stethoscope className="h-5 w-5 mr-2" />
                    Evaluación diagnóstica
                  </h2>
                  <button 
                    onClick={() => toggleSection('Assessment')}
                    className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    {collapsedSections.Assessment ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {/* Summary section */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                  {soapAssessment.summary ? (
                    <div>
                      {highlightEntitiesInText(soapAssessment.summary, allEntities)}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                      No hay datos de evaluación diagnóstica disponibles.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Entities section - with a single, unified header */}
              {!collapsedSections.Assessment && (
                <div className="space-y-6">
                  <EntityGroups
                    sectionData={assessmentData}
                    soapSection="assessment"
                    showTitle={true}
                    filter={entityFilter}
                    setFilter={setEntityFilter}
                  />
                
                  {/* Clinical Relationships */}
                  {clinicalRelationships.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <Filter className="h-5 w-5 text-indigo-500 mr-2" />
                        Relaciones Diagnósticas
                      </h3>
                      
                      <div className="space-y-4">
                        {clinicalRelationships.map((rel, idx) => (
                          <div key={idx} className="p-3 border border-blue-200 dark:border-blue-800 rounded-lg 
                                                 bg-blue-50 dark:bg-blue-900/20">
                            <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                              {rel.diagnosis.name}
                            </div>
                            <div className="pl-4 border-l-2 border-blue-300 dark:border-blue-700">
                              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Síntomas relacionados:</div>
                              <div className="flex flex-wrap gap-2">
                                {rel.symptoms.map((symptom, i) => (
                                  <span key={i} className="px-2 py-1 text-xs bg-white dark:bg-gray-800 
                                                        rounded-full border border-gray-200 dark:border-gray-700">
                                    {symptom.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* PLAN TAB */}
          {activeTab === "plan" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Plan de Tratamiento
                  </h2>
                  <button 
                    onClick={() => toggleSection('Plan')}
                    className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    {collapsedSections.Plan ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {/* Summary section */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                  {soapPlan?.summary ? (
                    <div>{highlightEntitiesInText(soapPlan.summary, allEntities)}</div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                      No hay información del plan disponible.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Entities section - with a single, unified header */}
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
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        Recomendaciones de Tratamiento
                      </h3>
                      
                      <div className="space-y-4">
                        {Object.entries(soapPlan.components.therapeutic_plan.content || {}).map(([key, plan]) => {
                          if (!plan || typeof plan !== 'object' || 
                              key === 'medications' || Array.isArray(plan)) return null;
                          
                          return (
                            <div key={key} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 capitalize">
                                {toSentenceCase(key.replace('_', ' '))}
                              </h5>
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {JSON.stringify(plan)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Suggested Follow-up */}
                  {aiSuggestions && aiSuggestions.filter(s => s.type === 'follow_up').length > 0 && (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                        Seguimiento Recomendado
                      </h3>
                      
                      <div className="space-y-3">
                        {aiSuggestions
                          .filter(s => s.type === 'follow_up' || s.text.toLowerCase().includes('seguimiento'))
                          .map((suggestion, idx) => (
                            <div 
                              key={idx}
                              className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                            >
                              <div className="flex items-center mb-1 gap-2">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Seguimiento</span>
                              </div>
                              <p className="text-sm">{suggestion.text}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* AI INSIGHTS TAB - Enhanced with better organization */}
          {activeTab === "insights" && (
            <div className="space-y-6">
              {/* Risks section - Enhanced with categories */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    Riesgos Identificados
                  </h3>
                  <button 
                    onClick={() => toggleSection('Risks')}
                    className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    {collapsedSections.Risks ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {!collapsedSections.Risks && (
                  <>
                    {aiRisks.length > 0 ? (
                      renderEnhancedRisks(aiRisks)
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">
                        No se han identificado riesgos.
                      </p>
                    )}
                  </>
                )}
              </div>
              
              {/* Patterns section - Similar to original */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <Brain className="h-5 w-5 text-purple-500 mr-2" />
                    Patrones Clínicos
                  </h3>
                  <button 
                    onClick={() => toggleSection('Patterns')}
                    className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    {collapsedSections.Patterns ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {!collapsedSections.Patterns && (
                  <div className="space-y-3">
                    {aiPatterns.length > 0 ? (
                      aiPatterns.map((pattern, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-lg border ${getConfidenceInfo(pattern.confidence).colorClass}`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">
                              {pattern.type === 'clinical_correlation' ? 'Correlación Clínica' : 
                              pattern.type === 'medication_effect' ? 'Efecto del Medicamento' : 
                              pattern.type === 'symptom_progression' ? 'Progresión de Síntomas' :
                              'Patrón Identificado'}
                            </span>
                            <span className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                              {Math.round(pattern.confidence * 100)}% confianza
                            </span>
                          </div>
                          <p className="text-sm">{pattern.description}</p>
                          {pattern.evidence && pattern.evidence.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <strong>Evidencia:</strong> {pattern.evidence.join(', ')}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">
                        No se han identificado patrones clínicos.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Timeline section */}
              {aiTimeline && aiTimeline.length > 0 && (
                <ConsultationTimeline
                  events={aiTimeline}
                  isCollapsed={collapsedSections.Timeline}
                  onToggleCollapse={() => toggleSection('Timeline')}
                />
              )}

              {/* Suggestions section - Show only if there are suggestions */}
              {aiSuggestions && aiSuggestions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                      <Lightbulb className="h-5 w-5 text-amber-500 mr-2" />
                      Sugerencias
                    </h3>
                    <button 
                      onClick={() => toggleSection('Suggestions')}
                      className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      {collapsedSections.Suggestions ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  {!collapsedSections.Suggestions && (
                    <div className="space-y-3">
                      {aiSuggestions.map((suggestion, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20`}
                        >
                          <div className="flex items-center mb-1 gap-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">
                              {suggestion.type === 'treatment' ? 'Sugerencia de Tratamiento' : 
                               suggestion.type === 'diagnosis' ? 'Sugerencia de Diagnóstico' : 
                               suggestion.type === 'follow_up' ? 'Sugerencia de Seguimiento' :
                               'Sugerencia'}
                            </span>
                          </div>
                          <p className="text-sm">{suggestion.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}