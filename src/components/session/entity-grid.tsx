import React, { useState } from 'react';
import { 
  Plus, 
  Minus
} from 'lucide-react';
import { AttributeTag, translations } from '@/components/common/attribute-tag';
import { toSentenceCase } from '@/utils/highlightEntities';

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
  [key: string]: string | number | undefined;
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
      case translations.entityTypes['Symptoms']:
        return 'from-blue-50 to-white dark:from-blue-900/30 dark:to-gray-800 border-blue-100 dark:border-blue-800';
      case translations.entityTypes['Vital Signs']:
        return 'from-cyan-50 to-white dark:from-cyan-900/30 dark:to-gray-800 border-cyan-100 dark:border-cyan-800';
      case translations.entityTypes['Diagnoses']:
        return 'from-emerald-50 to-white dark:from-emerald-900/30 dark:to-gray-800 border-emerald-100 dark:border-emerald-800';
      case translations.entityTypes['Medication Effects']:
        return 'from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-800 border-purple-100 dark:border-purple-800';
      default:
        return 'from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 border-gray-100 dark:border-gray-700';
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
    <div className="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      {/* Header */}
      <div className={`p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gradient-to-r ${headerColor}`}>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <span className="bg-white dark:bg-gray-700 bg-opacity-60 backdrop-blur-sm text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full font-medium border border-opacity-20 dark:border-opacity-40">
            {entities.length}
          </span>
        </div>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
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
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 shadow-sm' 
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                }
                border
              `}
            >
              <div className="relative text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors pr-4 overflow-hidden">
                <span className="truncate block">
                  {toSentenceCase(entity.name)}
                </span>
                <div className={`absolute right-0 top-0 h-full w-8 bg-gradient-to-l ${
                  selectedEntity?.name === entity.name 
                    ? 'from-blue-50 dark:from-blue-900/30' 
                    : 'from-white dark:from-gray-800 group-hover:from-gray-50 dark:group-hover:from-gray-700'
                } to-transparent`}></div>
              </div>
              {entity.confidence && (
                <div className={`text-xs ${selectedEntity?.name === entity.name ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
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
                <div className="bg-gray-900/95 dark:bg-black/95 backdrop-blur-sm text-white text-xs rounded-md px-3 py-2 max-w-[250px] break-words shadow-lg">
                  {toSentenceCase(entity.name)}
                  <div className="absolute w-2 h-2 bg-gray-900/95 dark:bg-black/95 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more/less button for mobile */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 md:hidden w-full text-center font-medium"
          >
            {isExpanded ? 'Ver menos' : `Ver ${entities.length - 3} más`}
          </button>
        )}
      </div>

      {/* Selected entity details */}
      {selectedEntity && (
        <div className="border-t dark:border-gray-700 p-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-700 dark:to-gray-800">
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
        </div>
      )}
    </div>
  );
};

export default EntityGrid;