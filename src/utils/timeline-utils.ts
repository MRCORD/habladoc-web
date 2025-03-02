// src/utils/timeline-utils.ts
// Add these functions to your existing timeline-utils.ts file

/**
 * Consolidates similar events (especially symptoms) to avoid repetition
 */
export function consolidateSimilarEvents(events: any[]): any[] {
  const symptomsMap: Record<string, any> = {};
  const nonSymptoms: any[] = [];
  const usedIds = new Set<string>();

  // Helper function to generate unique ID
  const generateUniqueId = (event: any, index: number): string => {
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
      // Create a normalized key for the symptom - remove parentheses for comparison
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
            occurrences: (symptomsMap[symptomKey].metadata?.occurrences || 1) + 1
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
export function findEventRelationships(events: any[]): Record<string, any[]> {
  const relationships: Record<string, any[]> = {};
  
  // Find symptom-diagnosis relationships
  const diagnoses = events.filter(e => e.event_type.toLowerCase() === 'diagnosis');
  const symptoms = events.filter(e => e.event_type.toLowerCase() === 'symptom');
  
  // For each diagnosis, find related symptoms
  diagnoses.forEach(diagnosis => {
    const eventId = diagnosis.id || diagnosis.timestamp;
    
    if (diagnosis.metadata?.supporting_evidence) {
      const relatedSymptoms = symptoms.filter(symptom => {
        if (!symptom.details) return false;
        
        return diagnosis.metadata?.supporting_evidence?.some((evidence: string) => 
          symptom.details?.toLowerCase().includes(evidence.toLowerCase())
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
export function groupEventsByDate(events: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  
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
  } catch (e) {
    return dateKey;
  }
}