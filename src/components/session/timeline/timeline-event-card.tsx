// src/components/session/timeline-event-card.tsx
// Let's improve the existing timeline event card component

import React from 'react';
import { 
  Activity, 
  Stethoscope, 
  Mic, 
  Heart, 
  FileText, 
  Pill, 
  BarChart2, 
  Droplet,
  Clock,
  Calendar,
  ChevronDown,
  ChevronRight,
  Check
} from 'lucide-react';
import { TimelineEvent } from '@/contexts/timeline-context';

interface TimelineEventCardProps {
  event: TimelineEvent & {
    formattedDate?: string;
    formattedTime?: string;
    relativeTime?: string;
    relatedEvents?: TimelineEvent[];
  };
  isExpanded: boolean;
  onToggleExpand: () => void;
}

// Helper function to format details with intensity indicators
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

// Format first letter uppercase and rest lowercase
const toSentenceCase = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

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

// Get color based on event type for border and background
const getEventColor = (eventType: string): string => {
  switch (eventType.toLowerCase()) {
    case 'symptom':
      return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
    case 'diagnosis':
      return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20';
    case 'recording':
      return 'border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20';
    case 'vital_sign':
      return 'border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20';
    case 'medication':
      return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20';
    case 'procedure':
      return 'border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/20';
    case 'lab_result':
      return 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20';
    case 'bleeding':
    case 'hemorrhage':
      return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
    default:
      return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750';
  }
};

// Translate event type to Spanish display text
const translateEventType = (eventType: string): string => {
  switch (eventType.toLowerCase()) {
    case 'symptom':
      return 'Síntoma';
    case 'diagnosis':
      return 'Diagnóstico';
    case 'recording':
      return 'Grabación';
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

const TimelineEventCard: React.FC<TimelineEventCardProps> = ({ 
  event, 
  isExpanded, 
  onToggleExpand 
}) => {
  const statusDisplay = event.metadata?.status 
    ? ` - ${toSentenceCase(String(event.metadata.status))}` 
    : '';
  
  const relatedCount = event.relatedEvents?.length || 0;
  const eventColor = getEventColor(event.event_type);
  
  return (
    <div 
      className={`relative border rounded-lg transition-all ${eventColor} ${isExpanded ? 'shadow-md' : ''}`}
    >
      {/* Event content */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
              {translateEventType(event.event_type)}{statusDisplay}
              
              {/* Show occurrence count for symptoms that appear multiple times */}
              {event.event_type.toLowerCase() === 'symptom' && 
               typeof event.metadata?.occurrences === 'number' && 
               event.metadata.occurrences > 1 && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  reportado {event.metadata.occurrences}x
                </span>
              )}
            </span>
            
            {relatedCount > 0 && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
                {relatedCount} relacionados
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {event.formattedTime}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/30">
              {Math.round(event.confidence * 100)}%
            </span>
            
            <button 
              onClick={onToggleExpand}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            >
              {isExpanded ? 
                <ChevronDown className="h-4 w-4" /> : 
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
              <span>{event.formattedDate}</span>
              <span className="mx-1.5">•</span>
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              <span>{event.formattedTime}</span>
              {event.relativeTime && (
                <>
                  <span className="mx-1.5">•</span>
                  <span>{event.relativeTime}</span>
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
                    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${
                      String(event.metadata.status).toLowerCase() === 'activa' ?
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {String(event.metadata.status).toLowerCase() === 'activa' ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Activa
                        </>
                      ) : toSentenceCase(String(event.metadata.status))}
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
                      {event.metadata.supporting_evidence.map((evidence: string, i: number) => (
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
                  {event.relatedEvents.map((relatedEvent: TimelineEvent, idx: number) => (
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
                          : toSentenceCase(relatedEvent.description)}
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
};

export { getEventIcon, getEventColor };
export default TimelineEventCard;