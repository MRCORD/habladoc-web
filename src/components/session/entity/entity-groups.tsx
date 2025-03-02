// src/components/session/entity/entity-groups.tsx
import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Activity,
  Pill,
  Heart,
  Thermometer,
  Filter,
  FileText,
  Beaker,
  ArrowDown,
  ArrowUpDown,
  SlidersHorizontal
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EntityGrid, { Entity } from './entity-grid'; // Use the existing entity-grid

interface VitalSign {
  value: string;
  unit?: string;
  confidence?: number;
}

interface MedicationEffect {
  medication: string;
  effect: string;
  symptoms: string[];
  confidence?: number;
}

interface DiagnosticPlan {
  tests: TestItem[]; // Changed from optional to required
  rationale?: string;
  priority?: string;
}

interface TherapeuticPlan {
  medications: MedicationItem[]; // Changed from optional to required
  procedures?: string[];
  lifestyle_changes?: string[];
  followup?: string;
}

interface EducationPlan {
  recommendations: RecommendationItem[]; // Changed from optional to required
  materials?: string[];
  topics?: string[];
}

interface Finding {
  description?: string;
  value?: string | number;
  status?: string;
  metadata?: Record<string, unknown>;
}

interface SectionComponent {
  content: {
    current_symptoms?: Entity[];
    medication_effects?: MedicationEffect[];
    vital_signs?: Record<string, VitalSign>;
    diagnoses?: Entity[];
    differential_diagnoses?: Entity[];
    diagnostic_plan?: DiagnosticPlan;
    therapeutic_plan?: TherapeuticPlan;
    education_plan?: EducationPlan;
    findings?: Record<string, Finding>;
    system_findings?: Record<string, { findings: Entity[] }>;
    lab_results?: Entity[];
    medications?: MedicationItem[]; // Added this field
    tests?: TestItem[]; // Added this field
    recommendations?: RecommendationItem[]; // Added this field
    [key: string]: unknown;
  };
  confidence?: number;
}

export type SOAPSectionType = 'subjective' | 'objective' | 'assessment' | 'plan';

// Modified SectionData to accept undefined components
interface SectionData {
  components?: Record<string, SectionComponent>;
  summary?: string;
  metadata?: Record<string, unknown>;
  confidence?: number;
}

interface FilterOptions {
  showActiveOnly: boolean;
  sortBy: string;
}

interface EntityGroupsProps {
  sectionData?: SectionData;
  soapSection?: SOAPSectionType;
  showTitle?: boolean;
  className?: string;
  filter?: FilterOptions;
  setFilter?: (filter: FilterOptions) => void;
}

// Entity Group Item interface
interface EntityGroupItem {
  title: string;
  entities: Entity[];
  type: string;
  iconName?: string;
}

// Type for medications, tests, and recommendations
interface MedicationItem {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  route?: string;
  instructions?: string;
  contraindications?: string[];
  sideEffects?: string[];
  [key: string]: string | string[] | undefined;
}

interface TestItem {
  name: string;
  reason?: string;
  urgency?: string;
  location?: string;
  instructions?: string;
  preparation?: string;
  [key: string]: string | undefined;
}

interface RecommendationItem {
  text: string;
  type?: string;
  importance?: string;
  category?: string;
  followup?: string;
  [key: string]: string | undefined;
}

// Mapping of component types to SOAP sections
const SOAP_COMPONENT_MAPPING: Record<string, SOAPSectionType> = {
  chief_complaint: 'subjective',
  history_present_illness: 'subjective',
  past_medical_history: 'subjective',
  family_history: 'subjective',
  social_history: 'subjective',
  review_of_systems: 'subjective',
  
  vital_signs: 'objective',
  physical_exam: 'objective',
  lab_results: 'objective',
  
  differential_diagnosis: 'assessment',
  clinical_impression: 'assessment',
  
  diagnostic_plan: 'plan',
  therapeutic_plan: 'plan',
  education_plan: 'plan'
};

// User-friendly section titles
const SECTION_TITLES: Record<string, string> = {
  subjective: 'Información Subjetiva',
  objective: 'Datos Objetivos',
  assessment: 'Evaluación Diagnóstica',
  plan: 'Plan de Tratamiento'
};

const EntityGroups: React.FC<EntityGroupsProps> = ({ 
  sectionData, 
  soapSection,
  showTitle = true,
  className = "",
  filter = {
    showActiveOnly: false,
    sortBy: 'confidence'
  },
  setFilter
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
  // Ensure sectionData and components exist
  if (!sectionData?.components) return null;

  // Filter components by SOAP section if specified
  const filteredComponents = soapSection 
    ? Object.entries(sectionData.components).filter(([componentType]) => 
        SOAP_COMPONENT_MAPPING[componentType] === soapSection
      )
    : Object.entries(sectionData.components);

  // If we're filtering and there are no components in this section, return null
  if (soapSection && filteredComponents.length === 0) return null;

  // Get a user-friendly title for the section
  const getSectionTitle = () => {
    if (!soapSection) return 'Entidades Identificadas';
    return SECTION_TITLES[soapSection] || `Sección ${soapSection}`;
  };

  // Extract and organize entities by type
  const entityGroups: EntityGroupItem[] = filteredComponents.reduce((groups: EntityGroupItem[], [componentType, component]) => {
    const content = component.content;
    
    // ----- SUBJECTIVE section entities -----
    if ((!soapSection || soapSection === 'subjective') && 
        (componentType === 'history_present_illness' || componentType === 'chief_complaint') && 
        content.current_symptoms && 
        content.current_symptoms.length > 0) {
      
      groups.push({
        title: 'Síntomas',
        entities: content.current_symptoms.map((symptom) => ({
          ...symptom,
          name: symptom.name,
          type: 'symptom'
        })),
        type: 'symptoms',
        iconName: 'activity'
      });
    }
    
    if ((!soapSection || soapSection === 'subjective') && 
        componentType === 'history_present_illness' && 
        content.medication_effects && 
        content.medication_effects.length > 0) {
      
      groups.push({
        title: 'Efectos de Medicamentos',
        entities: content.medication_effects.map((effect) => ({
          name: effect.medication,
          effect: effect.effect,
          context: effect.symptoms.join(', '),
          confidence: effect.confidence,
          type: 'medication'
        })),
        type: 'medications',
        iconName: 'pill'
      });
    }

    // Extract system findings for review of systems (subjective)
    if ((!soapSection || soapSection === 'subjective') && 
        componentType === 'review_of_systems' && 
        content.system_findings) {
      
      const systemEntities: Entity[] = [];
      
      Object.entries(content.system_findings).forEach(([system, data]) => {
        if (data.findings && data.findings.length > 0) {
          data.findings.forEach(finding => {
            systemEntities.push({
              ...finding,
              system: system,
              type: 'finding'
            });
          });
        }
      });
      
      if (systemEntities.length > 0) {
        groups.push({
          title: 'Hallazgos por Sistema',
          entities: systemEntities,
          type: 'system_findings',
          iconName: 'activity'
        });
      }
    }
    
    // ----- OBJECTIVE section entities -----
    if ((!soapSection || soapSection === 'objective') && 
        componentType === 'vital_signs' && 
        content.vital_signs) {
      
      const vitalEntities = Object.entries(content.vital_signs)
        .filter(([, data]) => data.value) // Only include vitals with values
        .map(([name, data]) => ({
          name,
          value: data.value,
          unit: data.unit || '',
          confidence: data.confidence,
          type: 'vital_sign'
        }));
      
      if (vitalEntities.length > 0) {
        groups.push({
          title: 'Signos Vitales',
          entities: vitalEntities,
          type: 'vitals',
          iconName: 'thermometer'
        });
      }
    }

    // Physical exam findings (objective)
    if ((!soapSection || soapSection === 'objective') && 
        componentType === 'physical_exam' && 
        content.findings) {
      
      const examFindings: Entity[] = [];
      
      Object.entries(content.findings).forEach(([area, finding]) => {
        if (typeof finding === 'string') {
          examFindings.push({
            name: finding,
            location: area,
            type: 'physical_finding'
          });
        } else if (finding && typeof finding === 'object') {
          examFindings.push({
            name: finding.description || area,
            status: finding.status,
            value: finding.value?.toString(), // Convert number to string if needed
            location: area,
            type: 'physical_finding'
          });
        }
      });
      
      if (examFindings.length > 0) {
        groups.push({
          title: 'Hallazgos del Examen Físico',
          entities: examFindings,
          type: 'physical_findings',
          iconName: 'activity'
        });
      }
    }

    // Lab results (objective)
    if ((!soapSection || soapSection === 'objective') && 
        componentType === 'lab_results' && 
        content.lab_results && 
        content.lab_results.length > 0) {
      
      groups.push({
        title: 'Resultados de Laboratorio',
        entities: content.lab_results.map(result => ({
          ...result,
          type: 'lab_result'
        })),
        type: 'lab_results',
        iconName: 'beaker'
      });
    }
    
    // ----- ASSESSMENT section entities -----
    if ((!soapSection || soapSection === 'assessment') && 
        componentType === 'clinical_impression' && 
        content.diagnoses && 
        content.diagnoses.length > 0) {
      
      groups.push({
        title: 'Diagnósticos',
        entities: content.diagnoses.map((diagnosis) => ({
          ...diagnosis,
          name: diagnosis.name,
          type: 'condition'
        })),
        type: 'diagnoses',
        iconName: 'heart'
      });
    }

    // Differential diagnoses specifically
    if ((!soapSection || soapSection === 'assessment') && 
        componentType === 'differential_diagnosis' && 
        content.differential_diagnoses && 
        content.differential_diagnoses.length > 0) {
      
      groups.push({
        title: 'Diagnósticos Diferenciales',
        entities: content.differential_diagnoses.map((diagnosis) => ({
          ...diagnosis,
          name: diagnosis.name,
          type: 'differential'
        })),
        type: 'differential_diagnoses',
        iconName: 'heart'
      });
    }
    
    // ----- PLAN section entities -----
    if ((!soapSection || soapSection === 'plan') && 
        componentType === 'therapeutic_plan' && 
        content.medications && 
        content.medications.length > 0) {
      
      groups.push({
        title: 'Medicamentos Recetados',
        entities: content.medications.map((med: MedicationItem) => ({
          ...med,
          type: 'medication'
        })),
        type: 'planned_medications',
        iconName: 'pill'
      });
    }

    if ((!soapSection || soapSection === 'plan') && 
        componentType === 'diagnostic_plan' && 
        content.tests && 
        content.tests.length > 0) {
      
      groups.push({
        title: 'Pruebas Diagnósticas',
        entities: content.tests.map((test: TestItem) => ({
          ...test,
          type: 'test'
        })),
        type: 'planned_tests',
        iconName: 'beaker'
      });
    }

    if ((!soapSection || soapSection === 'plan') && 
        componentType === 'education_plan' && 
        content.recommendations && 
        content.recommendations.length > 0) {
      
      groups.push({
        title: 'Recomendaciones',
        entities: content.recommendations.map((rec: RecommendationItem) => ({
          ...rec,
          name: rec.text, // Use the text as the name property
          type: 'recommendation'
        })),
        type: 'recommendations',
        iconName: 'file-text'
      });
    }
    
    return groups;
  }, []);

  // Filter entities based on the active filter
  const filterEntities = (entities: Entity[]) => {
    let filteredEntities = [...entities];
    
    // Apply active-only filter if enabled
    if (filter.showActiveOnly) {
      filteredEntities = filteredEntities.filter(e => e.status === 'active');
    }
    
    // Apply sorting based on selected filter
    switch (filter.sortBy) {
      case 'severity':
        return filteredEntities.sort((a, b) => {
          const severityOrder = {
            'severe': 3,
            'high': 3,
            'moderate': 2,
            'medium': 2,
            'mild': 1,
            'low': 1,
            '': 0
          };
          const aIntensity = a.intensity?.toLowerCase() || '';
          const bIntensity = b.intensity?.toLowerCase() || '';
          
          const aValue = Object.entries(severityOrder).find(([key]) => aIntensity.includes(key))?.[1] || 0;
          const bValue = Object.entries(severityOrder).find(([key]) => bIntensity.includes(key))?.[1] || 0;
          
          return bValue - aValue;
        });
      case 'recent':
        return filteredEntities.sort((a, b) => {
          const aOnset = (a.onset as string) || '';
          const bOnset = (b.onset as string) || '';
          return bOnset.localeCompare(aOnset);
        });
      case 'alphabetical':
        return filteredEntities.sort((a, b) => a.name.localeCompare(b.name));
      case 'confidence':
      default:
        return filteredEntities.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    }
  };

  // Get the total count for displaying
  const getTotalCount = () => {
    return entityGroups.reduce((total, group) => total + group.entities.length, 0);
  };

  if (entityGroups.length === 0) return null;

  // Get group icon
  const getGroupIcon = (iconName?: string) => {
    switch (iconName) {
      case 'activity': return <Activity className="h-5 w-5 text-primary-500" />;
      case 'pill': return <Pill className="h-5 w-5 text-warning-500" />;
      case 'heart': return <Heart className="h-5 w-5 text-success-500" />;
      case 'thermometer': return <Thermometer className="h-5 w-5 text-info-500" />;
      case 'file-text': return <FileText className="h-5 w-5 text-amber-500" />;
      case 'beaker': return <Beaker className="h-5 w-5 text-violet-500" />;
      default: return <Filter className="h-5 w-5 text-neutral-500" />;
    }
  };

  return (
    <Card className={`${className}`}>
      {/* Main header with filter controls */}
      {showTitle && (
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{getSectionTitle()}</CardTitle>
            <Badge variant="default">
              {getTotalCount()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Filter dropdown button */}
            {setFilter && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilterOptions(!showFilterOptions)}
                aria-label="Mostrar opciones de filtro"
                className={`h-8 w-8 ${showFilterOptions ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : ''}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            )}
            
            {/* Expand/collapse button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Colapsar" : "Expandir"}
              className="h-8 w-8"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
      )}
      
      {/* Filter dropdown */}
      {showFilterOptions && setFilter && (
        <CardContent className="py-2 px-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center flex-wrap gap-3">
            {/* Show active only toggle */}
            <Button
              variant={filter.showActiveOnly ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilter({ ...filter, showActiveOnly: !filter.showActiveOnly })}
            >
              Solo activos {filter.showActiveOnly ? '✓' : ''}
            </Button>
            
            {/* Sort options */}
            <div className="flex items-center">
              <label className="text-sm mr-2 text-neutral-700 dark:text-neutral-300">Ordenar:</label>
              <select
                value={filter.sortBy}
                onChange={(e) => setFilter({ ...filter, sortBy: e.target.value })}
                className="text-sm rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-1"
              >
                <option value="confidence">Por confianza</option>
                <option value="severity">Por intensidad</option>
                <option value="alphabetical">Alfabético</option>
                <option value="recent">Más recientes</option>
              </select>
            </div>
          </div>
        </CardContent>
      )}
      
      {expanded && (
        <CardContent className="space-y-6 p-4">
          {entityGroups.map((group, idx) => (
            <div key={`${group.type}-${idx}`} className="space-y-3">
              {/* Group header - only show if there's more than one group */}
              {entityGroups.length > 1 && (
                <div className="flex items-center gap-2">
                  {getGroupIcon(group.iconName)}
                  <h4 className="text-md font-medium text-neutral-900 dark:text-neutral-100">
                    {group.title}
                  </h4>
                  <Badge variant="default">
                    {group.entities.length}
                  </Badge>
                </div>
              )}
              
              {/* Entity grid with filtered entities */}
              <EntityGrid
                title={group.title}
                entities={filterEntities(group.entities)}
                count={group.entities.length}
                hideHeader={entityGroups.length > 1} // Hide header if we're showing group headers
                condensed={group.entities.length > 8} // Use condensed view for large groups
              />
            </div>
          ))}
        </CardContent>
      )}
      
      {/* Empty state */}
      {entityGroups.length === 0 && expanded && (
        <CardContent className="p-6">
          <div className="text-center py-6">
            <div className="rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-6">
              <p className="text-neutral-500 dark:text-neutral-400">
                No se han identificado entidades clínicas en esta sección.
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default EntityGroups;