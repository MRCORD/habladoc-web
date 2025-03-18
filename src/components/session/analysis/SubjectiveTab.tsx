import React from "react";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import EntityGroups from "../entity/entity-groups";
import { highlightEntitiesInText } from "@/utils/highlightEntities";
import { AnalysisTabProps, convertToSectionData } from "./analysis-types";

export const SubjectiveTab: React.FC<AnalysisTabProps> = ({
  enhancedData,
  collapsedSections,
  toggleSection,
  entityFilter,
  setEntityFilter
}) => {
  // Extract relevant data
  const soapSubjective = enhancedData?.soap_subjective || {};
  const subjectiveData = convertToSectionData(soapSubjective);

  // Get all entities for highlighting
  const getAllEntities = () => {
    const entities = [];
    
    // Get symptoms from history of present illness
    if (enhancedData?.soap_subjective?.components?.history_present_illness?.content?.current_symptoms) {
      entities.push(...enhancedData.soap_subjective.components.history_present_illness.content.current_symptoms);
    }
    
    // Get symptoms from review of systems
    if (enhancedData?.soap_subjective?.components?.review_of_systems?.content?.system_findings) {
      const systemFindings = enhancedData.soap_subjective.components.review_of_systems.content.system_findings;
      Object.values(systemFindings).forEach(system => {
        if (system.findings) {
          entities.push(...system.findings);
        }
      });
    }
    
    // Add diagnoses if available
    if (enhancedData?.soap_assessment?.components?.clinical_impression?.content?.diagnoses) {
      entities.push(...enhancedData.soap_assessment.components.clinical_impression.content.diagnoses);
    }
    
    return entities;
  };

  const allEntities = getAllEntities();

  return (
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
  );
};

export default SubjectiveTab;