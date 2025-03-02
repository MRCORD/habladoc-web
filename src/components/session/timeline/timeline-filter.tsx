import React from 'react';
import { 
  Filter, 
  Calendar, 
  Activity, 
  Stethoscope, 
  Mic, 
  BarChart2,
  X,
  SlidersHorizontal
} from 'lucide-react';

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
  { value: 'vital_sign', label: 'Signos Vitales', icon: <BarChart2 className="h-4 w-4" /> }
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
  const [isExpanded, setIsExpanded] = React.useState(false);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      searchText: e.target.value
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
    <div className="mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Filter header */}
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtros de cronología
          </span>
          {activeFilterCount > 0 && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
              {activeFilterCount} activos
            </span>
          )}
        </div>
        <SlidersHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </div>

      {/* Expanded filter options */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="space-y-4">
            {/* Event type filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipos de eventos
              </label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleEventTypeToggle(option.value)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm 
                      ${filters.eventTypes.includes(option.value) 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                      } border transition-colors`}
                  >
                    {option.icon}
                    <span className="ml-1.5">{option.label}</span>
                    {eventCounts[option.value] > 0 && (
                      <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-white/60 dark:bg-black/20 rounded-full">
                        {eventCounts[option.value]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence threshold */}
            <div>
              <label htmlFor="confidence" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nivel de confianza mínimo
              </label>
              <select
                id="confidence"
                value={filters.confidenceThreshold}
                onChange={handleConfidenceChange}
                className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rango de fechas
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <label htmlFor="date-start" className="text-xs text-gray-500 dark:text-gray-400">
                      Desde
                    </label>
                  </div>
                  <input
                    id="date-start"
                    type="date"
                    value={filters.dateRange.start || ''}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <label htmlFor="date-end" className="text-xs text-gray-500 dark:text-gray-400">
                      Hasta
                    </label>
                  </div>
                  <input
                    id="date-end"
                    type="date"
                    value={filters.dateRange.end || ''}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Text search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar en descripciones
              </label>
              <input
                id="search"
                type="text"
                placeholder="Buscar síntomas, diagnósticos..."
                value={filters.searchText}
                onChange={handleSearchChange}
                className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
              >
                <X className="h-4 w-4 mr-1.5" />
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineFilter;