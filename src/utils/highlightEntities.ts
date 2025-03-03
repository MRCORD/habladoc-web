// src/utils/highlightEntities.ts - Updated with CSS variables for consistent theming
import React from 'react';
import { themeBackgroundColor, themeTextColor, themeBorderColor } from '@/lib/color-utils';

/**
 * Converts a string to sentence case
 * @param str String to convert
 * @returns String with first letter uppercase and rest lowercase
 */
export function toSentenceCase(str: string): string {
  if (!str) return '';
  
  if (str.includes('-')) {
    return str
      .split('-')
      .map(toSentenceCase)
      .join('-');
  }
  
  if (str.includes(' ')) {
    return str
      .split(' ')
      .map(toSentenceCase)
      .join(' ');
  }

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Highlights entities in text with consistent theme colors
 * @param text Text to highlight entities in
 * @param entities Array of entities to highlight
 * @returns React node with highlighted entities
 */
export function highlightEntitiesInText(text: string, entities: { name?: string; type?: string }[] = []): React.ReactNode {
  if (!text || entities.length === 0) return text;

  const allEntityNames = entities
    .map(e => e.name?.toLowerCase())
    .filter(Boolean) as string[];

  if (allEntityNames.length === 0) return text;

  const entityRegex = new RegExp(`\\b(${allEntityNames.join('|')})\\b`, 'gi');

  // Helper function to get highlight class based on entity type
  const getHighlightClass = (entityName: string): string => {
    const entity = entities.find(e => 
      e.name?.toLowerCase() === entityName.toLowerCase()
    );
    
    if (!entity || !entity.type) return 'entity-default';
    
    // Get type-specific highlighting
    const type = entity.type.toLowerCase();
    if (type.includes('symptom')) {
      return 'entity-symptom';
    } else if (type.includes('condition') || type.includes('diagnosis')) {
      return 'entity-diagnosis';
    } else if (type.includes('medication')) {
      return 'entity-medication';
    } else if (type.includes('vital') || type.includes('sign')) {
      return 'entity-vital';
    } else if (type.includes('lab') || type.includes('test')) {
      return 'entity-lab';
    } else {
      return 'entity-default';
    }
  };

  // Define CSS classes using our theming system
  const entityClasses = {
    'entity-default': `font-medium ${themeBackgroundColor('primary', 50, 900, 1, 0.2)} ${themeTextColor('primary', 700, 300)} px-1.5 py-0.5 rounded-md ${themeBorderColor('primary', 100, 800)}`,
    'entity-symptom': `font-medium ${themeBackgroundColor('danger', 50, 900, 1, 0.2)} ${themeTextColor('danger', 700, 300)} px-1.5 py-0.5 rounded-md ${themeBorderColor('danger', 100, 800)}`,
    'entity-diagnosis': `font-medium ${themeBackgroundColor('success', 50, 900, 1, 0.2)} ${themeTextColor('success', 700, 300)} px-1.5 py-0.5 rounded-md ${themeBorderColor('success', 100, 800)}`,
    'entity-medication': `font-medium ${themeBackgroundColor('warning', 50, 900, 1, 0.2)} ${themeTextColor('warning', 700, 300)} px-1.5 py-0.5 rounded-md ${themeBorderColor('warning', 100, 800)}`,
    'entity-vital': `font-medium ${themeBackgroundColor('info', 50, 900, 1, 0.2)} ${themeTextColor('info', 700, 300)} px-1.5 py-0.5 rounded-md ${themeBorderColor('info', 100, 800)}`,
    'entity-lab': `font-medium ${themeBackgroundColor('neutral', 100, 800, 1, 0.3)} ${themeTextColor('neutral', 700, 300)} px-1.5 py-0.5 rounded-md ${themeBorderColor('neutral', 200, 700)}`,
  };

  const parts = text.split(entityRegex).map((part: string, i: number) => {
    if (allEntityNames.includes(part.toLowerCase())) {
      const entityClass = getHighlightClass(part);
      
      return React.createElement('span', {
        key: i,
        className: entityClasses[entityClass as keyof typeof entityClasses],
        title: "Entidad clínica identificada"
      }, toSentenceCase(part));
    }
    return part;
  });

  return React.createElement(React.Fragment, null, ...parts);
}

/**
 * Highlights a specific type of entity in text
 * @param text Text to highlight entities in
 * @param entityType Type of entity to highlight
 * @param entities Array of entities to filter by type
 * @returns React node with highlighted entities
 */
export function highlightEntityTypeInText(
  text: string, 
  entityType: string, 
  entities: { name?: string; type?: string }[] = []
): React.ReactNode {
  const filteredEntities = entities.filter(e => 
    e.type?.toLowerCase().includes(entityType.toLowerCase())
  );
  
  return highlightEntitiesInText(text, filteredEntities);
}