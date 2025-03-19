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
 * Convert a UTC date string to local date key (YYYY-MM-DD)
 */
export function getLocalDateKey(utcDateString: string): string {
  // Create date object from the UTC string
  const date = new Date(utcDateString);
  
  // Create a new date using local components to ensure proper timezone handling
  const localDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  
  // Format as YYYY-MM-DD
  return localDate.toISOString().split('T')[0];
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

/**
 * Format time from a UTC string to local time
 */
export function formatLocalTime(dateStr?: string | null): string {
  if (!dateStr) return '---';
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '---';
  }
}

/**
 * Debug utility to log date conversions
 */
export function debugDate(dateStr: string): void {
  const date = new Date(dateStr);
  console.log('Date conversion:', {
    input: dateStr,
    localDate: date.toLocaleString(),
    dateKey: getLocalDateKey(dateStr),
    components: {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hours: date.getHours(),
      minutes: date.getMinutes()
    }
  });
}

/**
 * Group sessions by local date
 */
export function groupSessionsByDate<T extends Record<string, any>>(
  sessions: T[],
  dateField: keyof T = 'scheduled_for' as keyof T
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};

  sessions.forEach(session => {
    if (!session[dateField]) return;
    
    // Debug logging in development
    if (process.env.NODE_ENV !== 'production') {
      debugDate(session[dateField] as string);
    }
    
    // Get local date key
    const dateKey = getLocalDateKey(session[dateField] as string);
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(session);
  });

  // Sort the groups by date (most recent first)
  return Object.fromEntries(
    Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
  );
}

/**
 * Get a human-readable relative time string
 */
export function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Justo ahora';
  if (diffInMinutes === 1) return 'Hace 1 minuto';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return 'Hace 1 hora';
  if (diffInHours < 24) return `Hace ${diffInHours} horas`;
  
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Get formatted datetime values from timestamp
 */
export function getFormattedDateTime(timestamp: string) {
  try {
    const date = new Date(timestamp);
    return {
      time: formatLocalTime(timestamp),
      date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      relativeTime: getRelativeTimeString(date)
    };
  } catch (error) {
    console.error("Error formatting date:", error);
    return { time: "", date: "", relativeTime: "" };
  }
}