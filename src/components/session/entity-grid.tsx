// src/components/session/entity-grid.tsx

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Minus,
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
  CircleDotIcon as StatusIcon
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

interface AttributeTagProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
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

  // Add specific colors for different attribute types with semantic grouping
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
    
    // Context and additional information
    if (['Context'].includes(label)) {
      return 'bg-gray-50 text-gray-700 border-gray-200';
    }
    
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const tagColor = getTagColor(label);

  return (
    <span 
      className={`inline-flex items-center gap-1.5 ${tagColor} px-2 py-1 rounded-md text-xs mr-2 mb-1 border shadow-sm hover:shadow-md transition-all duration-200`} 
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="font-medium">
        {spanishLabels[label] || label}: {toSentenceCase(value)}
      </span>
    </span>
  );
}

interface Entity {
  name: string;
  confidence?: number;
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
  [key: string]: any;
}

interface EntityGridProps {
  entities: Entity[];
  title: string;
  onEntityClick?: (entity: Entity) => void;
}

const EntityGrid = ({ entities, title, onEntityClick }: EntityGridProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  // Get header color based on entity type
  const getHeaderColor = (title: string) => {
    switch (title) {
      case 'Síntomas':
        return 'from-blue-50 to-white border-blue-100';
      case 'Signos Vitales':
        return 'from-cyan-50 to-white border-cyan-100';
      case 'Diagnósticos':
        return 'from-emerald-50 to-white border-emerald-100';
      case 'Efectos de Medicamentos':
        return 'from-purple-50 to-white border-purple-100';
      default:
        return 'from-gray-50 to-white border-gray-100';
    }
  };

  // Show preview (3 entities) or all based on expanded state
  const displayEntities = isExpanded ? entities : entities.slice(0, 3);
  const hasMore = entities.length > 3;

  const handleEntityClick = (entity: Entity) => {
    setSelectedEntity(selectedEntity?.name === entity.name ? null : entity);
    if (onEntityClick) {
      onEntityClick(entity);
    }
  };

  const headerColor = getHeaderColor(title);

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className={`p-4 border-b flex justify-between items-center bg-gradient-to-r ${headerColor}`}>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="bg-white bg-opacity-60 backdrop-blur-sm text-gray-700 text-xs px-2 py-1 rounded-full font-medium border border-opacity-20">
            {entities.length}
          </span>
        </div>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isExpanded ? (
              <Minus className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Grid of entities */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {displayEntities.map((entity, idx) => (
            <div
              key={`${entity.name}-${idx}`}
              onClick={() => handleEntityClick(entity)}
              className={`
                group cursor-pointer rounded-lg p-2 transition-all duration-200 relative
                ${selectedEntity?.name === entity.name 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200'
                }
                border
              `}
            >
              <div 
                className="relative text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors pr-4 overflow-hidden"
              >
                <span className="truncate block">
                  {toSentenceCase(entity.name)}
                </span>
                <div className={`absolute right-0 top-0 h-full w-8 bg-gradient-to-l ${
                  selectedEntity?.name === entity.name 
                    ? 'from-blue-50' 
                    : 'from-white group-hover:from-gray-50'
                } to-transparent`}></div>
              </div>
              {entity.confidence && (
                <div className={`text-xs ${selectedEntity?.name === entity.name ? 'text-blue-600' : 'text-gray-500'}`}>
                  {Math.round(entity.confidence * 100)}% confianza
                </div>
              )}
              {/* Smart-positioning tooltip with delay */}
              <div 
                className="invisible opacity-0 group-hover:visible group-hover:opacity-100 
                  transition-all duration-200 delay-300
                  absolute transform -translate-x-1/2 left-1/2 z-20 pointer-events-none"
                style={{
                  bottom: 'calc(100% + 0.5rem)',
                  maxWidth: 'max-content'
                }}
              >
                <div className="bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-md px-3 py-2 max-w-[250px] break-words shadow-lg">
                  {toSentenceCase(entity.name)}
                  <div className="absolute w-2 h-2 bg-gray-900/95 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more/less button for mobile */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 md:hidden w-full text-center font-medium"
          >
            {isExpanded ? 'Ver menos' : `Ver ${entities.length - 3} más`}
          </button>
        )}
      </div>

      {/* Selected entity details */}
      {selectedEntity && (
        <div className="border-t p-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="flex flex-wrap gap-2">
            {selectedEntity.quality && (
              <AttributeTag icon={QualityIcon} label="Quality" value={selectedEntity.quality} />
            )}
            {selectedEntity.location && (
              <AttributeTag icon={LocationIcon} label="Location" value={selectedEntity.location} />
            )}
            {selectedEntity.intensity && (
              <AttributeTag icon={IntensityIcon} label="Intensity" value={selectedEntity.intensity} />
            )}
            {selectedEntity.context && (
              <AttributeTag icon={ContextIcon} label="Context" value={selectedEntity.context} />
            )}
            {selectedEntity.duration && (
              <AttributeTag icon={DurationIcon} label="Duration" value={selectedEntity.duration} />
            )}
            {selectedEntity.frequency && (
              <AttributeTag icon={FrequencyIcon} label="Frequency" value={selectedEntity.frequency} />
            )}
            {selectedEntity.value && selectedEntity.unit && (
              <AttributeTag 
                icon={ValueIcon} 
                label="Measurement" 
                value={`${selectedEntity.value} ${selectedEntity.unit}`} 
              />
            )}
            {selectedEntity.progression && (
              <AttributeTag icon={ProgressionIcon} label="Progression" value={selectedEntity.progression} />
            )}
            {selectedEntity.status && (
              <AttributeTag icon={StatusIcon} label="Status" value={selectedEntity.status} />
            )}
            {selectedEntity.onset && (
              <AttributeTag icon={OnsetIcon} label="Onset" value={selectedEntity.onset} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityGrid;