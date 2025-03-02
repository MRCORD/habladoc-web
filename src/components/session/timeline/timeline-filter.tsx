// src/components/session/timeline/timeline-filter.tsx
import React from 'react';
import { 
  Filter, 
  Calendar, 
  Activity, 
  Stethoscope, 
  Mic, 
  BarChart2,
  X,
  SlidersHorizontal,
  Pill,
  Heart,
  RefreshCw,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TimelineFilterProps {
  filters: TimelineFilters;
  onFilterChange: (filters: TimelineFilters) => void;
  eventCounts: Record<string, number>;
}

export interface TimelineFilters {
  eventTypes: string[];
  confidenceThreshold: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  searchText: string;
}

const EVENT_TYPE_OPTIONS = [
  { value: 'symptom', label: 'Síntomas', icon: <Activity className="h-4 w-4" /> },
  { value: 'diagnosis', label: 'Diagnósticos', icon: <Stethoscope className="h-4 w-4" /> },
  { value: 'recording', label: 'Grabaciones', icon: <Mic className="h-4 w-4" /> },
  { value: 'vital_sign', label: 'Signos Vitales', icon: <BarChart2 className="h-4 w-4" /> },
  { value: 'medication', label: 'Medicamentos', icon: <Pill className="h-4 w-4" /> },
  { value: 'procedure', label: 'Procedimientos', icon: <Heart className="h-4 w-4" /> }
];

const CONFIDENCE_OPTIONS = [
  { value: 0, label: 'Todos' },
  { value: 0.5, label: 'Moderada o superior (>50%)' },
  { value: 0.7, label: 'Buena o superior (>70%)' },
  { value: 0.9, label: 'Sólo alta confianza (>90%)' }
];

export const TimelineFilter: React.FC<TimelineFilterProps> = ({ 
  filters, 
  onFilterChange,
  eventCounts
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const handleEventTypeToggle = (eventType: string) => {
    const updatedTypes = filters.eventTypes.includes(eventType)
      ? filters.eventTypes.filter(type => type !== eventType)
      : [...filters.eventTypes, eventType];
    
    onFilterChange({
      ...filters,
      eventTypes: updatedTypes
    });
  };

  const handleConfidenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      confidenceThreshold: parseFloat(e.target.value)
    });
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    onFilterChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value || null
      }
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      eventTypes: [],
      confidenceThreshold: 0,
      dateRange: { start: null, end: null },
      searchText: ''
    });
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.eventTypes.length > 0) count++;
    if (filters.confidenceThreshold > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.searchText) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className="border-t-0 rounded-t-none">
      {/* Filter header */}
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-750 border-b border-neutral-200 dark:border-neutral-700"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <Filter className="h-4 w-4 text-neutral-500 dark:text-neutral-400 mr-2" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Filtros de cronología
          </span>
          {activeFilterCount > 0 && (
            <Badge variant="primary" size="sm" className="ml-2">
              {activeFilterCount} activos
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Expanded filter options */}
      {isExpanded && (
        <CardContent className="p-4 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="space-y-4">
            {/* Event type filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Tipos de eventos
              </label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPE_OPTIONS.map(option => (
                  <Button
                    key={option.value}
                    variant={filters.eventTypes.includes(option.value) ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleEventTypeToggle(option.value)}
                    className="gap-1.5"
                  >
                    {option.icon}
                    <span>{option.label}</span>
                    {eventCounts[option.value] > 0 && (
                      <Badge 
                        variant={filters.eventTypes.includes(option.value) ? "default" : "primary"}
                        size="sm"
                        className="ml-1 bg-white/60 dark:bg-black/20"
                      >
                        {eventCounts[option.value]}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Confidence threshold */}
            <div>
              <label htmlFor="confidence" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Nivel de confianza mínimo
              </label>
              <select
                id="confidence"
                value={filters.confidenceThreshold}
                onChange={handleConfidenceChange}
                className="block w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm text-sm text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                {CONFIDENCE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Rango de fechas
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-neutral-400 mr-2" />
                    <label htmlFor="date-start" className="text-xs text-neutral-500 dark:text-neutral-400">
                      Desde
                    </label>
                  </div>
                  <input
                    id="date-start"
                    type="date"
                    value={filters.dateRange.start || ''}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm text-sm text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-neutral-400 mr-2" />
                    <label htmlFor="date-end" className="text-xs text-neutral-500 dark:text-neutral-400">
                      Hasta
                    </label>
                  </div>
                  <input
                    id="date-end"
                    type="date"
                    value={filters.dateRange.end || ''}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm text-sm text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearFilters}
                className="gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                Reiniciar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default TimelineFilter;