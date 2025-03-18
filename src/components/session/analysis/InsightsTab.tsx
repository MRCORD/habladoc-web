import React from "react";
import { 
  AlertTriangle,
  Brain, 
  Lightbulb, 
  Zap,
  ChevronDown, 
  ChevronUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getConfidenceInfo } from "../timeline/consultation-timeline";
import ConsultationTimeline from "../timeline/consultation-timeline";
import { AnalysisTabProps, RiskItem, severityToBadgeVariant } from "./analysis-types";

export const InsightsTab: React.FC<AnalysisTabProps> = ({
  enhancedData,
  collapsedSections,
  toggleSection
}) => {
  const aiRisks = enhancedData?.ai_risks || [];
  const aiPatterns = enhancedData?.ai_patterns || [];
  const aiTimeline = enhancedData?.ai_timeline?.events || [];
  const aiSuggestions = enhancedData?.ai_suggestions || [];

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
                          <AlertTriangle className="h-4 w-4 text-primary-500 mt-0.5" />
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

  return (
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
  );
};

export default InsightsTab;