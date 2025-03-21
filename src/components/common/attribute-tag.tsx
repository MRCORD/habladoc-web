import React from 'react';
import { 
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
  ArrowUpRightIcon as ImpactIcon,
  AlertTriangleIcon as SeverityIcon,
  CheckCircle2Icon as CertaintyIcon,
  LucideProps
} from 'lucide-react';
import { toSentenceCase } from '@/utils/highlightEntities';

export type AttributeLabel = 'Quality' | 'Location' | 'Intensity' | 'Context' | 'Duration' | 
                     'Frequency' | 'Measurement' | 'Progression' | 'Status' | 'Onset' | 
                     'Value' | 'Impact' | 'Severity' | 'Certainty' | 'Relationship';

export type EntityType = 'symptom' | 'condition' | 'medication' | 'vital_sign' | 
                        'lab_result' | 'procedure' | 'Symptoms' | 'Vital Signs' | 
                        'Diagnoses' | 'Medication Effects' | 'Clinical Findings' | 
                        'Clinical Relationships';

export type StatusType = 'processing' | 'completed' | 'failed' | 'processed';

export type RelationType = 'indicates' | 'causes' | 'treats' | 'associated' | 
                   'contraindicates' | 'exacerbates' | 'improves';

export const translations = {
  // Attribute labels
  attributes: {
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
    'Value': 'Valor',
    'Impact': 'Impacto',
    'Severity': 'Severidad',
    'Certainty': 'Certeza',
    'Relationship': 'Relación'
  } as Record<AttributeLabel, string>,
  // Entity types
  entityTypes: {
    'symptom': 'Síntoma',
    'condition': 'Condición',
    'medication': 'Medicamento',
    'vital_sign': 'Signo vital',
    'lab_result': 'Resultado de laboratorio',
    'procedure': 'Procedimiento',
    'Symptoms': 'Síntomas y signos',
    'Vital Signs': 'Signos vitales',
    'Diagnoses': 'Diagnósticos',
    'Medication Effects': 'Efectos farmacológicos',
    'Clinical Findings': 'Hallazgos clínicos',
    'Clinical Relationships': 'Relaciones clínicas'
  } as Record<EntityType, string>,
  // Status labels
  status: {
    'processing': 'En proceso',
    'completed': 'Completado',
    'failed': 'Error',
    'processed': 'Procesado'
  } as Record<StatusType, string>,
  // Relationship types with simplified clinical translations
  relationships: {
    'indicates': 'Indica',
    'causes': 'Causa',
    'treats': 'Trata',
    'associated': 'Asociado a',
    'contraindicates': 'Contraindica',
    'exacerbates': 'Agrava',
    'improves': 'Mejora'
  } as Record<RelationType, string>
};

export { toSentenceCase };

type IconKey = 'duration' | 'frequency' | 'intensity' | 'location' | 'onset' | 
               'progression' | 'quality' | 'context' | 'value' | 'unit' | 
               'status' | 'impact' | 'severity' | 'certainty';

export const attributeIcons: Record<IconKey, React.ComponentType<LucideProps>> = {
  duration: DurationIcon,
  frequency: FrequencyIcon,
  intensity: IntensityIcon,
  location: LocationIcon,
  onset: OnsetIcon,
  progression: ProgressionIcon,
  quality: QualityIcon,
  context: ContextIcon,
  value: ValueIcon,
  unit: UnitIcon,
  status: StatusIcon,
  impact: ImpactIcon,
  severity: SeverityIcon,
  certainty: CertaintyIcon
};

export interface AttributeTagProps {
  icon?: React.ComponentType<LucideProps>;
  label: string;
  value: string;
}

export function AttributeTag({ icon: CustomIcon, label, value }: AttributeTagProps) {
  const Icon = CustomIcon || attributeIcons[label.toLowerCase() as IconKey] || ContextIcon;

  const getTagColor = (label: string, value: string) => {
    // Entity type colors - using a more distinct neutral color
    const entityType = label.toLowerCase();
    const isEntityTag = Object.keys(translations.entityTypes).some(key => key.toLowerCase() === entityType);
    
    if (isEntityTag) {
      return 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }

    // Time-related attributes
    if (['Duration', 'Frequency', 'Onset'].includes(label)) {
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    }
    
    // Measurement-related attributes
    if (['Value', 'Measurement', 'Intensity'].includes(label)) {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800';
    }
    
    // Location and physical attributes
    if (['Location', 'Quality'].includes(label)) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
    }
    
    // Progress-related attributes
    if (['Progression', 'Status'].includes(label)) {
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
    }
    
    // Analysis-related attributes
    if (['Impact', 'Severity', 'Certainty'].includes(label)) {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    }

    // Relationship-related attributes
    if (label === 'Relationship') {
      switch (value.toLowerCase()) {
        case 'indicates':
        case 'associated':
          return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
        case 'causes':
        case 'exacerbates':
          return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
        case 'treats':
        case 'improves':
          return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
        case 'contraindicates':
          return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
        default:
          return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      }
    }
    
    return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  };

  // Format both label and value in sentence case
  const formattedLabel = toSentenceCase(translations.attributes[label as AttributeLabel] || label);
  const formattedValue = label === 'Relationship' 
    ? toSentenceCase(translations.relationships[value.toLowerCase() as RelationType] || value)
    : Object.keys(translations.entityTypes).includes(label.toLowerCase())
    ? value // For entity types, use the translated value directly
    : toSentenceCase(value);

  const tagColor = getTagColor(label, value);
  const isEntityType = Object.keys(translations.entityTypes).includes(label.toLowerCase());

  // For relationship tags and entity types, only show the value without label and icon
  if (label === 'Relationship' || isEntityType) {
    return (
      <span 
        className={`inline-flex items-center touch-manipulation ${tagColor} ${
          isEntityType 
            ? 'px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg'
            : 'px-2 py-1 text-[10px] sm:text-xs font-medium rounded'
        }`} 
      >
        {formattedValue}
      </span>
    );
  }

  // For all other tags, show with icon and label
  return (
    <span 
      className={`inline-flex items-center gap-1 sm:gap-1.5 ${tagColor} px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs touch-manipulation`} 
    >
      <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
      <span className="font-medium truncate">
        {formattedLabel}: {formattedValue}
      </span>
    </span>
  );
}