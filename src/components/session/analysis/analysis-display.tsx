import React, { useState, useEffect, useCallback } from "react";
import { 
  FileText, 
  Activity, 
  MessageCircle, 
  Stethoscope,
  Brain,
  Lightbulb,
  Clock,
  CheckCircle
} from "lucide-react";
import { ErrorMessage } from "@/components/common/error-message";
import { AnalysisDisplaySkeleton } from "@/components/common/loading-skeletons";
import { 
  Card, 
  CardContent, 
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import api from "@/lib/api";
import { EnhancedConsultationData } from "./analysis-types";
import SummaryTab from "./SummaryTab";
import SubjectiveTab from "./SubjectiveTab";
import ObjectiveTab from "./ObjectiveTab";
import AssessmentTab from "./AssessmentTab";
import PlanTab from "./PlanTab";
import InsightsTab from "./InsightsTab";

interface AnalysisDisplayProps {
  sessionId: string;
}

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
    // Helper function for sentence case
    const toSentenceCase = (str: string): string => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    // Process all sections with entities
    const processedData = { ...data };

    // Process subjective section entities
    if (processedData.soap_subjective?.components?.history_present_illness?.content?.current_symptoms) {
      processedData.soap_subjective.components.history_present_illness.content.current_symptoms = 
        processedData.soap_subjective.components.history_present_illness.content.current_symptoms.map(e => ({
          ...e,
          name: toSentenceCase(e.name)
        }));
    }

    // Process assessment section entities
    if (processedData.soap_assessment?.components?.clinical_impression?.content?.diagnoses) {
      processedData.soap_assessment.components.clinical_impression.content.diagnoses = 
        processedData.soap_assessment.components.clinical_impression.content.diagnoses.map(e => ({
          ...e,
          name: toSentenceCase(e.name)
        }));
    }
    
    return processedData;
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

  if (isLoading) return <AnalysisDisplaySkeleton />;
  if (error) return <ErrorMessage message={error} />;

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

          {/* TabsContent for empty state or with tabs */}
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
                <SummaryTab 
                  enhancedData={enhancedData} 
                  sessionId={sessionId}
                  collapsedSections={collapsedSections}
                  toggleSection={toggleSection}
                  entityFilter={entityFilter}
                  setEntityFilter={setEntityFilter}
                />
              </TabsContent>
              
              <TabsContent value="subjective" className="mt-0">
                <SubjectiveTab 
                  enhancedData={enhancedData} 
                  sessionId={sessionId}
                  collapsedSections={collapsedSections}
                  toggleSection={toggleSection}
                  entityFilter={entityFilter}
                  setEntityFilter={setEntityFilter}
                />
              </TabsContent>
              
              <TabsContent value="objective" className="mt-0">
                <ObjectiveTab 
                  enhancedData={enhancedData} 
                  sessionId={sessionId}
                  collapsedSections={collapsedSections}
                  toggleSection={toggleSection}
                  entityFilter={entityFilter}
                  setEntityFilter={setEntityFilter}
                />
              </TabsContent>
              
              <TabsContent value="assessment" className="mt-0">
                <AssessmentTab 
                  enhancedData={enhancedData} 
                  sessionId={sessionId}
                  collapsedSections={collapsedSections}
                  toggleSection={toggleSection}
                  entityFilter={entityFilter}
                  setEntityFilter={setEntityFilter}
                />
              </TabsContent>
              
              <TabsContent value="plan" className="mt-0">
                <PlanTab 
                  enhancedData={enhancedData} 
                  sessionId={sessionId}
                  collapsedSections={collapsedSections}
                  toggleSection={toggleSection}
                  entityFilter={entityFilter}
                  setEntityFilter={setEntityFilter}
                />
              </TabsContent>
              
              <TabsContent value="insights" className="mt-0">
                <InsightsTab 
                  enhancedData={enhancedData} 
                  sessionId={sessionId}
                  collapsedSections={collapsedSections}
                  toggleSection={toggleSection}
                  entityFilter={entityFilter}
                  setEntityFilter={setEntityFilter}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </Card>
    </div>
  );
}