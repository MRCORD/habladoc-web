import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  AlertTriangle,
  Stethoscope,
  Activity,
  FileText,
  Mic,
  Heart,
  Droplet,
  FilterX,
  BarChart2,
  Search,
  Pill,
  ChevronRight
} from "lucide-react";

export interface TimelineEvent {
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

interface ProcessedTimelineEvent extends TimelineEvent {
  time: string;
  date: string;
  relative: string;
  category: EventCategory;
  translatedDescription: string;
  index: string;
  relatedEvents?: ProcessedTimelineEvent[];
}

interface ConsultationTimelineProps {
  events: TimelineEvent[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// Event category types for grouping
type EventCategory = 'clinical_findings' | 'diagnoses' | 'recordings' | 'procedures' | 'treatments' | 'other';

// Get icon based on event type
const getEventIcon = (eventType: string) => {
  switch (eventType.toLowerCase()) {
    case 'symptom':
      return <Activity className="h-4 w-4 text-blue-500" />;
    case 'diagnosis':
      return <Stethoscope className="h-4 w-4 text-emerald-500" />;
    case 'recording':
      return <Mic className="h-4 w-4 text-violet-500" />;
    case 'vital_sign':
      return <BarChart2 className="h-4 w-4 text-cyan-500" />;
    case 'medication':
      return <Pill className="h-4 w-4 text-purple-500" />;
    case 'procedure':
      return <Heart className="h-4 w-4 text-pink-500" />;
    case 'lab_result':
      return <FileText className="h-4 w-4 text-amber-500" />;
    case 'bleeding':
    case 'hemorrhage':
      return <Droplet className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

// Format details string to enhance readability
const formatDetails = (details: string): React.ReactNode => {
  if (!details) return null;
  
  // Capitalize first letter
  details = details.charAt(0).toUpperCase() + details.slice(1);
  
  // Handle parenthesized intensity/severity descriptions
  const intensityRegex = /\((.*?)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = intensityRegex.exec(details)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(details.substring(lastIndex, match.index));
    }
    
    // Add the intensity as a styled span
    parts.push(
      <span key={match.index} className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ml-1">
        {match[1]}
      </span>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < details.length) {
    parts.push(details.substring(lastIndex));
  }
  
  return parts.length ? parts : details;
};

// Convert timestamp to formatted date and time
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

// Get confidence color and label based on confidence value
export const getConfidenceInfo = (confidence: number) => {
  if (confidence >= 0.9) {
    return {
      color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
      label: "Alta"
    };
  }
  if (confidence >= 0.7) {
    return {
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      label: "Buena"
    };
  }
  if (confidence >= 0.5) {
    return {
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
      label: "Moderada"
    };
  }
  return {
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800",
    label: "Baja"
  };
};

// Get event category based on event type
const getEventCategory = (eventType: string): EventCategory => {
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

// Format first letter uppercase and rest lowercase
const toSentenceCase = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Translate event type to Spanish
const translateEventType = (eventType: string): string => {
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
      return toSentenceCase(eventType);
  }
};

// Main component
export default function ConsultationTimeline({ events, isCollapsed, onToggleCollapse }: ConsultationTimelineProps) {
  // State for filtering and expanding groups
  const [filter, setFilter] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    clinical_findings: true,
    diagnoses: true,
    recordings: true,
    procedures: true,
    treatments: true,
    other: true
  });
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Toggle event expansion
  const toggleEvent = (eventIndex: string) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventIndex]: !prev[eventIndex]
    }));
  };

  // Process and group events
  const processedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    // Sort events by timestamp (newest first)
    const sortedEvents = [...events].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Apply text filter if present
    const filteredEvents = filter 
      ? sortedEvents.filter(event => 
          event.description.toLowerCase().includes(filter.toLowerCase()) || 
          (event.details && event.details.toLowerCase().includes(filter.toLowerCase()))
        )
      : sortedEvents;
    
    // Process and enhance each event
    return filteredEvents.map((event, index) => {
      const { time, date, relative } = formatDateTime(event.timestamp);
      const category = getEventCategory(event.event_type);
      const translatedDescription = translateEventType(event.description);
      
      // Find related diagnoses (for symptoms) or symptoms (for diagnoses)
      let relatedEvents: ProcessedTimelineEvent[] = [];
      
      if (event.event_type.toLowerCase() === 'symptom') {
        // Find diagnoses that reference this symptom
        relatedEvents = events.filter(e => 
          e.event_type.toLowerCase() === 'diagnosis' && 
          e.metadata && 
          typeof e.metadata === 'object' &&
          e.metadata.supporting_evidence && 
          Array.isArray(e.metadata.supporting_evidence) &&
          e.metadata.supporting_evidence.some((evidence: string) => 
            event.details && evidence.toLowerCase().includes(event.details.toLowerCase().split('(')[0].trim())
          )
        ) as ProcessedTimelineEvent[];
      } else if (event.event_type.toLowerCase() === 'diagnosis') {
        // Find symptoms that are referenced by this diagnosis
        if (event.metadata && 
            typeof event.metadata === 'object' && 
            event.metadata.supporting_evidence && 
            Array.isArray(event.metadata.supporting_evidence)) {
          const evidenceList = event.metadata.supporting_evidence as string[];
          relatedEvents = events.filter(e => 
            e.event_type.toLowerCase() === 'symptom' && 
            evidenceList.some(evidence => 
              e.details && evidence.toLowerCase().includes(e.details.toLowerCase().split('(')[0].trim())
            )
          ) as ProcessedTimelineEvent[];
        }
      }
      
      return {
        ...event,
        time,
        date,
        relative,
        category,
        translatedDescription,
        index: `event-${index}`,
        relatedEvents: relatedEvents.length > 0 ? relatedEvents : undefined
      } as ProcessedTimelineEvent;
    });
  }, [events, filter]);

  // Group events by category
  const groupedEvents = useMemo(() => {
    if (!processedEvents || processedEvents.length === 0) return {};
    
    return processedEvents.reduce((groups, event) => {
      const { category } = event;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(event);
      return groups;
    }, {} as Record<string, ProcessedTimelineEvent[]>);
  }, [processedEvents]);

  // Get display name for category
  const getCategoryDisplayName = (category: string): string => {
    switch (category) {
      case 'clinical_findings': return 'Hallazgos Clínicos';
      case 'diagnoses': return 'Diagnósticos';
      case 'recordings': return 'Grabaciones';
      case 'procedures': return 'Procedimientos';
      case 'treatments': return 'Tratamientos';
      case 'other': return 'Otros Eventos';
      default: return toSentenceCase(category);
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'clinical_findings':
        return <Activity className="h-5 w-5 text-blue-500" />;
      case 'diagnoses':
        return <Stethoscope className="h-5 w-5 text-emerald-500" />;
      case 'recordings':
        return <Mic className="h-5 w-5 text-violet-500" />;
      case 'procedures':
        return <Heart className="h-5 w-5 text-pink-500" />;
      case 'treatments':
        return <Pill className="h-5 w-5 text-purple-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  if (!events || events.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <Clock className="h-5 w-5 text-blue-500 mr-2" />
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
        <>
          {/* Search filter */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
              placeholder="Filtrar eventos"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setFilter('')}
              >
                <FilterX className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Event Categories */}
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([category, categoryEvents]) => (
              <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Category Header */}
                <div 
                  className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                    category === 'clinical_findings' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                    category === 'diagnoses' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
                    category === 'recordings' ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' :
                    category === 'procedures' ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800' :
                    category === 'treatments' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' :
                    'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center">
                    {getCategoryIcon(category)}
                    <h4 className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {getCategoryDisplayName(category)}
                    </h4>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300">
                      {categoryEvents.length}
                    </span>
                  </div>
                  <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none">
                    {expandedCategories[category] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {/* Category Events */}
                {expandedCategories[category] && (
                  <div className="px-4 py-3 bg-white dark:bg-gray-800">
                    <div className="space-y-4">
                      {categoryEvents.map((event: ProcessedTimelineEvent) => {
                        const confidenceInfo = getConfidenceInfo(event.confidence);
                        const isExpanded = expandedEvents[event.index] || false;
                        const eventStatus = event.metadata?.status ? ` - ${event.metadata.status}` : '';
                        const relatedCount = event.relatedEvents?.length || 0;
                        
                        return (
                          <div 
                            key={event.index} 
                            className={`relative border rounded-lg transition-all ${
                              confidenceInfo.color.includes('border') ? 
                                confidenceInfo.color : 
                                `border-gray-200 dark:border-gray-700 ${confidenceInfo.color}`
                            } ${isExpanded ? 'shadow-md' : ''}`}
                          >
                            {/* Timeline marker (left side) */}
                            <div className="absolute left-4 top-4">
                              {getEventIcon(event.event_type)}
                            </div>

                            {/* Event content */}
                            <div className="pl-12 pr-4 py-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center">
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {event.translatedDescription}{eventStatus}
                                  </span>
                                  {relatedCount > 0 && (
                                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
                                      {relatedCount} relacionados
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {event.time}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${confidenceInfo.color}`}>
                                    {Math.round(event.confidence * 100)}% {confidenceInfo.label}
                                  </span>
                                  
                                  <button 
                                    onClick={() => toggleEvent(event.index)}
                                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                                  >
                                    {isExpanded ? 
                                      <ChevronUp className="h-4 w-4" /> : 
                                      <ChevronRight className="h-4 w-4" />
                                    }
                                  </button>
                                </div>
                              </div>

                              {/* Basic details (always visible) */}
                              {event.details && (
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                  {formatDetails(event.details)}
                                </div>
                              )}

                              {/* Expanded details */}
                              {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  {/* Timestamps */}
                                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                    <span>{event.date}</span>
                                    <span className="mx-1.5">•</span>
                                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                                    <span>{event.time}</span>
                                    {event.relative && (
                                      <>
                                        <span className="mx-1.5">•</span>
                                        <span>{event.relative}</span>
                                      </>
                                    )}
                                  </div>
                                  
                                  {/* Event type specific details */}
                                  {event.event_type.toLowerCase() === 'diagnosis' && event.metadata && (
                                    <div className="mt-2 space-y-2">
                                      {/* Diagnosis status */}
                                      {event.metadata.status && (
                                        <div className="flex items-center">
                                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-20">
                                            Estado:
                                          </span>
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            String(event.metadata.status).toLowerCase() === 'activa' ?
                                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                          }`}>
                                            {toSentenceCase(String(event.metadata.status))}
                                          </span>
                                        </div>
                                      )}
                                      
                                      {/* Supporting evidence */}
                                      {event.metadata.supporting_evidence && 
                                       Array.isArray(event.metadata.supporting_evidence) && 
                                       event.metadata.supporting_evidence.length > 0 && (
                                        <div className="mt-2">
                                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Evidencia de respaldo:
                                          </div>
                                          <div className="ml-2 space-y-1">
                                            {(event.metadata.supporting_evidence as string[]).map((evidence, i) => (
                                              <div key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start">
                                                <span className="text-blue-500 mr-1.5">•</span>
                                                <span>{toSentenceCase(evidence)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Recording specific details */}
                                  {event.event_type.toLowerCase() === 'recording' && event.metadata && (
                                    <div className="mt-2 flex items-center text-xs text-gray-700 dark:text-gray-300">
                                      <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">
                                        Duración:
                                      </span>
                                      <span>
                                        {event.metadata.duration 
                                          ? `${event.metadata.duration} segundos` 
                                          : 'Desconocida'}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Related events */}
                                  {event.relatedEvents && event.relatedEvents.length > 0 && (
                                    <div className="mt-3">
                                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        {event.event_type.toLowerCase() === 'symptom' 
                                          ? 'Diagnósticos relacionados:' 
                                          : 'Síntomas relacionados:'}
                                      </div>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {event.relatedEvents.map((relatedEvent: ProcessedTimelineEvent, idx: number) => (
                                          <div 
                                            key={idx}
                                            className={`text-xs px-2.5 py-1 rounded-md flex items-center
                                              ${event.event_type.toLowerCase() === 'symptom'
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                              }`}
                                          >
                                            {getEventIcon(relatedEvent.event_type)}
                                            <span className="ml-1.5">
                                              {relatedEvent.details 
                                                ? formatDetails(relatedEvent.details) 
                                                : relatedEvent.description}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}