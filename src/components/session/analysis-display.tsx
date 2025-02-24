// src/components/session/analysis-display.tsx

import React, { useEffect, useState } from "react";
import { ErrorMessage } from "@/components/common/error-message";
import { AnalysisDisplaySkeleton } from "@/components/common/loading-skeletons";
import {
  RefreshCcw as RefreshIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import type { ApiResponse } from "@/types";
import EntityGroups from "./entity-groups";
import { highlightEntitiesInText } from "@/utils/highlightEntities";

// Type definitions for SOAP data structure
interface SoapComponentValue {
  name: string;
  value: string;
  unit?: string;
  [key: string]: string | number | undefined;
}

export interface SoapComponent {
  current_symptoms?: SoapComponentValue[];
  diagnoses?: SoapComponentValue[];
  vital_signs?: Record<string, SoapComponentValue>;
  [key: string]: unknown;
}

export interface SoapSection {
  summary?: string;
  components: Record<string, {
    content: SoapComponent;
  }>;
}

export interface EnhancedConsultation {
  soap_subjective?: SoapSection;
  soap_objective?: SoapSection;
  soap_assessment?: SoapSection;
  soap_plan?: SoapSection;
}

export default function EnhancedConsultationDisplay({
  sessionId,
}: {
  sessionId: string;
}) {
  const [enhancedData, setEnhancedData] =
    useState<EnhancedConsultation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    Subjective: false,
    Objective: false,
    Assessment: false,
    Plan: false,
  });

  const fetchEnhancedConsultation = React.useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await api.get<
        ApiResponse<{ enhanced_consultations: EnhancedConsultation[] }>
      >(`/api/v1/analysis/session/${sessionId}/complete-state`);
      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "No se pudieron obtener los datos de la consulta médica"
        );
      }
      const { enhanced_consultations } = response.data.data;
      setEnhancedData(
        enhanced_consultations && enhanced_consultations.length > 0
          ? enhanced_consultations[0]
          : null
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al obtener los datos de la consulta médica";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchEnhancedConsultation();
  }, [fetchEnhancedConsultation]);

  function renderSoapSection(title: string, sectionData?: SoapSection) {
    const spanishTitles: { [key: string]: string } = {
      Subjective: "Evaluación subjetiva",
      Objective: "Evaluación objetiva",
      Assessment: "Evaluación diagnóstica",
      Plan: "Plan de tratamiento",
    };

    // Prepare entities if sectionData exists; otherwise, use an empty array.
    const entities = sectionData && sectionData.components
      ? Object.entries(sectionData.components).flatMap(([, compObj]) => {
          const content = compObj.content;
          if ("current_symptoms" in content) {
            return content.current_symptoms;
          }
          if ("diagnoses" in content) {
            return content.diagnoses;
          }
          if ("vital_signs" in content) {
            const signs = content.vital_signs as Record<string, SoapComponentValue>;
            return Object.entries(signs).map(([key, data]) => ({
              ...data,
              name: key
            }));
          }
          return [];
        })
      : [];

    const safeEntities = entities.filter((entity): entity is SoapComponentValue => entity !== undefined);

    const isCollapsed = collapsedSections[title];
    const toggleCollapse = () => {
      setCollapsedSections((prev) => ({
        ...prev,
        [title]: !prev[title],
      }));
    };

    return (
      <section className="mb-10">
        <div
          className="flex items-center cursor-pointer mb-3 hover:text-blue-600 transition-colors"
          onClick={toggleCollapse}
        >
          {isCollapsed ? (
            <ChevronRight className="h-6 w-6 mr-2" />
          ) : (
            <ChevronDown className="h-6 w-6 mr-2" />
          )}
          <h2 className="text-2xl font-bold">{spanishTitles[title] || title}</h2>
        </div>

        {/* Summary area */}
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm leading-relaxed">
            {sectionData &&
            sectionData.summary &&
            sectionData.summary.trim() !== ""
              ? highlightEntitiesInText(sectionData.summary, safeEntities)
              : (
                <span className="text-gray-500 italic">
                  No hay datos disponibles para esta sección.
                </span>
              )}
          </p>
        </div>

        {/* Expanded area */}
        {!isCollapsed && sectionData && (
          <>
            {sectionData.components && Object.keys(sectionData.components).length > 0 ? (
              <div className="mt-4">
                <EntityGroups sectionData={sectionData} showTitle={true} />
              </div>
            ) : (
              <div className="mt-4 p-3 text-gray-500 italic border-t border-gray-200">
                No hay datos adicionales para mostrar.
              </div>
            )}
          </>
        )}
      </section>
    );
  }

  if (isLoading) return <AnalysisDisplaySkeleton />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {isRefreshing ? (
        <AnalysisDisplaySkeleton />
      ) : !enhancedData ? (
        <div className="text-center py-12 px-4">
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12">
            <RefreshIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No hay datos de consulta médica
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Los datos de la consulta se generarán automáticamente cuando haya grabaciones procesadas.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow rounded-lg p-6">
            {renderSoapSection("Subjective", enhancedData.soap_subjective)}
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            {renderSoapSection("Objective", enhancedData.soap_objective)}
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            {renderSoapSection("Assessment", enhancedData.soap_assessment)}
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            {renderSoapSection("Plan", enhancedData.soap_plan)}
          </div>
        </>
      )}
    </div>
  );
}