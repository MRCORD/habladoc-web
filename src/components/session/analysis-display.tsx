// src/components/session/analysis-display.tsx
import React, { useEffect, useState } from 'react';
import { ErrorMessage } from '@/components/common/error-message';
import { AnalysisDisplaySkeleton } from '@/components/common/loading-skeletons';
import { 
  RefreshCcw as RefreshIcon,
  Clock as DurationIcon,
  RepeatIcon as FrequencyIcon,
  ActivityIcon as IntensityIcon,
  MapPinIcon as LocationIcon,
  TimerIcon as OnsetIcon,
  TrendingUpIcon as ProgressionIcon,
  ZapIcon as QualityIcon,
  InfoIcon as ContextIcon,
  RulerIcon as ValueIcon,
  HashIcon as UnitIcon,
  CircleDotIcon as StatusIcon,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

// Helper function to highlight entities in text
const highlightEntitiesInText = (text: string, entities: any[] = []) => {
  if (!text || !entities.length) return text;

  // Extract all entity names from the components
  let allEntityNames = entities
    .map(e => e.name?.toLowerCase())
    .filter(Boolean);

  // Create a regular expression to match whole words
  const entityRegex = new RegExp(`\\b(${allEntityNames.join('|')})\\b`, 'gi');

  return text.split(entityRegex).map((part, i) => {
    if (allEntityNames.includes(part.toLowerCase())) {
      return (
        <span 
          key={i} 
          className="font-semibold bg-yellow-100 px-1 rounded" 
          title="Entidad clínica identificada"
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

// ===== TYPE DEFINITIONS FOR SOAP COMPONENTS =====

// Common entity attributes interface
export interface EntityAttributes {
  frequency?: string;
  intensity?: string;
  duration?: string;
  location?: string;
  onset?: string;
  progression?: string;
  quality?: string;
  context?: string;
  value?: string;
  unit?: string;
  status?: string;
}

// "Subjective" usually comes from "history_present_illness"
export interface HistoryPresentIllnessComponent {
  current_symptoms: Array<{
    name: string;
    confidence: number;
  } & EntityAttributes>;
  medication_effects: Array<{
    effect: string;
    symptoms: string[];
    confidence: number;
    medication: string;
  }>;
}

// "Objective" often includes "vital_signs"
export interface VitalSignsComponent {
  vital_signs: {
    [key: string]: {
      confidence: number;
      name?: string;
    } & Pick<EntityAttributes, 'value' | 'unit'>;
  };
}

// "Assessment" usually contains a "clinical_impression"
export interface ClinicalImpressionComponent {
  diagnoses: Array<{
    name: string;
    confidence: number;
  } & Pick<EntityAttributes, 'onset' | 'status' | 'progression' | 'duration' | 'context'>>;
}

export type SoapComponent = HistoryPresentIllnessComponent | VitalSignsComponent | ClinicalImpressionComponent | Record<string, any>;

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

// ===== SUB-COMPONENTS TO RENDER EACH TYPE =====

interface AttributeTagProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
}

function toSentenceCase(str: string): string {
  if (!str) return '';
  
  if (str.includes('-')) {
    return str.split('-')
      .map(toSentenceCase)
      .join('-');
  }
  
  if (str.includes(' ')) {
    return str.split(' ')
      .map(toSentenceCase)
      .join(' ');
  }

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function AttributeTag({ icon: Icon, label, value }: AttributeTagProps) {
  const spanishLabels: { [key: string]: string } = {
    'Quality': 'Cualidad',
    'Location': 'Localización',
    'Intensity': 'Intensidad',
    'Context': 'Contexto',
    'Duration': 'Duración',
    'Frequency': 'Frecuencia',
    'Measurement': 'Medición',
    'Progression': 'Progresión',
    'Status': 'Estado',
    'Onset': 'Inicio',
    'Value': 'Valor'
  };

  return (
    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs mr-2 mb-1" title={label}>
      <Icon className="h-3 w-3" />
      <span className="font-medium">{spanishLabels[label] || label}: {toSentenceCase(value)}</span>
    </span>
  );
}

interface HistoryPresentIllnessDisplayProps {
  data: HistoryPresentIllnessComponent;
}

function HistoryPresentIllnessDisplay({ data }: HistoryPresentIllnessDisplayProps) {
  return (
    <div>
      {data.current_symptoms && data.current_symptoms.length > 0 && (
        <div className="mb-4">
          <h5 className="font-semibold text-base mb-1">Síntomas actuales</h5>
          <ul className="space-y-3 text-sm">
            {data.current_symptoms.map((symptom, idx) => (
              <li key={idx} className="border-b pb-2">
                <div className="font-medium mb-1 bg-yellow-100 inline-block px-2 py-0.5 rounded">
                  {toSentenceCase(symptom.name)}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {symptom.quality && (
                    <AttributeTag icon={QualityIcon} label="Quality" value={symptom.quality} />
                  )}
                  {symptom.location && (
                    <AttributeTag icon={LocationIcon} label="Location" value={symptom.location} />
                  )}
                  {symptom.intensity && (
                    <AttributeTag icon={IntensityIcon} label="Intensity" value={symptom.intensity} />
                  )}
                  {symptom.context && (
                    <AttributeTag icon={ContextIcon} label="Context" value={symptom.context} />
                  )}
                  {symptom.duration && (
                    <AttributeTag icon={DurationIcon} label="Duration" value={symptom.duration} />
                  )}
                  {symptom.frequency && (
                    <AttributeTag icon={FrequencyIcon} label="Frequency" value={symptom.frequency} />
                  )}
                  {symptom.value && symptom.unit && (
                    <AttributeTag 
                      icon={ValueIcon} 
                      label="Measurement" 
                      value={`${symptom.value} ${symptom.unit}`} 
                    />
                  )}
                  {symptom.progression && (
                    <AttributeTag icon={ProgressionIcon} label="Progression" value={symptom.progression} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.medication_effects && data.medication_effects.length > 0 && (
        <div>
          <h5 className="font-semibold text-base mb-1">Efectos de medicamentos</h5>
          <ul className="space-y-1 text-sm">
            {data.medication_effects.map((effect, idx) => (
              <li key={idx}>
                <span className="font-medium">{toSentenceCase(effect.effect)}</span> sobre{' '}
                <span className="bg-yellow-100 px-1 rounded">
                  {effect.symptoms.map(toSentenceCase).join(', ')}
                </span>
                {' '}(Medicamento: <span className="font-medium">{toSentenceCase(effect.medication)}</span>)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface VitalSignsDisplayProps {
  data: VitalSignsComponent;
}

function VitalSignsDisplay({ data }: VitalSignsDisplayProps) {
  return (
    <div className="text-sm">
      <div className="flex flex-wrap gap-2">
        {Object.entries(data.vital_signs).map(([key, sign]) => {
          const displayName = sign.name || key;
          
          return (
            <div key={key} className="border rounded-lg p-2">
              <div className="font-medium mb-1 bg-yellow-100 inline-block px-2 py-0.5 rounded">
                {toSentenceCase(displayName)}
              </div>
              <AttributeTag 
                icon={ValueIcon} 
                label="Value" 
                value={`${sign.value} ${sign.unit}`} 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ClinicalImpressionDisplayProps {
  data: ClinicalImpressionComponent;
}

function ClinicalImpressionDisplay({ data }: ClinicalImpressionDisplayProps) {
  return (
    <div className="text-sm">
      <h5 className="font-semibold text-base mb-1">Diagnósticos médicos</h5>
      <ul className="space-y-3">
        {data.diagnoses.map((d, idx) => (
          <li key={idx} className="border-b pb-2">
            <div className="font-medium mb-1 bg-yellow-100 inline-block px-2 py-0.5 rounded">
              {toSentenceCase(d.name)}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {d.status && (
                <AttributeTag icon={StatusIcon} label="Status" value={d.status} />
              )}
              {d.onset && (
                <AttributeTag icon={OnsetIcon} label="Onset" value={d.onset} />
              )}
              {d.duration && (
                <AttributeTag icon={DurationIcon} label="Duration" value={d.duration} />
              )}
              {d.context && (
                <AttributeTag icon={ContextIcon} label="Context" value={d.context} />
              )}
              {d.progression && (
                <AttributeTag icon={ProgressionIcon} label="Progression" value={d.progression} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface GenericComponentDisplayProps {
  data: SoapComponent;
}

function GenericComponentDisplay({ data }: GenericComponentDisplayProps) {
  return (
    <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function renderSoapComponent(compKey: string, content: SoapComponent) {
  switch (compKey) {
    case 'history_present_illness':
      return <HistoryPresentIllnessDisplay data={content as HistoryPresentIllnessComponent} />;
    case 'vital_signs':
      return <VitalSignsDisplay data={content as VitalSignsComponent} />;
    case 'clinical_impression':
      return <ClinicalImpressionDisplay data={content as ClinicalImpressionComponent} />;
    default:
      return <GenericComponentDisplay data={content} />;
  }
}

// Move renderSoapSection inside the main component to access state
export default function EnhancedConsultationDisplay({ sessionId }: { sessionId: string }) {
  const [enhancedData, setEnhancedData] = useState<EnhancedConsultation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    Subjective: false,
    Objective: false,
    Assessment: false,
    Plan: false,
    'Subjective-entities': false,
    'Objective-entities': false,
    'Assessment-entities': false,
    'Plan-entities': false
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
    const isEntitiesCollapsed = collapsedSections[`${title}-entities`];
    
    const toggleCollapse = () => {
      setCollapsedSections((prev: Record<string, boolean>) => ({
        ...prev,
        [title]: !prev[title]
      }));
    };

    const toggleEntitiesCollapse = () => {
      setCollapsedSections((prev: Record<string, boolean>) => ({
        ...prev,
        [`${title}-entities`]: !prev[`${title}-entities`]
      }));
    };

    // Extract all entities from the components
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
          <>
            <div 
              className="flex items-center cursor-pointer mb-3" 
              onClick={toggleEntitiesCollapse}
            >
              {isEntitiesCollapsed ? 
                <ChevronRight className="h-5 w-5 mr-2" /> : 
                <ChevronDown className="h-5 w-5 mr-2" />
              }
              <h3 className="text-xl font-semibold">Entidades identificadas</h3>
            </div>

            {!isEntitiesCollapsed && (
              <div className="space-y-4">
                {Object.entries(sectionData.components).map(([compKey, compObj]) => (
                  <div key={compKey} className="border rounded p-4">
                    <h3 className="text-lg font-semibold capitalize mb-2">
                      {compKey.replace(/_/g, ' ')}
                    </h3>
                    {renderSoapComponent(compKey, compObj.content)}
                  </div>
                ))}
              </div>
            )}
          </>
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
      {/* Render SOAP sections in order */}
      {renderSoapSection('Subjective', enhancedData.soap_subjective)}
      {renderSoapSection('Objective', enhancedData.soap_objective)}
      {renderSoapSection('Assessment', enhancedData.soap_assessment)}
      {renderSoapSection('Plan', enhancedData.soap_plan)}
    </div>
  );
}