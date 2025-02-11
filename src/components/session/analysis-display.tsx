// src/components/session/analysis-display.tsx
import { useEffect, useState } from 'react';
import { ErrorMessage } from '@/components/common/error-message';
import { AnalysisDisplaySkeleton } from '@/components/common/loading-skeletons';
import { RefreshCcw as RefreshIcon } from 'lucide-react';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

interface AnalysisDisplayProps {
  sessionId: string;
}

interface Entity {
  name: string;
  entity_type: string;
  confidence: number;
  attributes: Record<string, string>;
}

interface ClinicalAnalysis {
  entities: Entity[];
  confidence: number;
}

interface SOAPAttribute {
  content: string;
}

interface SOAPComponentData {
  name: { content: string };
  type: { content: string };
  attributes?: Record<string, SOAPAttribute>;
}

interface EnhancedConsultation {
  soap_subjective?: Record<string, any>; // We use 'any' here since structure might be nested.
  soap_objective?: Record<string, any>;
  soap_assessment?: Record<string, any>;
  soap_plan?: Record<string, any>;
}

interface Transcription {
  id: string;
  model: string;
  status: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface RecordingComponent {
  id: string;
  type: string;
  content: any;
  metadata: any;
  confidence: number;
  created_at: string;
  detected_at: string;
}

// Define your SOAP section keys mapping
const SECTION_COMPONENTS: Record<string, string[]> = {
  subjective: [
    'chief_complaint',
    'history_present_illness',
    'past_medical_history',
    'family_history',
    'social_history',
    'review_of_systems'
  ],
  objective: [
    'vital_signs',
    'physical_exam',
    'lab_results'
  ],
  assessment: [
    'differential_diagnosis',
    'clinical_impression'
  ],
  plan: [
    'therapeutic_plan',
    'diagnostic_plan',
    'education_plan'
  ]
};

/**
 * Helper to render a SOAP section.
 * It first checks if the data for a given key is a single component (with a name property)
 * or a mapping of multiple components.
 */
function renderSOAPSection(
  sectionData: Record<string, any> | undefined,
  keys: string[]
) {
  if (!sectionData) {
    return <p className="text-gray-500">No data available.</p>;
  }

  return (
    <div className="space-y-3">
      {keys.map((key) => {
        const comp = sectionData[key];
        if (!comp) return null;

        // If comp has a "name" property, assume it's a single SOAP component.
        if (comp.name && typeof comp.name === 'object' && comp.name.content) {
          return (
            <div key={key} className="border p-3 rounded shadow-sm">
              <h5 className="font-semibold text-base">{comp.name.content}</h5>
              {comp.attributes && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {Object.entries(comp.attributes).map(([attrKey, attrValue]) => {
                    if (!attrValue || typeof attrValue !== 'object') return null;
                    return (
                      <span
                        key={attrKey}
                        className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded"
                      >
                        {attrKey}: {(attrValue as { content: string }).content}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        } else if (typeof comp === 'object') {
          // Otherwise, assume comp is an object mapping IDs to SOAP components.
          return (
            <div key={key} className="space-y-3">
              {Object.entries(comp).map(([id, compDataRaw]) => {
                const compData = compDataRaw as SOAPComponentData;
                if (!compData || !compData.name || !compData.name.content) return null;
                return (
                  <div key={id} className="border p-3 rounded shadow-sm">
                    <h5 className="font-semibold text-base">{compData.name.content}</h5>
                    {compData.attributes && (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {Object.entries(compData.attributes).map(([attrKey, attrValue]) => {
                          if (!attrValue || typeof attrValue !== 'object') return null;
                          return (
                            <span
                              key={attrKey}
                              className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded"
                            >
                              {attrKey}: {(attrValue as { content: string }).content}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

interface CollapsiblePanelProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsiblePanel({ title, defaultOpen = false, children }: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <div
        className="bg-gray-200 px-4 py-2 flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="font-medium text-lg">{title}</span>
        <span className="text-xl">{isOpen ? '−' : '+'}</span>
      </div>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

export default function AnalysisDisplay({ sessionId }: AnalysisDisplayProps) {
  const [error, setError] = useState<string | null>(null);
  const [clinicalData, setClinicalData] = useState<ClinicalAnalysis | null>(null);
  const [enhancedData, setEnhancedData] = useState<EnhancedConsultation | null>(null);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [recordingComponents, setRecordingComponents] = useState<RecordingComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalysisData = async () => {
    try {
      const response = await api.get<ApiResponse<any>>(
        `/api/v1/analysis/sessions/${sessionId}/complete-state`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch data');
      }
      const {
        analysis_results,
        enhanced_consultations,
        transcriptions,
        recording_components
      } = response.data.data;

      setClinicalData(analysis_results?.[0]?.content || null);
      setEnhancedData(enhanced_consultations?.[0] || null);
      setTranscriptions(transcriptions || []);
      setRecordingComponents(recording_components || []);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Error fetching data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [sessionId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalysisData();
  };

  // Group recording components by type for easier display.
  const groupedRecordingComponents = recordingComponents.reduce<Record<string, RecordingComponent[]>>(
    (acc, comp) => {
      (acc[comp.type] = acc[comp.type] || []).push(comp);
      return acc;
    },
    {}
  );

  if (isLoading) return <AnalysisDisplaySkeleton />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 space-y-6 text-gray-800">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Notas del Doctor y Análisis de Sesión</h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshIcon className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* SOAP Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CollapsiblePanel title="Subjetivo" defaultOpen>
          {renderSOAPSection(enhancedData?.soap_subjective, SECTION_COMPONENTS.subjective)}
        </CollapsiblePanel>
        <CollapsiblePanel title="Objetivo" defaultOpen>
          {renderSOAPSection(enhancedData?.soap_objective, SECTION_COMPONENTS.objective)}
        </CollapsiblePanel>
        <CollapsiblePanel title="Evaluación" defaultOpen>
          {renderSOAPSection(enhancedData?.soap_assessment, SECTION_COMPONENTS.assessment)}
        </CollapsiblePanel>
        <CollapsiblePanel title="Plan" defaultOpen>
          {renderSOAPSection(enhancedData?.soap_plan, SECTION_COMPONENTS.plan)}
        </CollapsiblePanel>
      </div>

      {/* Clinical Findings */}
      <CollapsiblePanel title="Hallazgos Clínicos">
        {clinicalData?.entities && clinicalData.entities.length ? (
          <ul className="space-y-3">
            {clinicalData.entities.map((entity, index) => (
              <li key={index} className="border-b pb-2">
                <div className="flex items-center">
                  <span className="font-semibold">{entity.name}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    ({Math.round(entity.confidence * 100)}% de confianza)
                  </span>
                </div>
                {entity.attributes && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {Object.entries(entity.attributes).map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No se detectaron entidades clínicas.</p>
        )}
      </CollapsiblePanel>

      {/* Transcriptions */}
      <CollapsiblePanel title="Transcripciones">
        {transcriptions.length ? (
          <div className="space-y-4">
            {transcriptions.map((tr) => (
              <div key={tr.id} className="border p-4 rounded shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-lg">Transcripción</h4>
                  <span className="text-sm text-gray-600">
                    {new Date(tr.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-gray-700 whitespace-pre-line">{tr.content}</p>
                <div className="mt-2 text-sm text-gray-500">
                  <span className="mr-2">Modelo: {tr.model}</span>
                  <span>Estado: {tr.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay transcripciones disponibles.</p>
        )}
      </CollapsiblePanel>

      {/* Recording Components */}
      <CollapsiblePanel title="Componentes de Grabación">
        {recordingComponents.length ? (
          <div className="space-y-4">
            {Object.entries(groupedRecordingComponents).map(([type, comps]) => (
              <div key={type}>
                <h5 className="font-bold text-md mb-2 capitalize">{type.replace('_', ' ')}</h5>
                <ul className="space-y-2">
                  {comps.map((comp) => (
                    <li key={comp.id} className="border p-3 rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{comp.content?.name?.content || '-'}</span>
                        <span className="text-sm text-gray-600">
                          {Math.round(comp.confidence * 100)}% de confianza
                        </span>
                      </div>
                      {comp.content?.attributes && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {Object.entries(comp.content.attributes).map(([key, val]) => (
                            <span
                              key={key}
                              className="text-sm px-2 py-1 bg-purple-100 text-purple-700 rounded"
                            >
                              {key}: {(val as { content: string }).content}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        Detectado en: {new Date(comp.detected_at).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay componentes de grabación disponibles.</p>
        )}
      </CollapsiblePanel>
    </div>
  );
}