import React from "react";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import EntityGroups from "../entity/entity-groups";
import { highlightEntitiesInText } from "@/utils/highlightEntities";
import { AnalysisTabProps, convertToSectionData } from "./analysis-types";

export const ObjectiveTab: React.FC<AnalysisTabProps> = ({
  enhancedData,
  collapsedSections,
  toggleSection,
  entityFilter,
  setEntityFilter
}) => {
  // Extract relevant data
  const soapObjective = enhancedData?.soap_objective || {};
  const objectiveData = convertToSectionData(soapObjective);

  // Get all entities for highlighting
  const getAllEntities = () => {
    const entities = [];
    
    // Get findings from physical exam
    if (enhancedData?.soap_objective?.components?.physical_exam?.content?.findings) {
      const findings = enhancedData.soap_objective.components.physical_exam.content.findings;
      Object.values(findings).forEach(finding => {
        if (finding) {
          entities.push(finding);
        }
      });
    }
    
    // Get vital signs if available
    if (enhancedData?.soap_objective?.components?.vital_signs?.content?.vital_signs) {
      const vitalSigns = enhancedData.soap_objective.components.vital_signs.content.vital_signs;
      Object.entries(vitalSigns).forEach(([name, data]) => {
        entities.push({
          name,
          value: data.value,
          unit: data.unit,
          confidence: data.confidence
        });
      });
    }
    
    // Add symptoms and diagnoses for cross-highlighting
    if (enhancedData?.soap_subjective?.components?.history_present_illness?.content?.current_symptoms) {
      entities.push(...enhancedData.soap_subjective.components.history_present_illness.content.current_symptoms);
    }
    
    if (enhancedData?.soap_assessment?.components?.clinical_impression?.content?.diagnoses) {
      entities.push(...enhancedData.soap_assessment.components.clinical_impression.content.diagnoses);
    }
    
    return entities;
  };

  const allEntities = getAllEntities();

  return (
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
  );
};

export default ObjectiveTab;