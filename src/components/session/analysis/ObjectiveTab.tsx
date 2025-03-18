import React from "react";
import { Activity } from "lucide-react";
import { Section } from "@/components/ui/section";
import EntityGrid from "../entity/entity-grid";
import { highlightEntitiesInText } from "@/utils/highlightEntities";
import { AnalysisTabProps, convertToSectionData, Entity, VitalSign, Finding } from "./analysis-types";

export const ObjectiveTab: React.FC<AnalysisTabProps> = ({
  enhancedData,
  entityFilter,
  setEntityFilter
}) => {
  // Extract relevant data
  const soapObjective = enhancedData?.soap_objective || {};
  const objectiveData = convertToSectionData(soapObjective);

  // Get all entities for highlighting
  const getAllEntities = () => {
    const entities: Entity[] = [];
    const labResults: Entity[] = [];
    
    // Get findings from physical exam
    if (enhancedData?.soap_objective?.components?.physical_exam?.content?.findings) {
      const findings = enhancedData.soap_objective.components.physical_exam.content.findings;
      Object.entries(findings).forEach(([area, finding]) => {
        if (typeof finding === 'string') {
          entities.push({
            name: finding,
            location: area,
            type: 'physical_finding'
          });
        } else if (finding && typeof finding === 'object') {
          entities.push({
            name: (finding as Finding).description || area,
            status: (finding as Finding).status,
            value: (finding as Finding).value?.toString(),
            location: area,
            type: 'physical_finding'
          });
        }
      });
    }
    
    // Get vital signs if available
    if (enhancedData?.soap_objective?.components?.vital_signs?.content?.vital_signs) {
      const vitalSigns = enhancedData.soap_objective.components.vital_signs.content.vital_signs as Record<string, VitalSign>;
      Object.entries(vitalSigns).forEach(([name, data]) => {
        entities.push({
          name,
          value: data.value,
          unit: data.unit,
          confidence: data.confidence,
          type: 'vital_sign'
        });
      });
    }
    
    // Get lab results if available
    if (enhancedData?.soap_objective?.components?.lab_results?.content?.lab_results) {
      labResults.push(...(enhancedData.soap_objective.components.lab_results.content.lab_results as Entity[]));
    }
    
    // Add symptoms and diagnoses for cross-highlighting
    if (enhancedData?.soap_subjective?.components?.history_present_illness?.content?.current_symptoms) {
      entities.push(...(enhancedData.soap_subjective.components.history_present_illness.content.current_symptoms as Entity[]));
    }
    
    if (enhancedData?.soap_assessment?.components?.clinical_impression?.content?.diagnoses) {
      entities.push(...(enhancedData.soap_assessment.components.clinical_impression.content.diagnoses as Entity[]));
    }
    
    return { entities, labResults };
  };

  const { entities: allEntities, labResults } = getAllEntities();

  // Extract vital signs for display
  const getVitalSigns = () => {
    if (!enhancedData?.soap_objective?.components?.vital_signs?.content?.vital_signs) {
      return [];
    }
    
    const vitalSigns = enhancedData.soap_objective.components.vital_signs.content.vital_signs as Record<string, VitalSign>;
    return Object.entries(vitalSigns)
      .filter(([, data]) => data.value) // Only include vitals with values
      .map(([name, data]): Entity => ({
        name,
        value: data.value,
        unit: data.unit || '',
        confidence: data.confidence,
        type: 'vital_sign'
      }));
  };

  // Extract physical findings
  const getPhysicalFindings = () => {
    if (!enhancedData?.soap_objective?.components?.physical_exam?.content?.findings) {
      return [];
    }
    
    const findings = enhancedData.soap_objective.components.physical_exam.content.findings;
    const examFindings: Entity[] = [];
    
    Object.entries(findings).forEach(([area, finding]) => {
      if (typeof finding === 'string') {
        examFindings.push({
          name: finding,
          location: area,
          type: 'physical_finding'
        });
      } else if (finding && typeof finding === 'object') {
        examFindings.push({
          name: (finding as Finding).description || area,
          status: (finding as Finding).status,
          value: (finding as Finding).value?.toString(),
          location: area,
          type: 'physical_finding'
        });
      }
    });
    
    return examFindings;
  };

  // Filter entities based on the active filter
  const filterEntities = (entities: Entity[]): Entity[] => {
    if (!entities || entities.length === 0) return [];
    
    let filteredEntities = [...entities];
    
    // Apply active-only filter if enabled
    if (entityFilter?.showActiveOnly) {
      filteredEntities = filteredEntities.filter(e => e.status === 'active');
    }
    
    // Apply sorting based on selected filter
    switch (entityFilter?.sortBy) {
      case 'severity':
        return filteredEntities.sort((a, b) => {
          const severityOrder: Record<string, number> = {
            'severe': 3,
            'high': 3,
            'moderate': 2,
            'medium': 2,
            'mild': 1,
            'low': 1,
            '': 0
          };
          const aIntensity = a.intensity?.toLowerCase() || '';
          const bIntensity = b.intensity?.toLowerCase() || '';
          
          const aValue = Object.entries(severityOrder).find(([key]) => aIntensity.includes(key))?.[1] || 0;
          const bValue = Object.entries(severityOrder).find(([key]) => bIntensity.includes(key))?.[1] || 0;
          
          return bValue - aValue;
        });
      case 'alphabetical':
        return filteredEntities.sort((a, b) => a.name.localeCompare(b.name));
      case 'confidence':
      default:
        return filteredEntities.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    }
  };

  const vitalSigns = getVitalSigns();
  const physicalFindings = getPhysicalFindings();

  return (
    <div className="space-y-4 md:space-y-6">
      <Section
        title="Evaluación objetiva"
        icon={<Activity className="h-4 w-4 md:h-5 md:w-5" />}
      >
        <div className="bg-neutral-50 dark:bg-neutral-900 p-3 md:p-4 rounded-lg text-neutral-900 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
          {soapObjective.summary ? (
            <div className="text-sm md:text-base">{highlightEntitiesInText(soapObjective.summary, allEntities)}</div>
          ) : (
            <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 italic">
              No hay datos objetivos disponibles.
            </p>
          )}
        </div>
      </Section>
      
      {/* Vital Signs */}
      {vitalSigns.length > 0 && (
        <div className="mt-2 md:mt-4">
          <EntityGrid
            title="Signos Vitales"
            entities={filterEntities(vitalSigns)}
            className="bg-white dark:bg-neutral-900"
            hideHeader={false}
          />
        </div>
      )}
      
      {/* Physical Findings */}
      {physicalFindings.length > 0 && (
        <div className="mt-2 md:mt-4">
          <EntityGrid
            title="Hallazgos del Examen Físico"
            entities={filterEntities(physicalFindings)}
            className="bg-white dark:bg-neutral-900"
            hideHeader={false}
          />
        </div>
      )}
      
      {/* Lab Results */}
      {labResults.length > 0 && (
        <div className="mt-2 md:mt-4">
          <EntityGrid
            title="Resultados de Laboratorio"
            entities={filterEntities(labResults.map(result => ({
              ...result,
              type: 'lab_result'
            })))}
            className="bg-white dark:bg-neutral-900"
            hideHeader={false}
          />
        </div>
      )}
    </div>
  );
};

export default ObjectiveTab;