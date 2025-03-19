import { TimelineEvent } from '@/contexts/timeline-context';

interface TimestampGroups {
  [key: string]: TimelineEvent[];
}

/**
 * Consolidates similar events (especially symptoms) to avoid repetition
 */
export function consolidateSimilarEvents(events: TimelineEvent[]): TimelineEvent[] {
  const symptomsMap: Record<string, TimelineEvent> = {};
  const nonSymptoms: TimelineEvent[] = [];
  const usedIds = new Set<string>();

  // Helper function to generate unique ID
  const generateUniqueId = (event: TimelineEvent, index: number): string => {
    const baseId = event.id || `${event.event_type}-${event.timestamp}`;
    if (!usedIds.has(baseId)) {
      usedIds.add(baseId);
      return baseId;
    }
    // If ID is already used, append an index
    const uniqueId = `${baseId}-${index}`;
    usedIds.add(uniqueId);
    return uniqueId;
  };
  
  events.forEach((event, index) => {
    if (event.event_type.toLowerCase() === 'symptom' && event.details) {
      // Create a normalized key for the symptom - remove parentheses content
      const symptomKey = event.details.toLowerCase()
        .replace(/\([^)]*\)/g, '') // Remove parentheses content
        .trim();
        
      if (!symptomsMap[symptomKey]) {
        // This is the first occurrence of this symptom
        symptomsMap[symptomKey] = {
          ...event,
          id: generateUniqueId(event, index),
          metadata: {
            ...event.metadata,
            occurrences: 1
          }
        };
      } else {
        // Update the existing symptom entry with occurrence count
        symptomsMap[symptomKey] = {
          ...symptomsMap[symptomKey],
          // Use the higher confidence value
          confidence: Math.max(symptomsMap[symptomKey].confidence, event.confidence),
          metadata: {
            ...symptomsMap[symptomKey].metadata,
            occurrences: ((symptomsMap[symptomKey].metadata?.occurrences as number) || 1) + 1
          }
        };
      }
    } else {
      nonSymptoms.push({
        ...event,
        id: generateUniqueId(event, index)
      });
    }
  });
  
  return [...Object.values(symptomsMap), ...nonSymptoms];
}

/**
 * Find relationships between events (e.g., symptoms and diagnoses)
 */
export function findEventRelationships(events: TimelineEvent[]): Record<string, TimelineEvent[]> {
  const relationships: Record<string, TimelineEvent[]> = {};
  
  // Find symptom-diagnosis relationships
  const diagnoses = events.filter(e => e.event_type.toLowerCase() === 'diagnosis');
  const symptoms = events.filter(e => e.event_type.toLowerCase() === 'symptom');
  
  // For each diagnosis, find related symptoms
  diagnoses.forEach(diagnosis => {
    const eventId = diagnosis.id || diagnosis.timestamp;
    
    if (diagnosis.metadata?.supporting_evidence) {
      const relatedSymptoms = symptoms.filter(symptom => {
        if (!symptom.details) return false;
        
        const evidence = diagnosis.metadata?.supporting_evidence as string[];
        return evidence?.some((evidenceItem: string) => 
          symptom.details?.toLowerCase().includes(evidenceItem.toLowerCase())
        );
      });
      
      if (relatedSymptoms.length > 0) {
        relationships[eventId] = relatedSymptoms;
        
        // Also add diagnosis as related to each symptom
        relatedSymptoms.forEach(symptom => {
          const symptomId = symptom.id || symptom.timestamp;
          if (!relationships[symptomId]) {
            relationships[symptomId] = [];
          }
          relationships[symptomId].push(diagnosis);
        });
      }
    }
  });
  
  return relationships;
}

/**
 * Group events by date
 */
export function groupEventsByDate(events: TimelineEvent[]): TimestampGroups {
  const groups: TimestampGroups = {};
  
  events.forEach(event => {
    // Extract date part only (YYYY-MM-DD) from timestamp for grouping
    const dateKey = event.timestamp.split('T')[0];
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
  });
  
  // Sort dates in descending order (newest first)
  return Object.fromEntries(
    Object.entries(groups).sort(([dateA], [dateB]) => 
      dateB.localeCompare(dateA)
    )
  );
}

/**
 * Group sessions by date (YYYY-MM-DD)
 * @param sessions Array of sessions to group
 * @param dateField Field to use for grouping (defaults to scheduled_for)
 * @returns Record with date keys and arrays of sessions
 */
export function groupSessionsByDate(
  sessions: any[],
  dateField: string = 'scheduled_for'
): Record<string, any[]> {
  const groups: Record<string, any[]> = {};

  sessions.forEach(session => {
    if (!session[dateField]) return;
    
    const date = new Date(session[dateField]);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(session);
  });

  // Sort the groups by date (most recent first)
  const sortedGroups: Record<string, any[]> = {};
  Object.keys(groups)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .forEach(key => {
      sortedGroups[key] = groups[key];
    });

  return sortedGroups;
}

/**
 * Format a date key into a user-friendly display string
 */
export function formatDateForDisplay(dateKey: string): string {
  try {
    const date = new Date(dateKey);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateKey;
  }
}