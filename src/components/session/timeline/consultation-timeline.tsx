// src/components/session/timeline/consultation-timeline.tsx
import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  CalendarDays,
  Search,
  X,
  Filter,
  ArrowDownUp
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import TimelineEventCard, { getEventIcon } from './timeline-event-card';
import TimelineFilter, { TimelineFilters } from './timeline-filter';
import { TimelineEvent } from '@/contexts/timeline-context';
import { 
  consolidateSimilarEvents, 
  findEventRelationships,
  groupEventsByDate,
  formatDateForDisplay,
  getFormattedDateTime
} from '@/utils/timeline-utils';

// Helper function to get confidence display info - add export
export const getConfidenceInfo = (confidence: number | undefined) => {
  if (typeof confidence !== 'number') return { text: 'Desconocido', colorClass: 'text-neutral-500' };
  
  const percentage = Math.round(confidence * 100);
  if (percentage >= 90) {
    return { text: 'Muy alta', colorClass: 'text-success-600 dark:text-success-400' };
  } else if (percentage >= 75) {
    return { text: 'Alta', colorClass: 'text-primary-600 dark:text-primary-400' };
  } else if (percentage >= 60) {
    return { text: 'Moderada', colorClass: 'text-warning-600 dark:text-warning-400' };
  } else {
    return { text: 'Baja', colorClass: 'text-danger-600 dark:text-danger-400' };
  }
};

interface ProcessedEvent extends TimelineEvent {
  formattedDate: string;
  formattedTime: string;
  relativeTime: string;
}

interface ConsultationTimelineProps {
  events: TimelineEvent[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

// Main component
export default function ConsultationTimeline({ 
  events, 
  isCollapsed, 
  onToggleCollapse,
  className = ""
}: ConsultationTimelineProps) {
  // State for filtering, sorting, and expanding groups
  const [filter, setFilter] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
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
      } as ProcessedEvent;
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
  
  // Group events by date and sort according to sortOrder
  const groupedEvents = useMemo(() => {
    const grouped = groupEventsByDate(filteredEvents);
    
    // Convert to array to easily sort
    let sortedEntries = Object.entries(grouped);
    
    // Sort by date
    sortedEntries = sortedEntries.sort(([dateA], [dateB]) => {
      return sortOrder === 'desc' 
        ? dateB.localeCompare(dateA) // newest first for desc
        : dateA.localeCompare(dateB); // oldest first for asc
    });
    
    // Convert back to object
    return Object.fromEntries(sortedEntries);
  }, [filteredEvents, sortOrder]);
  
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
  const handleFilterChange = (newFilters: TimelineFilters) => {
    setFilter(newFilters.searchText);
    // Additional filtering will be added when integrating with the full TimelineFilter component
  };

  if (!events || events.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-500" />
            <CardTitle>Cronología Clínica</CardTitle>
            <Badge variant="default">
              {events.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Mostrar filtros"
              className={`h-8 w-8 ${showFilters ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : ''}`}
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSortOrder}
              aria-label={sortOrder === 'desc' ? "Ordenar ascendente" : "Ordenar descendente"}
              className="h-8 w-8"
            >
              <ArrowDownUp className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="relative mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar en la cronología..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {filter && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFilter('')}
                  className="absolute right-3 top-2.5 h-6 w-6 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      
      {/* Show filters panel if requested */}
      {!isCollapsed && showFilters && (
        <TimelineFilter 
          filters={filterOptions}
          onFilterChange={handleFilterChange}
          eventCounts={eventCounts}
        />
      )}
      
      {!isCollapsed && (
        <CardContent className="p-4">
          {Object.keys(groupedEvents).length === 0 ? (
            <div className="text-center py-10">
              <CalendarDays className="h-12 w-12 mx-auto text-neutral-300 dark:text-neutral-600" />
              <h4 className="mt-2 text-neutral-900 dark:text-neutral-100 font-medium">No hay eventos que mostrar</h4>
              <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                {filter ? 'Intenta con otra búsqueda' : 'No hay eventos registrados en esta cronología'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedEvents).map(([dateGroup, dateEvents]) => (
                <div key={dateGroup} className="relative">
                  {/* Date header */}
                  <div 
                    className="flex items-center mb-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-750 p-1.5 rounded-md"
                    onClick={() => toggleGroup(dateGroup)}
                  >
                    <Button 
                      variant="ghost"
                      size="icon"
                      className="mr-2 h-8 w-8 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    >
                      {expandedGroups[dateGroup] === false ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3">
                        <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                          {formatDateForDisplay(dateGroup)}
                        </h4>
                        <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
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
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700"></div>
                      
                      {dateEvents.map((event) => {
                        const eventId = event.id?.toString() || "";
                        const isExpanded = expandedEvents[eventId] || false;
                        
                        // Add related events if found
                        const eventWithRelations = {
                          ...event,
                          id: event.id || eventId,
                          relatedEvents: relationships[eventId] || [],
                        };
                        
                        return (
                          <div key={eventId} className="relative">
                            {/* Timeline dot */}
                            <div className="absolute -left-3 mt-1.5 w-6 h-6 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center border-2 border-primary-500 dark:border-primary-400 z-10">
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
        </CardContent>
      )}
    </Card>
  );
}