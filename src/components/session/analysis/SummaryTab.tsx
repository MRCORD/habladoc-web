import React from "react";
import { 
  BarChart2, 
  AlertTriangle, 
  Stethoscope, 
  Activity, 
  Filter
} from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { AttributeTag } from "@/components/common/attribute-tag";
import { getConfidenceInfo } from "../timeline/consultation-timeline";
import { 
  AnalysisTabProps, 
  Entity 
} from "./analysis-types";

export const SummaryTab: React.FC<AnalysisTabProps> = ({ 
  enhancedData
}) => {
  // Extract key data from the enhanced consultation
  const soapAssessment = enhancedData?.soap_assessment || {};
  const aiRisks = enhancedData?.ai_risks || [];
  const aiPatterns = enhancedData?.ai_patterns || [];
  
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

  const allSymptoms = getAllSymptoms();
  const allDiagnoses = getAllDiagnoses();
  
  // Group high priority risks
  const highPriorityRisks = aiRisks.filter(risk => risk.severity === 'high');
  
  // Find clinical relationships
  const clinicalRelationships = findClinicalRelationships(allDiagnoses, allSymptoms);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Confidence score panel */}
      {enhancedData.ai_confidence !== undefined && (
        <Card variant="default" highlight="primary">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary-500" />
                <CardTitle className="text-base sm:text-lg">Confianza Global</CardTitle>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="flex-1 sm:w-32 h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      enhancedData.ai_confidence >= 0.8 ? 'bg-success-500' : 
                      enhancedData.ai_confidence >= 0.6 ? 'bg-primary-500' : 
                      'bg-warning-500'
                    }`}
                    style={{ width: `${Math.round(enhancedData.ai_confidence * 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
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
          <CardHeader className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-danger-500" />
              <CardTitle className="text-base sm:text-lg">Alertas Críticas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 space-y-3">
            {highPriorityRisks.map((risk, index) => (
              <Card 
                key={index}
                variant="bordered"
                highlight="danger"
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base">{risk.description}</h4>
                      {risk.recommendation && (
                        <p className="mt-1 text-xs sm:text-sm font-medium break-words">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Key diagnoses */}
        <Card variant="default">
          <CardHeader className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary-500" />
              <CardTitle className="text-base sm:text-lg">Diagnósticos Principales</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 space-y-3">
            {soapAssessment?.components?.clinical_impression?.content?.diagnoses
              ?.filter(d => d.confidence && d.confidence >= 0.7)
              .map((diagnosis, idx) => (
                <Card 
                  key={idx}
                  variant="flat"
                  className={`${diagnosis.confidence ? getConfidenceInfo(diagnosis.confidence).colorClass : ""}`}
                >
                  <CardContent className="p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="font-medium text-sm sm:text-base break-words">{diagnosis.name}</span>
                      <Badge variant="default" size="sm" className="self-start sm:self-center whitespace-nowrap">
                        {Math.round((diagnosis.confidence || 0) * 100)}% confianza
                      </Badge>
                    </div>
                    {diagnosis.location && (
                      <div className="mt-2">
                        <AttributeTag label="Ubicación" value={diagnosis.location} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )) || (
              <p className="text-neutral-500 dark:text-neutral-400 italic text-sm">
                No hay diagnósticos principales
              </p>
            )}
          </CardContent>
        </Card>
          
        {/* Key symptoms */}
        <Card variant="default">
          <CardHeader className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-danger-500" />
              <CardTitle className="text-base sm:text-lg">Síntomas Clave</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 space-y-3">
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
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="font-medium text-sm sm:text-base">
                        {symptom.status === "active" && 
                          <span className="text-primary-500 mr-1">●</span>}
                        {symptom.name}
                      </span>
                      <Badge variant="default" size="sm" className="self-start sm:self-center whitespace-nowrap">
                        {Math.round((symptom.confidence || 0) * 100)}% confianza
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
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
              <p className="text-neutral-500 dark:text-neutral-400 italic text-sm">
                No hay síntomas principales
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clinical Relationships */}
      {clinicalRelationships.length > 0 && (
        <Card variant="default">
          <CardHeader className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-info-500" />
              <CardTitle className="text-base sm:text-lg">Relaciones Clínicas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 space-y-3">
            {clinicalRelationships.map((rel, idx) => (
              <Card 
                key={idx}
                variant="flat"
                className="bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800"
              >
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                    <div className="font-medium text-sm sm:text-base text-neutral-900 dark:text-neutral-100 break-words">{rel.diagnosis.name}</div>
                    <Badge variant="default" size="sm" className="self-start sm:self-center whitespace-nowrap">
                      {Math.round((rel.diagnosis.confidence || 0) * 100)}% confianza
                    </Badge>
                  </div>
                  <div className="pl-3 sm:pl-4 border-l-2 border-info-300 dark:border-info-700">
                    <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mb-2">Síntomas relacionados:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {rel.symptoms.map((symptom, i) => (
                        <Badge key={i} variant="default" size="sm" className="text-xs">
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
        >
          <div className="space-y-3">
            {aiPatterns.map((pattern, idx) => (
              <Card
                key={idx}
                variant="flat"
                className={`${getConfidenceInfo(pattern.confidence).colorClass}`}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                    <span className="font-medium text-sm sm:text-base">
                      {pattern.type === 'clinical_correlation' ? 'Correlación Clínica' : 
                      pattern.type === 'medication_effect' ? 'Efecto del Medicamento' : 
                      pattern.type === 'symptom_progression' ? 'Progresión de Síntomas' :
                      'Patrón Identificado'}
                    </span>
                    <Badge variant="default" size="sm" className="self-start sm:self-center whitespace-nowrap">
                      {Math.round(pattern.confidence * 100)}% confianza
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm">{pattern.description}</p>
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
  );
};

export default SummaryTab;