import React, { useState } from 'react';
import { 
  ChevronDown,
  Minus,
  Activity,
  Pill,
  Heart,
  Thermometer,
  FileText,
  Droplet
} from 'lucide-react';
import { AttributeTag, toSentenceCase } from '@/components/common/attribute-tag';

// Badge component with improved styling
const Badge = ({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return (
    <span 
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
};

export type EntityType = 'symptom' | 'condition' | 'medication' | 'vital_sign' | 
                         'lab_result' | 'procedure' | 'Symptoms' | 'Vital Signs' | 
                         'Diagnoses' | 'Medication Effects' | 'Clinical Findings' | 
                         'Clinical Relationships';

export interface Entity {
  name: string;
  type?: string;
  status?: string;
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
  supporting_evidence?: string[];
  [key: string]: string | number | string[] | undefined;
}

interface EntityGridProps {
  entities: Entity[];
  title: string;
  count?: number;
  onEntityClick?: (entity: Entity) => void;
  className?: string;
  hideHeader?: boolean;
  condensed?: boolean; // New prop for condensed view
}

const EntityGrid: React.FC<EntityGridProps> = ({ 
  entities, 
  title, 
  count,
  onEntityClick,
  className = "",
  hideHeader = false,
  condensed = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  // Get header color based on entity type
  const getHeaderColor = (title: string) => {
    const formattedTitle = title.toLowerCase();
    
    if (formattedTitle.includes('síntoma') || formattedTitle.includes('symptom')) {
      return 'from-blue-50 to-white dark:from-blue-900/30 dark:to-gray-800 border-blue-100 dark:border-blue-800';
    }
    if (formattedTitle.includes('signo') || formattedTitle.includes('vital')) {
      return 'from-cyan-50 to-white dark:from-cyan-900/30 dark:to-gray-800 border-cyan-100 dark:border-cyan-800';
    }
    if (formattedTitle.includes('diagnós') || formattedTitle.includes('diagnos')) {
      return 'from-emerald-50 to-white dark:from-emerald-900/30 dark:to-gray-800 border-emerald-100 dark:border-emerald-800';
    }
    if (formattedTitle.includes('medic') || formattedTitle.includes('efecto')) {
      return 'from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 border-purple-100 dark:border-purple-800';
    }
    if (formattedTitle.includes('hallazgo') || formattedTitle.includes('finding')) {
      return 'from-amber-50 to-white dark:from-amber-900/30 dark:to-gray-800 border-amber-100 dark:border-amber-800';
    }
    return 'from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 border-gray-100 dark:border-gray-700';
  };

  // Get entity icon based on type or title
  const getEntityIcon = (entity: Entity, title: string) => {
    const entityType = entity.type?.toLowerCase() || title.toLowerCase();
    
    if (entityType.includes('symptom') || entityType.includes('síntoma')) {
      return <Activity className="h-3.5 w-3.5 text-blue-500" />;
    }
    if (entityType.includes('medication') || entityType.includes('medic')) {
      return <Pill className="h-3.5 w-3.5 text-purple-500" />;
    }
    if (entityType.includes('condition') || entityType.includes('diagnós') || entityType.includes('diagnos')) {
      return <Heart className="h-3.5 w-3.5 text-emerald-500" />;
    }
    if (entityType.includes('vital') || entityType.includes('sign')) {
      return <Thermometer className="h-3.5 w-3.5 text-cyan-500" />;
    }
    if (entityType.includes('lab') || entityType.includes('test')) {
      return <FileText className="h-3.5 w-3.5 text-amber-500" />;
    }
    if (entityType.includes('bleed') || entityType.includes('hemorr') || entityType.includes('sangr')) {
      return <Droplet className="h-3.5 w-3.5 text-red-500" />;
    }
    
    return null;
  };

  // Get confidence color for entity
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "";
    
    if (confidence >= 0.9) return "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
    if (confidence >= 0.7) return "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
    if (confidence >= 0.5) return "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
    return "bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  };

  // All entities are displayed if expanded, otherwise just show previews
  const displayEntities = isExpanded ? entities : entities.slice(0, 3);
  const hasMore = entities.length > 3;

  const handleEntityClick = (entity: Entity) => {
    setSelectedEntity(selectedEntity?.name === entity.name ? null : entity);
    if (onEntityClick) {
      onEntityClick(entity);
    }
  };

  const headerColor = getHeaderColor(title);
  const displayCount = count !== undefined ? count : entities.length;

  return (
    <div className={`border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm ${className}`}>
      {/* Header - conditionally shown */}
      {!hideHeader && (
        <div className={`p-3 border-b dark:border-gray-700 flex justify-between items-center bg-gradient-to-r ${headerColor}`}>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <Badge 
              className="bg-white/80 dark:bg-gray-700/80 bg-opacity-60 backdrop-blur-sm text-gray-700 dark:text-gray-300 text-xs px-2 py-1 font-medium"
            >
              {displayCount}
            </Badge>
          </div>
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors focus:outline-none"
              aria-label={isExpanded ? "Mostrar menos" : "Mostrar más"}
            >
              {isExpanded ? (
                <Minus className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Grid of entities */}
      <div className="p-3">
        <div className={`grid ${condensed ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'}`}>
          {displayEntities.map((entity, idx) => (
            <div
              key={`${entity.name}-${idx}`}
              onClick={() => handleEntityClick(entity)}
              className={`
                group cursor-pointer rounded-lg p-2.5 transition-all duration-200 relative
                ${selectedEntity?.name === entity.name 
                  ? `${getConfidenceColor(entity.confidence)} shadow-sm` 
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                }
                border
              `}
            >
              <div className="flex items-center gap-2">
                {getEntityIcon(entity, title)}
                <div className="relative font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                  <span className="text-sm">
                    {entity.status === "active" && "● "}{toSentenceCase(entity.name)}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col mt-1.5 gap-1.5">
                {/* Only show confidence percentage, removed all tags */}
                {entity.confidence !== undefined && (
                  <div className={`text-xs ${selectedEntity?.name === entity.name ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {Math.round(entity.confidence * 100)}% confianza
                  </div>
                )}
                
                {/* Removed the flex container with all entity tags */}
              </div>
            </div>
          ))}
        </div>

        {/* Show more/less button for mobile */}
        {hasMore && !condensed && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 md:hidden w-full text-center font-medium focus:outline-none"
          >
            {isExpanded ? 'Ver menos' : `Ver ${entities.length - 3} más`}
          </button>
        )}
      </div>

      {/* Selected entity details - now shown for all entity types, including symptoms, regardless of condensed view */}
      {selectedEntity && (
        <div className="border-t dark:border-gray-700 p-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-700 dark:to-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Detalles de {title.toLowerCase().replace(/s$/, '')}</h4>
            <button 
              onClick={() => setSelectedEntity(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedEntity.quality && (
              <AttributeTag label="Quality" value={selectedEntity.quality} />
            )}
            {selectedEntity.location && (
              <AttributeTag label="Location" value={selectedEntity.location} />
            )}
            {selectedEntity.intensity && (
              <AttributeTag label="Intensity" value={selectedEntity.intensity} />
            )}
            {selectedEntity.context && (
              <AttributeTag label="Context" value={selectedEntity.context} />
            )}
            {selectedEntity.duration && (
              <AttributeTag label="Duration" value={selectedEntity.duration} />
            )}
            {selectedEntity.frequency && (
              <AttributeTag label="Frequency" value={selectedEntity.frequency} />
            )}
            {selectedEntity.value && selectedEntity.unit && (
              <AttributeTag 
                label="Measurement" 
                value={`${selectedEntity.value} ${selectedEntity.unit}`} 
              />
            )}
            {selectedEntity.progression && (
              <AttributeTag label="Progression" value={selectedEntity.progression} />
            )}
            {selectedEntity.status && (
              <AttributeTag label="Status" value={selectedEntity.status} />
            )}
            {selectedEntity.onset && (
              <AttributeTag label="Onset" value={selectedEntity.onset} />
            )}
          </div>
          
          {/* Supporting evidence section */}
          {selectedEntity.supporting_evidence && selectedEntity.supporting_evidence.length > 0 && (
            <div className="mt-3 pt-3 border-t dark:border-gray-700">
              <h5 className="text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Evidencia de respaldo:</h5>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {selectedEntity.supporting_evidence.map((evidence, idx) => (
                  <li key={idx} className="pl-3 border-l-2 border-blue-200 dark:border-blue-800">
                    {evidence}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EntityGrid;