// Timeline utility functions for processing and formatting timeline events

/**
 * Formats symptom description with proper formatting
 * @param description The raw symptom description string
 */
export function formatSymptomDescription(description: string): string {
    if (!description) return '';
    
    // Capitalize first letter of each sentence
    const formatted = description.split('. ')
      .map(sentence => toSentenceCase(sentence))
      .join('. ');
    
    return formatted;
  }
  
  /**
   * Formats a string to sentence case (first letter uppercase, rest lowercase)
   */
  export function toSentenceCase(str: string): string {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Extracts symptom metadata from details string
   * @param details The details string from a symptom event
   */
  export function extractSymptomMetadata(details: string): Record<string, string> {
    const metadata: Record<string, string> = {};
    
    if (!details) return metadata;
    
    // Extract location (common symptom patterns)
    const locationMatches = details.match(/(?:en|de) (los|las|el|la) ([^(]+)/i);
    if (locationMatches && locationMatches[2]) {
      metadata.location = locationMatches[2].trim();
    }
    
    // Extract intensity (often in parentheses)
    const intensityMatches = details.match(/\((.*?)\)/i);
    if (intensityMatches && intensityMatches[1]) {
      metadata.intensity = intensityMatches[1].trim();
    }
    
    // Try to extract duration
    const durationKeywords = [
      'durante', 'por', 'desde hace', 'hace', 
      'días', 'semanas', 'meses', 'años', 
      'permanente', 'constante', 'intermitente'
    ];
    
    for (const keyword of durationKeywords) {
      if (details.toLowerCase().includes(keyword)) {
        const durationRegex = new RegExp(`(${keyword}\\s+[^,.)]+)`, 'i');
        const match = details.match(durationRegex);
        if (match && match[1]) {
          metadata.duration = match[1].trim();
          break;
        }
      }
    }
    
    return metadata;
  }
  
  /**
   * Extracts diagnosis metadata from a diagnosis event
   * @param event The diagnosis event object
   */
  export function extractDiagnosisMetadata(event: any): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    if (!event || !event.metadata) return metadata;
    
    // Status (active, resolved, etc.)
    if (event.metadata.status) {
      metadata.status = translateStatus(String(event.metadata.status));
    }
    
    // Certainty
    if (event.metadata.certainty) {
      metadata.certainty = toSentenceCase(String(event.metadata.certainty));
    }
    
    // Supporting evidence
    if (event.metadata.supporting_evidence && Array.isArray(event.metadata.supporting_evidence)) {
      metadata.evidence = event.metadata.supporting_evidence.map(toSentenceCase);
    }
    
    // Diagnosis name (sometimes exists separately from description)
    if (event.metadata.diagnosis_name) {
      metadata.name = toSentenceCase(String(event.metadata.diagnosis_name));
    }
    
    return metadata;
  }
  
  /**
   * Translates status values to proper Spanish terms
   * @param status The status string to translate
   */
  export function translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'active': 'Activa',
      'activa': 'Activa',
      'inactive': 'Inactiva',
      'inactiva': 'Inactiva',
      'resolved': 'Resuelta',
      'resuelta': 'Resuelta',
      'pending': 'Pendiente',
      'pendiente': 'Pendiente'
    };
    
    return statusMap[status.toLowerCase()] || toSentenceCase(status);
  }
  
  /**
   * Formats a date string to a relative time description
   * @param dateString The date string to format
   */
  export function getRelativeTimeString(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    
    if (isNaN(date.getTime())) return '';
    
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHr = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHr / 24);
  
    if (diffSec < 60) return 'Justo ahora';
    if (diffMin < 60) return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
    if (diffHr < 24) return `Hace ${diffHr} ${diffHr === 1 ? 'hora' : 'horas'}`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    // For older dates, just return the formatted date
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }
  
  /**
   * Gets the confidence level description in Spanish
   * @param confidence The confidence value (0-1)
   */
  export function getConfidenceLevel(confidence: number): {
    label: string;
    color: string;
    description: string;
  } {
    if (confidence >= 0.9) {
      return {
        label: "Alta",
        color: "green",
        description: "Alta confianza"
      };
    }
    if (confidence >= 0.7) {
      return {
        label: "Buena",
        color: "blue",
        description: "Buena confianza"
      };
    }
    if (confidence >= 0.5) {
      return {
        label: "Moderada",
        color: "yellow",
        description: "Confianza moderada"
      };
    }
    return {
      label: "Baja",
      color: "gray",
      description: "Baja confianza"
    };
  }
  
  /**
   * Translates event type to Spanish
   * @param eventType The event type to translate
   */
  export function translateEventType(eventType: string): string {
    const typeMap: Record<string, string> = {
      'symptom': 'Síntoma reportado',
      'diagnosis': 'Diagnóstico establecido',
      'recording': 'Grabación creada',
      'vital_sign': 'Signo vital',
      'medication': 'Medicación',
      'procedure': 'Procedimiento',
      'lab_result': 'Resultado de laboratorio',
      'bleeding': 'Sangrado',
      'hemorrhage': 'Hemorragia'
    };
    
    return typeMap[eventType.toLowerCase()] || toSentenceCase(eventType);
  }
  
  /**
   * Finds relationships between symptoms and diagnoses in the timeline
   * @param events Array of timeline events
   */
  export function findClinicalRelationships(events: any[]): Array<{
    diagnosis: any;
    symptoms: any[];
  }> {
    const relationships: Array<{diagnosis: any; symptoms: any[]}> = [];
    
    if (!events || !Array.isArray(events)) return relationships;
    
    const diagnoses = events.filter(event => 
      event.event_type.toLowerCase() === 'diagnosis'
    );
    
    const symptoms = events.filter(event => 
      event.event_type.toLowerCase() === 'symptom'
    );
    
    diagnoses.forEach(diagnosis => {
      const relatedSymptoms: any[] = [];
      
      // Check if this diagnosis has supporting evidence
      if (diagnosis.metadata && 
          diagnosis.metadata.supporting_evidence && 
          Array.isArray(diagnosis.metadata.supporting_evidence)) {
        
        // For each piece of evidence, find matching symptoms
        diagnosis.metadata.supporting_evidence.forEach((evidence: string) => {
          symptoms.forEach(symptom => {
            if (symptom.details && 
                evidence.toLowerCase().includes(symptom.details.toLowerCase().split('(')[0].trim())) {
              relatedSymptoms.push(symptom);
            }
          });
        });
      }
      
      if (relatedSymptoms.length > 0) {
        relationships.push({
          diagnosis,
          symptoms: relatedSymptoms
        });
      }
    });
    
    return relationships;
  }