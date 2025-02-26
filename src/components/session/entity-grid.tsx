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

// Tooltip component
const Tooltip = ({ 
  content, 
  children, 
  side = "top" 
}: { 
  content: React.ReactNode; 
  children: React.ReactNode; 
  side?: "top" | "bottom" | "left" | "right"; 
}) => {
  return (
    <div className="relative group">
      {children}
      <div className={`absolute ${
        side === "top" ? "bottom-full mb-2" : 
        side === "bottom" ? "top-full mt-2" : 
        side === "left" ? "right-full mr-2" : 
        "left-full ml-2"} 
        z-10 invisible opacity-0 group-hover:visible group-hover:opacity-100 
        transition-opacity duration-300 pointer-events-none`}>
        <div className="bg-gray-900 text-white text-xs rounded p-2 max-w-xs shadow-lg">
          {content}
          <div className={`absolute ${
            side === "top" ? "top-full left-1/2 -translate-x-1/2 -mt-1 border-t-gray-900" : 
            side === "bottom" ? "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-gray-900" : 
            side === "left" ? "left-full top-1/2 -translate-y-1/2 -ml-1 border-l-gray-900" : 
            "right-full top-1/2 -translate-y-1/2 -mr-1 border-r-gray-900"} 
            border-solid border-8 border-transparent w-0 h-0`}>
          </div>
        </div>
      </div>
    </div>
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
                <div className="relative font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors pr-4 overflow-hidden">
                  <span className="truncate block text-sm">
                    {entity.status === "active" && "● "}{toSentenceCase(entity.name)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-1.5">
                {entity.confidence !== undefined && (
                  <div className={`text-xs ${selectedEntity?.name === entity.name ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {Math.round(entity.confidence * 100)}% confianza
                  </div>
                )}
                
                {(entity.intensity || entity.status || entity.location) && (
                  <div className="flex items-center gap-1">
                    {entity.intensity && (
                      <span className="inline-block px-1.5 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                        {entity.intensity}
                      </span>
                    )}
                    {entity.location && !condensed && (
                      <span className="inline-block px-1.5 py-0.5 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                        {entity.location}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Tooltip with entity details */}
              <Tooltip 
                content={
                  <div className="max-w-xs p-2">
                    <div className="font-medium mb-1">{toSentenceCase(entity.name)}</div>
                    <ul className="text-xs space-y-1">
                      {entity.status && <li><strong>Estado:</strong> {entity.status}</li>}
                      {entity.location && <li><strong>Ubicación:</strong> {entity.location}</li>}
                      {entity.duration && <li><strong>Duración:</strong> {entity.duration}</li>}
                      {entity.intensity && <li><strong>Intensidad:</strong> {entity.intensity}</li>}
                      {entity.frequency && <li><strong>Frecuencia:</strong> {entity.frequency}</li>}
                      {entity.context && <li><strong>Contexto:</strong> {entity.context}</li>}
                      {entity.confidence && <li><strong>Confianza:</strong> {Math.round(entity.confidence * 100)}%</li>}
                    </ul>
                  </div>
                }
                side="top"
              >
                <span className="sr-only">Más información</span>
              </Tooltip>
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

      {/* Selected entity details */}
      {selectedEntity && !condensed && (
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