import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Activity, Heart, Thermometer, Droplet } from 'lucide-react';
import EntityGrid, { Entity, EntityType } from './entity-grid';

interface EntityAttributes {
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
  supporting_evidence?: string[];
  [key: string]: string | string[] | number | undefined;
}

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

interface SectionComponent {
  content: {
    current_symptoms?: Entity[];
    medication_effects?: MedicationEffect[];
    vital_signs?: Record<string, VitalSign>;
    diagnoses?: Entity[];
  };
}

interface SectionData {
  components: Record<string, SectionComponent>;
}

interface EntityGroupsProps {
  sectionData?: SectionData;
  showTitle?: boolean;
  className?: string;
}

// Define interface for the EntityGroup
interface EntityGroupItem {
  title: string;
  entities: Entity[];
  type: string;
}

// Mapped categories to create consistent icons and styles
const categoryIcons = {
  symptoms: Activity,
  vitals: Thermometer,
  diagnoses: Heart,
  medications: Droplet
};

const EntityGroups: React.FC<EntityGroupsProps> = ({ 
  sectionData, 
  showTitle = true,
  className = "" 
}) => {
  const [expanded, setExpanded] = useState(true);
  
  if (!sectionData?.components) return null;

  // Extract and organize entities by type
  const entityGroups: EntityGroupItem[] = Object.entries(sectionData.components).reduce((groups: EntityGroupItem[], [, value]) => {
    const content = value.content;
    
    if ('current_symptoms' in content && content.current_symptoms && content.current_symptoms.length > 0) {
      groups.push({
        title: 'Síntomas',
        entities: content.current_symptoms.map((symptom) => ({
          ...symptom,
          name: symptom.name,
          type: 'symptom'
        })),
        type: 'symptoms'
      });
    }
    
    if ('medication_effects' in content && content.medication_effects && content.medication_effects.length > 0) {
      groups.push({
        title: 'Efectos de Medicamentos',
        entities: content.medication_effects.map((effect) => ({
          name: effect.medication,
          effect: effect.effect,
          context: effect.symptoms.join(', '),
          confidence: effect.confidence,
          type: 'medication'
        })),
        type: 'medications'
      });
    }
    
    if ('vital_signs' in content && content.vital_signs) {
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
          type: 'vitals'
        });
      }
    }
    
    if ('diagnoses' in content && content.diagnoses && content.diagnoses.length > 0) {
      groups.push({
        title: 'Diagnósticos',
        entities: content.diagnoses.map((diagnosis) => ({
          ...diagnosis,
          name: diagnosis.name,
          type: 'condition'
        })),
        type: 'diagnoses'
      });
    }
    
    return groups;
  }, []);

  if (entityGroups.length === 0) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Entidades Identificadas
          </h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            aria-label={expanded ? "Colapsar" : "Expandir"}
          >
            {expanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            )}
          </button>
        </div>
      )}
      
      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entityGroups.map((group, idx) => (
            <EntityGrid
              key={`${group.type}-${idx}`}
              title={group.title}
              entities={group.entities}
            />
          ))}
        </div>
      )}
      
      {/* Empty state */}
      {entityGroups.length === 0 && expanded && (
        <div className="text-center py-8 px-4">
          <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6">
            <p className="text-gray-500 dark:text-gray-400">
              No se han identificado entidades clínicas en los datos disponibles.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityGroups;