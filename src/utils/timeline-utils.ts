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
 * Group sessions by date (YYYY-MM-DD) - Original function
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
    // Parse the date key (YYYY-MM-DD) to create a date object
    const parts = dateKey.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JS months are 0-based
    const day = parseInt(parts[2]);
    
    // Create date at noon to avoid timezone issues with date formatting
    const date = new Date(year, month, day, 12, 0, 0);
    
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

// Utility function to convert UTC date to local date key (YYYY-MM-DD)
export function getLocalDateKey(utcDateString: string): string {
  const date = new Date(utcDateString);
  return date.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format in local timezone
}

/**
 * Format time from a UTC string to local time
 * @param dateStr UTC date string
 * @returns Formatted time string in local timezone
 */
export function getFormattedLocalTime(dateStr?: string | null): string {
  if (!dateStr) return '---';
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '---';
  }
}

/**
 * Group sessions by local date (accounting for timezone)
 * @param sessions Array of sessions to group
 * @param dateField Field to use for grouping (defaults to scheduled_for)
 * @returns Record with date keys and arrays of sessions
 */
export function groupSessionsByLocalDate(
  sessions: any[],
  dateField: string = 'scheduled_for'
): Record<string, any[]> {
  const groups: Record<string, any[]> = {};

  sessions.forEach(session => {
    if (!session[dateField]) return;
    
    // Get local date key (YYYY-MM-DD in local timezone)
    const dateKey = getLocalDateKey(session[dateField]);
    
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
 * Debug utility to log date conversions
 */
export function debugDate(dateStr: string): void {
  console.log('Debug date:', dateStr);
  const date = new Date(dateStr);
  console.log('Local date parts:', {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes()
  });
  console.log('Date key:', getLocalDateKeyV2(dateStr));
}

/**
 * Get a consistent date key from UTC date string - THE FIXED VERSION
 */
export function getLocalDateKeyV2(utcDateString: string): string {
  // Create date object from the UTC string
  const date = new Date(utcDateString);
  
  // Format date in YYYY-MM-DD format in local timezone
  // This uses the browser's timezone
  const localDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  
  // Format as YYYY-MM-DD
  return localDate.toISOString().split('T')[0];
}

/**
 * Group sessions by local date - FIXED VERSION
 */
export function groupSessionsByLocalDateFixed(
  sessions: any[],
  dateField: string = 'scheduled_for'
): Record<string, any[]> {
  const groups: Record<string, any[]> = {};

  sessions.forEach(session => {
    if (!session[dateField]) return;
    
    // For debugging purposes
    if (process.env.NODE_ENV !== 'production') {
      const utc = session[dateField];
      const date = new Date(utc);
      const local = date.toLocaleString();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const displayTime = `${hours}:${minutes}`;
      console.log(`Grouping session ${session.id}: UTC=${utc}, Local date=${local}, Key=${getLocalDateKeyV2(utc)}`);
    }
    
    // Get local date key using our fixed function
    const dateKey = getLocalDateKeyV2(session[dateField]);
    
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