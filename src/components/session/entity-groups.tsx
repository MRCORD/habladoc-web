import React from 'react';
import EntityGrid from './entity-grid';

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
  [key: string]: string | number | undefined;
}

interface Entity extends EntityAttributes {
  name: string;
  confidence?: number;
}

interface EntityGroup {
  title: string;
  entities: Entity[];
  type: string;
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
}

const EntityGroups = ({ sectionData, showTitle = true }: EntityGroupsProps) => {
  if (!sectionData?.components) return null;

  // Extract and organize entities by type
  const entityGroups = Object.entries(sectionData.components).reduce((groups: EntityGroup[], [, value]) => {
    const content = value.content;
    
    if ('current_symptoms' in content && content.current_symptoms) {
      groups.push({
        title: 'Síntomas',
        entities: content.current_symptoms.map((symptom) => ({
          ...symptom,
          name: symptom.name
        })),
        type: 'symptoms'
      });
    }
    
    if ('medication_effects' in content && content.medication_effects) {
      groups.push({
        title: 'Efectos de Medicamentos',
        entities: content.medication_effects.map((effect) => ({
          name: effect.medication,
          effect: effect.effect,
          context: effect.symptoms.join(', '),
          confidence: effect.confidence
        })),
        type: 'medications'
      });
    }
    
    if ('vital_signs' in content && content.vital_signs) {
      groups.push({
        title: 'Signos Vitales',
        entities: Object.entries(content.vital_signs).map(([name, data]) => ({
          name,
          value: data.value,
          unit: data.unit || '',
          confidence: data.confidence
        })),
        type: 'vitals'
      });
    }
    
    if ('diagnoses' in content && content.diagnoses) {
      groups.push({
        title: 'Diagnósticos',
        entities: content.diagnoses.map((diagnosis) => ({
          ...diagnosis,
          name: diagnosis.name
        })),
        type: 'diagnoses'
      });
    }
    
    return groups;
  }, []);

  if (entityGroups.length === 0) return null;

  return (
    <div className="space-y-4">
      {showTitle && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Entidades Identificadas
        </h3>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entityGroups.map((group, idx) => (
          <EntityGrid
            key={`${group.type}-${idx}`}
            title={group.title}
            entities={group.entities}
          />
        ))}
      </div>
    </div>
  );
};

export default EntityGroups;