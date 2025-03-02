// src/components/session/consultation-timeline.tsx

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  CalendarDays,
  Search,
  X,
} from "lucide-react";

import TimelineEventCard, { getEventIcon } from './timeline-event-card';
import TimelineFilter from './timeline-filter';
import { 
  consolidateSimilarEvents, 
  findEventRelationships,
  groupEventsByDate,
  formatDateForDisplay
} from '@/utils/timeline-utils';

// Helper function to get confidence display info - add export
export const getConfidenceInfo = (confidence: number | undefined) => {
  if (typeof confidence !== 'number') return { text: 'Desconocido', colorClass: 'text-gray-500' };
  
  const percentage = Math.round(confidence * 100);
  if (percentage >= 90) {
    return { text: 'Muy alta', colorClass: 'text-green-600 dark:text-green-400' };
  } else if (percentage >= 75) {
    return { text: 'Alta', colorClass: 'text-emerald-600 dark:text-emerald-400' };
  } else if (percentage >= 60) {
    return { text: 'Moderada', colorClass: 'text-yellow-600 dark:text-yellow-400' };
  } else {
    return { text: 'Baja', colorClass: 'text-red-600 dark:text-red-400' };
  }
};

export interface TimelineEvent {
  id?: string;
  event_type: string;
  description: string;
  timestamp: string;
  confidence: number;
  details?: string;
  metadata?: {
    status?: string;
    supporting_evidence?: string[];
    duration?: number;
    [key: string]: unknown;
  };
  component_refs?: string[];
}

interface ConsultationTimelineProps {
  events: TimelineEvent[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// Helper function to format datetime values
const getFormattedDateTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      relativeTime: getRelativeTimeString(date)
    };
  } catch (error) {
    console.error("Error formatting date:", error);
    return { time: "", date: "", relativeTime: "" };
  }
};

// Get relative time string (e.g., "2 minutes ago")
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

// Main component
export default function ConsultationTimeline({ events, isCollapsed, onToggleCollapse }: ConsultationTimelineProps) {
  // State for filtering and expanding groups
  const [filter, setFilter] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Toggle group expansion
  const toggleGroup = (dateGroup: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [dateGroup]: !prev[dateGroup]
    }));
  };

  // Toggle event expansion
  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  // Process and consolidate events
  const processedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    // First consolidate similar events (especially symptom repetitions)
    const consolidatedEvents = consolidateSimilarEvents(events);
    
    // Process events to add formatted dates and times
    return consolidatedEvents.map(event => {
      const { time, date, relativeTime } = getFormattedDateTime(event.timestamp);
      const uniqueId = event.id || `${event.event_type}-${event.timestamp}`;
      
      return {
        ...event,
        id: uniqueId,
        formattedTime: time,
        formattedDate: date,
        relativeTime
      };
    });
  }, [events]);
  
  // Apply text filter if present
  const filteredEvents = useMemo(() => {
    return filter 
      ? processedEvents.filter(event => 
          event.description.toLowerCase().includes(filter.toLowerCase()) || 
          (event.details && event.details.toLowerCase().includes(filter.toLowerCase()))
        )
      : processedEvents;
  }, [processedEvents, filter]);
  
  // Group events by date
  const groupedEvents = useMemo(() => {
    return groupEventsByDate(filteredEvents);
  }, [filteredEvents]);
  
  // Find relationships between events
  const relationships = useMemo(() => {
    return findEventRelationships(processedEvents);
  }, [processedEvents]);

  // Count events by type for TimelineFilter component
  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    processedEvents.forEach(event => {
      const type = event.event_type.toLowerCase();
      counts[type] = (counts[type] || 0) + 1;
    });
    
    return counts;
  }, [processedEvents]);

  // Prepare filter options for TimelineFilter component
  const filterOptions = useMemo(() => {
    return {
      eventTypes: [],
      confidenceThreshold: 0,
      dateRange: { start: null, end: null },
      searchText: filter
    };
  }, [filter]);

  // Handle filter change from TimelineFilter component
  const handleFilterChange = (newFilters: any) => {
    setFilter(newFilters.searchText);
    // Additional filtering will be added when integrating with the full TimelineFilter component
  };

  if (!events || events.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Calendar className="h-5 w-5 text-blue-500 mr-2" />
            Cronología Clínica
            <span className="ml-2 text-sm px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {events.length}
            </span>
          </h3>
          <button 
            onClick={onToggleCollapse}
            className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            {isCollapsed ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </button>
        </div>
        
        {!isCollapsed && (
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar en la cronología..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            {filter && (
              <button 
                onClick={() => setFilter('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Show filters panel if requested */}
      {!isCollapsed && showFilters && (
        <TimelineFilter 
          filters={filterOptions}
          onFilterChange={handleFilterChange}
          eventCounts={eventCounts}
        />
      )}
      
      {!isCollapsed && (
        <div className="p-4">
          {Object.keys(groupedEvents).length === 0 ? (
            <div className="text-center py-10">
              <CalendarDays className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600" />
              <h4 className="mt-2 text-gray-900 dark:text-gray-100 font-medium">No hay eventos que mostrar</h4>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {filter ? 'Intenta con otra búsqueda' : 'No hay eventos registrados en esta cronología'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedEvents).map(([dateGroup, dateEvents]) => (
                <div key={dateGroup} className="relative">
                  {/* Date header */}
                  <div 
                    className="flex items-center mb-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 p-1.5 rounded-md"
                    onClick={() => toggleGroup(dateGroup)}
                  >
                    <button className="mr-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      {expandedGroups[dateGroup] === false ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </button>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {formatDateForDisplay(dateGroup)}
                        </h4>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {dateEvents.length} eventos
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline events for this date */}
                  {expandedGroups[dateGroup] !== false && (
                    <div className="ml-6 pl-6 relative space-y-4">
                      {/* Vertical timeline line */}
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"></div>
                      
                      {dateEvents.map((event) => {
                        const eventId = event.id?.toString() || "";
                        const isExpanded = expandedEvents[eventId] || false;
                        
                        // Add related events if found
                        const eventWithRelations = {
                          ...event,
                          relatedEvents: relationships[eventId] || []
                        };
                        
                        return (
                          <div key={eventId} className="relative">
                            {/* Timeline dot */}
                            <div className="absolute -left-3 mt-1 w-6 h-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center border-2 border-blue-500 dark:border-blue-400 z-10">
                              {getEventIcon(event.event_type)}
                            </div>
                            
                            {/* Event card with timeline-event-card component */}
                            <div className="ml-6">
                              <TimelineEventCard
                                event={eventWithRelations}
                                isExpanded={isExpanded}
                                onToggleExpand={() => toggleEvent(eventId)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}