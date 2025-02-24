import React, { useEffect, useState } from 'react';
import { ErrorMessage } from '@/components/common/error-message';
import { AnalysisDisplaySkeleton } from '@/components/common/loading-skeletons';
import { 
  RefreshCcw as RefreshIcon,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';
import EntityGroups from './entity-groups';
import { toSentenceCase, highlightEntitiesInText } from '@/utils/highlightEntities';

// Type definitions for SOAP data structure
export interface SoapComponent {
  [key: string]: any;
}

export interface SoapSection {
  summary?: string;
  components?: {
    [key: string]: {
      content: SoapComponent;
    };
  };
}

export interface EnhancedConsultation {
  soap_subjective?: SoapSection;
  soap_objective?: SoapSection;
  soap_assessment?: SoapSection;
  soap_plan?: SoapSection;
}

export default function EnhancedConsultationDisplay({ sessionId }: { sessionId: string }) {
  const [enhancedData, setEnhancedData] = useState<EnhancedConsultation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    Subjective: false,
    Objective: false,
    Assessment: false,
    Plan: false
  });

  async function fetchEnhancedConsultation() {
    try {
      setError(null);
      setIsLoading(true);
      const response = await api.get<ApiResponse<{ enhanced_consultations: EnhancedConsultation[] }>>(
        `/api/v1/analysis/session/${sessionId}/complete-state`
      );
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'No se pudieron obtener los datos de la consulta médica');
      }
      const { enhanced_consultations } = response.data.data;
      setEnhancedData(enhanced_consultations && enhanced_consultations.length > 0 ? enhanced_consultations[0] : null);
    } catch (err: any) {
      setError(err.message || 'Error al obtener los datos de la consulta médica');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    fetchEnhancedConsultation();
  }, [sessionId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEnhancedConsultation();
  };

  function renderSoapSection(title: string, sectionData?: SoapSection) {
    const spanishTitles: { [key: string]: string } = {
      'Subjective': 'Evaluación subjetiva',
      'Objective': 'Evaluación objetiva',
      'Assessment': 'Evaluación diagnóstica',
      'Plan': 'Plan de tratamiento'
    };

    if (!sectionData) return null;

    const isCollapsed = collapsedSections[title];
    
    const toggleCollapse = () => {
      setCollapsedSections((prev: Record<string, boolean>) => ({
        ...prev,
        [title]: !prev[title]
      }));
    };

    // Extract all entities for text highlighting
    const entities = Object.entries(sectionData.components || {}).flatMap(([_, compObj]) => {
      const content = compObj.content;
      if ('current_symptoms' in content) {
        return content.current_symptoms;
      }
      if ('diagnoses' in content) {
        return content.diagnoses;
      }
      if ('vital_signs' in content) {
        const signs = content.vital_signs as Record<string, any>;
        return Object.entries(signs).map(([name, data]) => ({
          name,
          ...(data as object)
        }));
      }
      return [];
    });

    return (
      <section className="mb-10">
        <div 
          className="flex items-center cursor-pointer mb-3" 
          onClick={toggleCollapse}
        >
          {isCollapsed ? 
            <ChevronRight className="h-6 w-6 mr-2" /> : 
            <ChevronDown className="h-6 w-6 mr-2" />
          }
          <h2 className="text-2xl font-bold">{spanishTitles[title] || title}</h2>
        </div>

        {sectionData.summary && (
          <div className="bg-gray-50 p-4 rounded mb-4">
            <div className="prose max-w-none">
              <p className="text-sm leading-relaxed">
                {highlightEntitiesInText(sectionData.summary, entities)}
              </p>
            </div>
          </div>
        )}

        {!isCollapsed && sectionData.components && (
          <EntityGroups sectionData={sectionData} showTitle={true} />
        )}
      </section>
    );
  }

  if (isLoading) return <AnalysisDisplaySkeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (!enhancedData)
    return <p className="text-gray-500">No hay datos de consulta médica disponibles.</p>;

  return (
    <div className="bg-white shadow rounded-lg p-6 text-gray-800">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Consulta médica mejorada</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshIcon className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>
      {renderSoapSection('Subjective', enhancedData.soap_subjective)}
      {renderSoapSection('Objective', enhancedData.soap_objective)}
      {renderSoapSection('Assessment', enhancedData.soap_assessment)}
      {renderSoapSection('Plan', enhancedData.soap_plan)}
    </div>
  );
}