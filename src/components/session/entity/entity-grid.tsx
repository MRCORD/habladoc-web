// src/components/session/entity/entity-grid.tsx
import React, { useState } from 'react';
import { 
  ChevronDown,
  Minus,
  Activity,
  Pill,
  Heart,
  Thermometer,
  FileText,
  Droplet,
  PlusCircle
} from 'lucide-react';
import { AttributeTag, toSentenceCase } from '@/components/common/attribute-tag';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

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
  condensed?: boolean;
  emptyMessage?: string;
}

// Get entity icon based on type or title
const getEntityIcon = (entity: Entity) => {
  const entityType = entity.type?.toLowerCase() || '';
  
  if (entityType.includes('symptom') || entityType.includes('síntoma')) {
    return <Activity className="h-3.5 w-3.5 text-primary-500" />;
  }
  if (entityType.includes('medication') || entityType.includes('medic')) {
    return <Pill className="h-3.5 w-3.5 text-warning-500" />;
  }
  if (entityType.includes('condition') || entityType.includes('diagnós') || entityType.includes('diagnos')) {
    return <Heart className="h-3.5 w-3.5 text-success-500" />;
  }
  if (entityType.includes('vital') || entityType.includes('sign')) {
    return <Thermometer className="h-3.5 w-3.5 text-info-500" />;
  }
  if (entityType.includes('lab') || entityType.includes('test')) {
    return <FileText className="h-3.5 w-3.5 text-warning-500" />;
  }
  if (entityType.includes('bleed') || entityType.includes('hemorr') || entityType.includes('sangr')) {
    return <Droplet className="h-3.5 w-3.5 text-danger-500" />;
  }
  
  return null;
};

// Get title icon based on title
const getTitleIcon = (title: string) => {
  const formattedTitle = title.toLowerCase();
  
  if (formattedTitle.includes('síntoma') || formattedTitle.includes('symptom')) {
    return <Activity className="h-5 w-5 text-primary-500" />;
  }
  if (formattedTitle.includes('signo') || formattedTitle.includes('vital')) {
    return <Thermometer className="h-5 w-5 text-info-500" />;
  }
  if (formattedTitle.includes('diagnós') || formattedTitle.includes('diagnos')) {
    return <Heart className="h-5 w-5 text-success-500" />;
  }
  if (formattedTitle.includes('medic') || formattedTitle.includes('efecto')) {
    return <Pill className="h-5 w-5 text-warning-500" />;
  }
  if (formattedTitle.includes('lab') || formattedTitle.includes('test')) {
    return <FileText className="h-5 w-5 text-warning-500" />;
  }
  if (formattedTitle.includes('hallazgo') || formattedTitle.includes('finding')) {
    return <Activity className="h-5 w-5 text-info-500" />;
  }
  return <FileText className="h-5 w-5 text-neutral-500" />;
};

const EntityGrid: React.FC<EntityGridProps> = ({ 
  entities, 
  title, 
  count,
  onEntityClick,
  className = "",
  hideHeader = false,
  condensed = false,
  emptyMessage = "No hay entidades disponibles"
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [viewAll, setViewAll] = useState<boolean>(false);

  // All entities are displayed if expanded and viewAll is true, otherwise just show previews
  const displayEntities = isExpanded 
    ? (viewAll ? entities : entities.slice(0, condensed ? 12 : 6))
    : [];
  
  const hasMore = entities.length > (condensed ? 12 : 6);
  const displayCount = count !== undefined ? count : entities.length;

  const handleEntityClick = (entity: Entity) => {
    setSelectedEntity(selectedEntity?.name === entity.name ? null : entity);
    if (onEntityClick) {
      onEntityClick(entity);
    }
  };

  // Handle "show more/less" functionality
  const toggleViewAll = () => {
    setViewAll(!viewAll);
  };

  if (entities.length === 0) {
    return (
      <Card className={`${className} border-dashed`}>
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
            {getTitleIcon(title)}
          </div>
          <CardTitle className="text-lg mb-2">{title}</CardTitle>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {emptyMessage}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {/* Header - conditionally shown */}
      {!hideHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {getTitleIcon(title)}
            <CardTitle>{title}</CardTitle>
            <Badge variant="default">
              {displayCount}
            </Badge>
          </div>
          {entities.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? "Mostrar menos" : "Mostrar más"}
              className="h-8 w-8"
            >
              {isExpanded ? (
                <Minus className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </CardHeader>
      )}

      {/* Grid of entities */}
      <CardContent className={`${condensed ? 'p-3' : 'p-4'}`}>
        <div className={`grid ${condensed ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'}`}>
          {displayEntities.map((entity, idx) => (
            <div
              key={`${entity.name}-${idx}`}
              onClick={() => handleEntityClick(entity)}
              className={`
                group cursor-pointer rounded-lg p-2.5 transition-all duration-200 relative
                ${selectedEntity?.name === entity.name 
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 shadow-sm' 
                  : 'bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                }
                border
              `}
            >
              <div className="flex items-center gap-2">
                {getEntityIcon(entity)}
                <div className="relative font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                  <span className="text-sm">
                    {entity.status === "active" && (
                      <span className="text-primary-500 mr-1">●</span>
                    )}
                    {toSentenceCase(entity.name)}
                  </span>
                </div>
              </div>
              
              {entity.confidence !== undefined && (
                <div className={`mt-1.5 text-xs ${selectedEntity?.name === entity.name ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                  {Math.round(entity.confidence * 100)}% confianza
                </div>
              )}
              
              {/* Show the most important attribute if available */}
              {!condensed && (entity.intensity || entity.location || entity.duration) && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {entity.intensity && (
                    <Badge variant="default" size="sm">
                      {toSentenceCase(entity.intensity)}
                    </Badge>
                  )}
                  {!entity.intensity && entity.location && (
                    <Badge variant="default" size="sm">
                      {toSentenceCase(entity.location)}
                    </Badge>
                  )}
                  {!entity.intensity && !entity.location && entity.duration && (
                    <Badge variant="default" size="sm">
                      {toSentenceCase(entity.duration)}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show more/less button */}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleViewAll}
            className="mt-3 w-full"
          >
            {viewAll ? 'Ver menos' : `Ver ${entities.length - displayEntities.length} más`}
            {viewAll ? <Minus className="ml-2 h-4 w-4" /> : <PlusCircle className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </CardContent>

      {/* Selected entity details */}
      {selectedEntity && (
        <CardFooter className="p-4 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-800 dark:to-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Detalles de {title.toLowerCase().replace(/s$/, '')}</h4>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEntity(null)}
                className="h-8 w-8"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
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
              <div className="mt-3 pt-3 border-t dark:border-neutral-700">
                <h5 className="text-xs font-medium mb-1 text-neutral-700 dark:text-neutral-300">Evidencia de respaldo:</h5>
                <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                  {selectedEntity.supporting_evidence.map((evidence, idx) => (
                    <li key={idx} className="pl-3 border-l-2 border-primary-200 dark:border-primary-800">
                      {evidence}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default EntityGrid;