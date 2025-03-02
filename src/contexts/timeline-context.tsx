import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// Define timeline event type
export interface TimelineEvent {
  event_type: string;
  description: string;
  timestamp: string;
  confidence: number;
  details?: string;
  metadata?: Record<string, any>;
  component_refs?: string[];
  id?: string;
}

// Define filter type
export interface TimelineFilters {
  eventTypes: string[];
  confidenceThreshold: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  searchText: string;
}

// Define processed event type (with additional properties)
export interface ProcessedTimelineEvent extends TimelineEvent {
  formattedDate: string;
  formattedTime: string;
  relativeTime: string;
  category: string;
  translatedDescription?: string;
  relatedEvents?: ProcessedTimelineEvent[];
  expanded?: boolean;
}

// Define context type
interface TimelineContextType {
  rawEvents: TimelineEvent[];
  processedEvents: ProcessedTimelineEvent[];
  filteredEvents: ProcessedTimelineEvent[];
  filters: TimelineFilters;
  expandedEvents: Record<string, boolean>;
  categoryCounts: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  setFilters: (filters: TimelineFilters) => void;
  toggleEventExpansion: (eventId: string) => void;
  toggleAllEvents: (expanded: boolean) => void;
}

// Create context
const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

// Format date and time from timestamp
const formatDateTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      relative: getRelativeTimeString(date)
    };
  } catch (error) {
    console.error("Error formatting date:", error);
    return { time: "", date: "", relative: "" };
  }
};

// Get relative time string
const getRelativeTimeString = (date: Date): string => {
  const now = new Date();
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
  
  return '';
};

// Get event category based on event type
const getEventCategory = (eventType: string): string => {
  const type = eventType.toLowerCase();
  
  if (type === 'symptom' || type === 'vital_sign' || type === 'lab_result') {
    return 'clinical_findings';
  }
  if (type === 'diagnosis') {
    return 'diagnoses';
  }
  if (type === 'recording') {
    return 'recordings';
  }
  if (type === 'procedure') {
    return 'procedures';
  }
  if (type === 'medication') {
    return 'treatments';
  }
  return 'other';
};

// Translate event description to Spanish
const translateEventDescription = (eventType: string, description: string): string => {
  // First check if it's already in Spanish
  if (description.includes('reportado') || 
      description.includes('establecido') || 
      description.includes('creada')) {
    return description;
  }
  
  // Otherwise translate based on event type
  switch (eventType.toLowerCase()) {
    case 'symptom':
      return 'Síntoma reportado';
    case 'diagnosis':
      return 'Diagnóstico establecido';
    case 'recording':
      return 'Grabación creada';
    case 'vital_sign':
      return 'Signo vital';
    case 'medication':
      return 'Medicación';
    case 'procedure':
      return 'Procedimiento';
    case 'lab_result':
      return 'Resultado de laboratorio';
    default:
      return description;
  }
};

// Provider component
interface TimelineProviderProps {
  children: React.ReactNode;
  events: TimelineEvent[];
}

export const TimelineProvider: React.FC<TimelineProviderProps> = ({ children, events }) => {
  const [filters, setFilters] = useState<TimelineFilters>({
    eventTypes: [],
    confidenceThreshold: 0,
    dateRange: { start: null, end: null },
    searchText: ''
  });
  
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Process raw events to add additional properties
  const processedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    // First, add unique IDs to each event if they don't exist
    const eventsWithIds = events.map((event, index) => ({
      ...event,
      id: event.id || `event-${index}`
    }));

    // Then, process events to add formatting and categories
    return eventsWithIds.map(event => {
      const { time, date, relative } = formatDateTime(event.timestamp);
      const translatedDescription = translateEventDescription(event.event_type, event.description);
      
      return {
        ...event,
        formattedTime: time,
        formattedDate: date,
        relativeTime: relative,
        translatedDescription,
        category: getEventCategory(event.event_type)
      };
    });
  }, [events]);

  // Find relationships between events (e.g., symptoms to diagnoses)
  const eventsWithRelationships = useMemo(() => {
    return processedEvents.map(event => {
      // Find related events
      let relatedEvents: ProcessedTimelineEvent[] = [];
      
      if (event.event_type.toLowerCase() === 'symptom') {
        // Find diagnoses that reference this symptom
        relatedEvents = processedEvents.filter(e => 
          e.event_type.toLowerCase() === 'diagnosis' && 
          e.metadata && 
          e.metadata.supporting_evidence && 
          Array.isArray(e.metadata.supporting_evidence) &&
          e.metadata.supporting_evidence.some((evidence: string) => 
            event.details && 
            evidence.toLowerCase().includes(event.details.toLowerCase().split('(')[0].trim())
          )
        );
      } else if (event.event_type.toLowerCase() === 'diagnosis') {
        // Find symptoms referenced by this diagnosis
        if (event.metadata && 
            event.metadata.supporting_evidence && 
            Array.isArray(event.metadata.supporting_evidence)) {
          const evidenceList = event.metadata.supporting_evidence as string[];
          relatedEvents = processedEvents.filter(e => 
            e.event_type.toLowerCase() === 'symptom' && 
            evidenceList.some(evidence => 
              e.details && 
              evidence.toLowerCase().includes(e.details.toLowerCase().split('(')[0].trim())
            )
          );
        }
      }
      
      return {
        ...event,
        relatedEvents: relatedEvents.length > 0 ? relatedEvents : undefined
      } as ProcessedTimelineEvent;
    });
  }, [processedEvents]);

  // Apply filters to processed events
  const filteredEvents = useMemo(() => {
    return eventsWithRelationships.filter(event => {
      // Filter by event type
      if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(event.event_type.toLowerCase())) {
        return false;
      }
      
      // Filter by confidence threshold
      if (event.confidence < filters.confidenceThreshold) {
        return false;
      }
      
      // Filter by date range
      const eventDate = new Date(event.timestamp);
      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (eventDate < startDate) return false;
      }
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        // Set time to end of day
        endDate.setHours(23, 59, 59, 999);
        if (eventDate > endDate) return false;
      }
      
      // Filter by search text
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const descriptionMatch = event.description.toLowerCase().includes(searchLower);
        const detailsMatch = event.details ? event.details.toLowerCase().includes(searchLower) : false;
        
        if (!descriptionMatch && !detailsMatch) return false;
      }
      
      return true;
    });
  }, [eventsWithRelationships, filters]);

  // Count events by category and type
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    processedEvents.forEach(event => {
      // Count by event type
      const type = event.event_type.toLowerCase();
      counts[type] = (counts[type] || 0) + 1;
      
      // Count by category
      const category = event.category;
      counts[category] = (counts[category] || 0) + 1;
    });
    
    return counts;
  }, [processedEvents]);

  // Toggle event expansion
  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  // Toggle all events expansion
  const toggleAllEvents = (expanded: boolean) => {
    const newState: Record<string, boolean> = {};
    processedEvents.forEach(event => {
      if (event.id) {
        newState[event.id] = expanded;
      }
    });
    setExpandedEvents(newState);
  };

  // Create context value
  const contextValue: TimelineContextType = {
    rawEvents: events,
    processedEvents: eventsWithRelationships,
    filteredEvents,
    filters,
    expandedEvents,
    categoryCounts,
    isLoading,
    error,
    setFilters,
    toggleEventExpansion,
    toggleAllEvents
  };

  return (
    <TimelineContext.Provider value={contextValue}>
      {children}
    </TimelineContext.Provider>
  );
};

// Custom hook to use the timeline context
export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
};