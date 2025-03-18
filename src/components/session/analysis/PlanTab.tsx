import React from "react";
import { CheckCircle, Calendar } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import EntityGroups from "../entity/entity-groups";
import { highlightEntitiesInText } from "@/utils/highlightEntities";
import { toSentenceCase } from "@/components/common/attribute-tag";
import { AnalysisTabProps, convertToSectionData } from "./analysis-types";

export const PlanTab: React.FC<AnalysisTabProps> = ({
  enhancedData,
  entityFilter,
  setEntityFilter
}) => {
  // Extract relevant data
  const soapPlan = enhancedData?.soap_plan || {};
  const planData = convertToSectionData(soapPlan);
  const aiSuggestions = enhancedData?.ai_suggestions || [];

  // Get all entities for highlighting
  const getAllEntities = () => {
    const entities = [];
    
    // Add medications from treatment plan
    const medications = enhancedData?.soap_plan?.components?.therapeutic_plan?.content?.medications;
    if (medications && Array.isArray(medications)) {
      entities.push(...medications);
    }
    
    // Add diagnoses for cross-highlighting
    const diagnoses = enhancedData?.soap_assessment?.components?.clinical_impression?.content?.diagnoses;
    if (diagnoses && Array.isArray(diagnoses)) {
      entities.push(...diagnoses);
    }
    
    // Add symptoms for cross-highlighting
    const symptoms = enhancedData?.soap_subjective?.components?.history_present_illness?.content?.current_symptoms;
    if (symptoms && Array.isArray(symptoms)) {
      entities.push(...symptoms);
    }
    
    return entities;
  };

  const allEntities = getAllEntities();

  // Process therapeutic plan content safely
  const getTherapeuticPlanContent = () => {
    const content = soapPlan?.components?.therapeutic_plan?.content;
    if (!content || typeof content !== 'object') {
      return [];
    }
    return Object.entries(content).filter(([key, value]) => 
      value && 
      typeof value === 'object' && 
      !Array.isArray(value) && 
      key !== 'medications'
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Section
        title="Plan de Tratamiento"
        icon={<CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
        variant="default"
      >
        <div className="bg-neutral-50 dark:bg-neutral-900 p-3 sm:p-4 rounded-lg text-neutral-900 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
          {soapPlan?.summary ? (
            <div className="text-sm sm:text-base">{highlightEntitiesInText(soapPlan.summary, allEntities)}</div>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">
              No hay información del plan disponible.
            </p>
          )}
        </div>
      </Section>
      
      {/* Plan entities and recommendations */}
      <div className="space-y-4 sm:space-y-6">
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
            icon={<CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success-500" />}
            variant="default"
          >
            <div className="grid gap-3 sm:gap-4">
              {getTherapeuticPlanContent().map(([key, plan]) => (
                <Card key={key} variant="flat">
                  <CardContent className="p-3 sm:p-4">
                    <h5 className="text-sm sm:text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      {toSentenceCase(key.replace('_', ' '))}
                    </h5>
                    <div className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                      {JSON.stringify(plan)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>
        )}
        
        {/* Suggested Follow-up */}
        {aiSuggestions && aiSuggestions.filter(s => s.type === 'follow_up').length > 0 && (
          <Section
            title="Seguimiento Recomendado"
            icon={<Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500" />}
            variant="default"
          >
            <div className="grid gap-2 sm:gap-3">
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
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-500" />
                        <span className="font-medium text-sm">Seguimiento</span>
                      </div>
                      <p className="text-xs sm:text-sm">{suggestion.text}</p>
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

export default PlanTab;