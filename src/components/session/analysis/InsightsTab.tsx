import React, { useState } from "react";
import { 
  AlertTriangle,
  Brain, 
  Lightbulb, 
  Zap,
  Stethoscope,
  Pill,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ConsultationTimeline from "../timeline/consultation-timeline";
import { AnalysisTabProps, RiskItem, severityToBadgeVariant } from "./analysis-types";
import { TimelineEvent } from "@/contexts/timeline-context";

// Local helper function since it's no longer exported from consultation-timeline
const getConfidenceInfo = (confidence: number) => {
  if (confidence >= 0.8) {
    return { colorClass: 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20' };
  } else if (confidence >= 0.5) {
    return { colorClass: 'border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20' };
  }
  return { colorClass: 'border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20' };
};

export const InsightsTab: React.FC<AnalysisTabProps> = ({
  enhancedData
}) => {
  const aiRisks = enhancedData?.ai_risks || [];
  const aiPatterns = enhancedData?.ai_patterns || [];
  const aiTimeline = enhancedData?.ai_timeline?.events || [];
  const aiSuggestions = enhancedData?.ai_suggestions || [];
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);

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
      <div className="space-y-4 sm:space-y-6">
        {Object.entries(risksByCategory).map(([category, categoryRisks]) => (
          <div key={category} className="space-y-2 sm:space-y-3">
            <h5 className="font-semibold text-neutral-900 dark:text-neutral-100 capitalize text-base sm:text-lg flex items-center gap-2">
              {category === 'clinical' ? (
                <>
                  <Stethoscope className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                  Riesgos Clínicos
                </>
              ) : category === 'medication' ? (
                <>
                  <Pill className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                  Riesgos de Medicación
                </>
              ) : category === 'adherence' ? (
                <>
                  <UserCheck className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                  Riesgos de Adherencia
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                  Otros Riesgos
                </>
              )}
            </h5>
            
            {categoryRisks.map((risk, idx) => (
              <Card key={idx} variant="default" highlight={severityToBadgeVariant[risk.severity] || 'danger'}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-danger-500 dark:text-danger-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="font-medium text-sm sm:text-base break-words">{risk.description}</div>
                        <Badge 
                          variant={severityToBadgeVariant[risk.severity] || 'danger'}
                          size="sm"
                          className="self-start sm:self-center flex-shrink-0"
                        >
                          {risk.severity === 'high' ? 'Alto' :
                           risk.severity === 'moderate' ? 'Moderado' : 'Bajo'}
                        </Badge>
                      </div>
                      
                      {risk.recommendation && (
                        <div className="flex items-start gap-2 p-2 bg-primary-50 dark:bg-primary-900/20 rounded text-xs sm:text-sm mt-2">
                          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-primary-500 mt-0.5" />
                          <div className="break-words">{risk.recommendation}</div>
                        </div>
                      )}
                      
                      {risk.evidence && risk.evidence.length > 0 && (
                        <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                          <strong>Evidencia:</strong>
                          <ul className="mt-1 space-y-1 pl-4">
                            {risk.evidence.map((ev, evIdx) => (
                              <li key={evIdx} className="list-disc list-outside break-words">{ev}</li>
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

  // Convert timeline events to match the TimelineEvent interface
  const processedTimelineEvents: TimelineEvent[] = aiTimeline.map(rawEvent => ({
    event_type: rawEvent.event_type,
    description: rawEvent.description,
    timestamp: rawEvent.timestamp,
    confidence: typeof rawEvent.metadata?.confidence === 'number' ? rawEvent.metadata.confidence : 1,
    details: rawEvent.description,
    metadata: rawEvent.metadata || {}
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Risks section */}
      <Section
        title="Riesgos Identificados"
        icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-danger-500" />}
      >
        {aiRisks.length > 0 ? (
          renderEnhancedRisks(aiRisks)
        ) : (
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 italic">
            No se han identificado riesgos.
          </p>
        )}
      </Section>
      
      {/* Patterns section */}
      <Section
        title="Patrones Clínicos"
        icon={<Brain className="h-4 w-4 sm:h-5 sm:w-5 text-warning-500" />}
      >
        <div className="space-y-2 sm:space-y-3">
          {aiPatterns.length > 0 ? (
            aiPatterns.map((pattern, idx) => (
              <Card
                key={idx}
                variant="flat"
                className={`${getConfidenceInfo(pattern.confidence).colorClass}`}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-1">
                    <span className="font-medium text-sm sm:text-base break-words">
                      {pattern.type === 'clinical_correlation' ? 'Correlación Clínica' : 
                      pattern.type === 'medication_effect' ? 'Efecto del Medicamento' : 
                      pattern.type === 'symptom_progression' ? 'Progresión de Síntomas' :
                      'Patrón Identificado'}
                    </span>
                    <Badge variant="default" size="sm" className="self-start sm:self-auto">
                      {Math.round(pattern.confidence * 100)}% confianza
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm break-words">{pattern.description}</p>
                  {pattern.evidence && pattern.evidence.length > 0 && (
                    <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <strong>Evidencia:</strong> {pattern.evidence.join(', ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 italic">
              No se han identificado patrones clínicos.
            </p>
          )}
        </div>
      </Section>

      {/* Timeline section */}
      {processedTimelineEvents.length > 0 && (
        <ConsultationTimeline 
          events={processedTimelineEvents} 
          isCollapsed={timelineCollapsed}
          onToggleCollapse={() => setTimelineCollapsed(!timelineCollapsed)}
        />
      )}

      {/* Suggestions section */}
      {aiSuggestions && aiSuggestions.length > 0 && (
        <Section
          title="Sugerencias"
          icon={<Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-warning-500" />}
        >
          <div className="space-y-2 sm:space-y-3">
            {aiSuggestions.map((suggestion, idx) => (
              <Card 
                key={idx}
                variant="flat"
                className="border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20"
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-warning-500" />
                    <span className="font-medium text-sm sm:text-base">
                      {suggestion.type === 'treatment' ? 'Sugerencia de Tratamiento' : 
                      suggestion.type === 'diagnosis' ? 'Sugerencia de Diagnóstico' : 
                      suggestion.type === 'follow_up' ? 'Sugerencia de Seguimiento' :
                      'Sugerencia'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm break-words">{suggestion.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
};

export default InsightsTab;