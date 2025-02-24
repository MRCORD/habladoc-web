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
  CheckCircle2Icon as CertaintyIcon
} from 'lucide-react';

// Helper function to convert text to sentence case
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

export type AttributeLabel = 'Quality' | 'Location' | 'Intensity' | 'Context' | 'Duration' | 
                     'Frequency' | 'Measurement' | 'Progression' | 'Status' | 'Onset' | 
                     'Value' | 'Impact' | 'Severity' | 'Certainty';

export type EntityType = 'Symptoms' | 'Vital Signs' | 'Diagnoses' | 'Medication Effects' | 
                 'Clinical Findings' | 'Clinical Relationships';

export type StatusType = 'processing' | 'completed' | 'failed' | 'processed';

export const translations = {
  // Attribute labels
  attributes: {
    'Quality': 'Característica',
    'Location': 'Localización',
    'Intensity': 'Intensidad',
    'Context': 'Contexto',
    'Duration': 'Duración',
    'Frequency': 'Frecuencia',
    'Measurement': 'Medición',
    'Progression': 'Evolución',
    'Status': 'Estado',
    'Onset': 'Comienzo',
    'Value': 'Valor',
    'Impact': 'Impacto',
    'Severity': 'Gravedad',
    'Certainty': 'Certeza'
  } as Record<AttributeLabel, string>,
  // Entity types
  entityTypes: {
    'Symptoms': 'Síntomas',
    'Vital Signs': 'Signos Vitales',
    'Diagnoses': 'Diagnósticos',
    'Medication Effects': 'Efectos de Medicamentos',
    'Clinical Findings': 'Hallazgos Clínicos',
    'Clinical Relationships': 'Relaciones Clínicas'
  } as Record<EntityType, string>,
  // Status labels
  status: {
    'processing': 'Procesando',
    'completed': 'Completado',
    'failed': 'Fallido',
    'processed': 'Procesado'
  } as Record<StatusType, string>
};

export { toSentenceCase };

type IconKey = 'duration' | 'frequency' | 'intensity' | 'location' | 'onset' | 
               'progression' | 'quality' | 'context' | 'value' | 'unit' | 
               'status' | 'impact' | 'severity' | 'certainty';

export const attributeIcons: Record<IconKey, React.ComponentType<any>> = {
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
  icon?: React.ComponentType<any>;
  label: string;
  value: string;
}

export function AttributeTag({ icon: CustomIcon, label, value }: AttributeTagProps) {
  // Get icon based on label if not provided
  const Icon = CustomIcon || attributeIcons[label.toLowerCase() as IconKey] || ContextIcon;

  const getTagColor = (label: string) => {
    // Time-related attributes
    if (['Duration', 'Frequency', 'Onset'].includes(label)) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    
    // Measurement-related attributes
    if (['Value', 'Measurement', 'Intensity'].includes(label)) {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }
    
    // Location and physical attributes
    if (['Location', 'Quality'].includes(label)) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    
    // Progress-related attributes
    if (['Progression', 'Status'].includes(label)) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }

    // Analysis-related attributes
    if (['Impact', 'Severity', 'Certainty'].includes(label)) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    
    // Context and additional information
    if (['Context'].includes(label)) {
      return 'bg-gray-50 text-gray-700 border-gray-200';
    }
    
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // Format both label and value in sentence case
  const formattedLabel = toSentenceCase(translations.attributes[label as AttributeLabel] || label);
  const formattedValue = toSentenceCase(value);

  const tagColor = getTagColor(label);

  return (
    <span 
      className={`inline-flex items-center gap-1.5 ${tagColor} px-2 py-1 rounded-md text-xs mr-2 mb-1 border shadow-sm hover:shadow-md transition-all duration-200`} 
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="font-medium">
        {formattedLabel}: {formattedValue}
      </span>
    </span>
  );
}