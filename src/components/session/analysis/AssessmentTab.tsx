import React from "react";
import { Stethoscope, Filter } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EntityGroups from "../entity/entity-groups";
import { highlightEntitiesInText } from "@/utils/highlightEntities";
import DiagnosisManagement from '@/components/session/diagnosis/DiagnosisManagement';
import { AnalysisTabProps, convertToSectionData, Entity } from "./analysis-types";

export const AssessmentTab: React.FC<AnalysisTabProps> = ({
  enhancedData,
  sessionId,
  entityFilter,
  setEntityFilter
}) => {
  // Extract relevant data
  const soapAssessment = enhancedData?.soap_assessment || {};
  const assessmentData = convertToSectionData(soapAssessment);

  // Get all entities for highlighting
  const getAllEntities = () => {
    const entities = [];
    
    // Add diagnoses
    if (enhancedData?.soap_assessment?.components?.clinical_impression?.content?.diagnoses) {
      entities.push(...enhancedData.soap_assessment.components.clinical_impression.content.diagnoses);
    }
    
    // Add symptoms for relationships
    if (enhancedData?.soap_subjective?.components?.history_present_illness?.content?.current_symptoms) {
      entities.push(...enhancedData.soap_subjective.components.history_present_illness.content.current_symptoms);
    }
    
    // Add symptoms from review of systems
    if (enhancedData?.soap_subjective?.components?.review_of_systems?.content?.system_findings) {
      const systemFindings = enhancedData.soap_subjective.components.review_of_systems.content.system_findings;
      Object.values(systemFindings).forEach(system => {
        if (system.findings) {
          entities.push(...system.findings);
        }
      });
    }
    
    return entities;
  };

  // Get all symptoms
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

  const allEntities = getAllEntities();
  const allSymptoms = getAllSymptoms();
  const allDiagnoses = getAllDiagnoses();
  
  // Find clinical relationships
  const clinicalRelationships = findClinicalRelationships(allDiagnoses, allSymptoms);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Section
        title="Evaluación diagnóstica"
        icon={<Stethoscope className="h-5 w-5" />}
        variant="default"
      >
        <div className="bg-neutral-50 dark:bg-neutral-900 p-3 sm:p-4 rounded-lg text-neutral-900 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
          {soapAssessment.summary ? (
            <div className="text-sm sm:text-base">
              {highlightEntitiesInText(soapAssessment.summary, allEntities)}
            </div>
          ) : (
            <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 italic">
              No hay datos de evaluación diagnóstica disponibles.
            </p>
          )}
        </div>
      </Section>
      
      {/* Entities section and diagnosis management */}
      <div className="space-y-4 sm:space-y-6">
        <EntityGroups
          sectionData={assessmentData}
          soapSection="assessment"
          showTitle={true}
          filter={entityFilter}
          setFilter={setEntityFilter}
        />
                      
        {/* Diagnosis Management Component */}
        <div className="mt-3 sm:mt-4">
          <DiagnosisManagement sessionId={sessionId} />
        </div>
      
        {/* Clinical Relationships */}
        {clinicalRelationships.length > 0 && (
          <Section
            title="Relaciones Diagnósticas"
            icon={<Filter className="h-5 w-5 text-info-500" />}
            variant="default"
          >
            <div className="space-y-3 sm:space-y-4">
              {clinicalRelationships.map((rel, idx) => (
                <Card 
                  key={idx}
                  variant="flat"
                  className="bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800"
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="font-medium text-sm sm:text-base text-neutral-900 dark:text-neutral-100 mb-2">
                      {rel.diagnosis.name}
                    </div>
                    <div className="pl-3 sm:pl-4 border-l-2 border-info-300 dark:border-info-700">
                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mb-1">Síntomas relacionados:</div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
    </div>
  );
};

export default AssessmentTab;