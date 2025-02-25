// src/components/session/recordings-list.tsx
import React, { useState, useCallback } from 'react';
import { format, isValid } from 'date-fns';
import { recordingsStorage } from '@/lib/recordings';
import { 
  ChevronDown, 
  ChevronRight, 
  Play, 
  Pause, 
  Headphones, 
  FileText, 
  AlertTriangle,
  Clock,
  Calendar,
  Wand2,
  RefreshCw
} from 'lucide-react';
import { AttributeTag, translations, toSentenceCase } from '@/components/common/attribute-tag';
import { highlightEntitiesInText } from '@/utils/highlightEntities';
import type { Recording, RecordingStatus, AnalysisStatus } from '@/types';

interface Transcription {
  id: string;
  recording_id: string;
  content: string;
  is_interim: boolean;
  status: string;
  language?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
}

interface Entity {
  name: string;
  type: string;
  spans: Array<{ start: number; end: number; text: string }>;
  attributes: Record<string, string | number>;
  confidence: number;
}

interface Relationship {
  type: string;
  source: string;
  target: string;
  evidence: string;
  metadata: {
    impact: string;
    severity: string;
    certainty: string;
    direction: string;
    temporality: string;
    clinical_significance: string;
    confidence: number;
  };
  confidence: number;
}

interface ClinicalAnalysis {
  id: string;
  content: {
    text: string;
    version: string;
    entities: Entity[];
    relationships: Relationship[];
    language: string;
    confidence: number;
  };
  confidence: number;
  created_at: string;
  session_id: string;
  updated_at: string;
  recording_id: string;
  analysis_type: string;
}

interface RecordingsListProps {
  recordings: Recording[];
  transcriptions?: Transcription[];
  clinicalAnalysis?: Record<string, ClinicalAnalysis[]>;
  onError: (message: string) => void;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  className?: string;
}

// Function to get status badge styling
const getStatusBadge = (status: AnalysisStatus | RecordingStatus) => {
  switch (status) {
    case 'completed':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
    case 'processing':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    case 'failed':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
    case 'pending':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
};

export const RecordingsList: React.FC<RecordingsListProps> = ({ 
  recordings, 
  transcriptions = [], 
  clinicalAnalysis = {},
  onError,
  isLoading = false,
  onRefresh,
  className = ""
}) => {
  const [recordingUrls, setRecordingUrls] = useState<Record<string, string>>({});
  const [expandedRecordings, setExpandedRecordings] = useState<Record<string, boolean>>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Audio elements refs
  const audioRefs = React.useRef<Record<string, HTMLAudioElement | null>>({});

  // Sort recordings by creation timestamp, newest first
  const sortedRecordings = React.useMemo(() => {
    return [...recordings].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [recordings]);

  // Reset recording URLs when recordings change to force re-fetching URLs
  React.useEffect(() => {
    setRecordingUrls({});
  }, [recordings]);

  const getSignedUrl = useCallback(async (recording: Recording) => {
    try {
      if (!recording.file_path) {
        throw new Error('Recording file path is missing');
      }

      const { signedUrl, error } = await recordingsStorage.getUrl(recording.file_path);
      if (error) throw error;
      
      if (signedUrl) {
        setRecordingUrls(prev => ({
          ...prev,
          [recording.id]: signedUrl
        }));
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error getting recording URL';
      onError(errorMessage);
    }
  }, [onError]);

  // Fetch URLs whenever recordings change or recordingUrls is reset
  React.useEffect(() => {
    sortedRecordings.forEach(recording => {
      if (!recordingUrls[recording.id] && recording.file_path) {
        getSignedUrl(recording);
      }
    });
  }, [sortedRecordings, recordingUrls, getSignedUrl]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return isValid(date) ? format(date, 'HH:mm:ss') : '---';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return isValid(date) ? format(date, 'dd MMM yyyy') : '---';
  };

  const formatDuration = (duration?: number | null) => {
    if (!duration) return '0:00';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleExpanded = (recordingId: string) => {
    setExpandedRecordings(prev => ({
      ...prev,
      [recordingId]: !prev[recordingId]
    }));
  };

  const getTranscriptionForRecording = (recordingId: string) => {
    return transcriptions.find(t => t.recording_id === recordingId);
  };

  const handlePlayPause = (recordingId: string) => {
    // Get audio element
    const audioElement = audioRefs.current[recordingId];
    if (!audioElement) return;

    if (playingAudio === recordingId) {
      // This audio is currently playing - pause it
      audioElement.pause();
      setPlayingAudio(null);
    } else {
      // Pause any currently playing audio
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio]?.pause();
      }
      
      // Play the new audio
      audioElement.play()
        .catch(error => {
          console.error('Error playing audio:', error);
          onError('Error al reproducir el audio');
        });
      setPlayingAudio(recordingId);
    }
  };

  // Handle audio end event
  const handleAudioEnd = (recordingId: string) => {
    if (playingAudio === recordingId) {
      setPlayingAudio(null);
    }
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Component to render the analysis entities in a clean format
  const renderEntities = (entities: Entity[]) => {
    if (entities.length === 0) return null;
    
    // Group entities by type
    const groupedEntities = entities.reduce((acc, entity) => {
      const type = entity.type || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(entity);
      return acc;
    }, {} as Record<string, Entity[]>);

    return (
      <div className="space-y-4">
        {Object.entries(groupedEntities).map(([type, entities]) => (
          <div key={type} className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              {type === 'symptom' ? (
                <>
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Síntomas
                </>
              ) : type === 'condition' ? (
                <>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                  Condiciones
                </>
              ) : type === 'medication' ? (
                <>
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Medicamentos
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  {toSentenceCase(type)}
                </>
              )}
            </h5>
            <div className="flex flex-wrap gap-2">
              {entities.map((entity, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center px-3 py-1 text-sm rounded-lg 
                    bg-gray-50 text-gray-800 border border-gray-200 
                    dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600
                    hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  title={`Confianza: ${Math.round(entity.confidence * 100)}%`}
                >
                  {toSentenceCase(entity.name)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {[1, 2].map((index) => (
          <div key={index} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
            </div>
            <div className="mt-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {sortedRecordings.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800">
            <Headphones className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-gray-100">No hay grabaciones</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Graba la consulta para comenzar el proceso de análisis.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Grabaciones de la sesión
              </h3>
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {sortedRecordings.length}
              </span>
            </div>
            
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 
                  bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 
                  rounded-md border border-gray-300 dark:border-gray-600 
                  transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            )}
          </div>
          
          {sortedRecordings.map((recording) => {
            const isExpanded = expandedRecordings[recording.id];
            const transcription = getTranscriptionForRecording(recording.id);
            const analyses = clinicalAnalysis[recording.id] || [];
            const isPlaying = playingAudio === recording.id;

            // Get entities from analyses
            const allEntities = analyses.flatMap(analysis => analysis.content?.entities || []);
            
            return (
              <div
                key={recording.id}
                className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors overflow-hidden"
              >
                {/* Recording Header */}
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleExpanded(recording.id)}
                        className="p-1.5 mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        aria-label={isExpanded ? "Colapsar grabación" : "Expandir grabación"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Grabación {recordings.indexOf(recording) + 1}
                          </span>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(recording.duration)}
                          </div>
                          <div className="hidden sm:flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatTime(recording.created_at)} - {formatDate(recording.created_at)}
                          </div>
                        </div>
                        <div className="sm:hidden flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatTime(recording.created_at)} - {formatDate(recording.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(recording.analysis_status)}`}>
                        {recording.analysis_status === 'completed' ? 'Completado' : 
                         recording.analysis_status === 'processing' ? 'Procesando...' : 
                         recording.analysis_status === 'failed' ? 'Error' : 'Pendiente'}
                        
                        {recording.analysis_status === 'processing' && (
                          <span className="ml-1.5 h-2 w-2 bg-blue-400 dark:bg-blue-500 rounded-full inline-block animate-pulse"></span>
                        )}
                      </span>
                      
                      {recording.analysis_status === 'completed' && (
                        <div className="bg-green-50 dark:bg-green-900/30 p-1 rounded-full">
                          <Wand2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {recordingUrls[recording.id] && (
                    <div className="mt-3 flex items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => handlePlayPause(recording.id)}
                        className={`p-2 rounded-full mr-3 ${
                          isPlaying ? 
                            'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50' : 
                            'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
                        }`}
                        aria-label={isPlaying ? "Pausar" : "Reproducir"}
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </button>
                      
                      <audio
                        // Use a callback ref instead of a direct ref assignment
                        ref={(el) => { audioRefs.current[recording.id] = el; }}
                        src={recordingUrls[recording.id]}
                        className="w-full h-8"
                        controls
                        controlsList="nodownload noplaybackrate"
                        onEnded={() => handleAudioEnd(recording.id)}
                        onError={() => onError("Error al reproducir la grabación")}
                        onPlay={() => setPlayingAudio(recording.id)}
                        onPause={() => setPlayingAudio(null)}
                      >
                        Tu navegador no soporta el elemento de audio.
                      </audio>
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="p-6 bg-white dark:bg-gray-800">
                      {/* Transcription Content */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Transcripción</h4>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                          {transcription ? (
                            <div className="text-sm text-gray-900 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                              {highlightEntitiesInText(
                                transcription.content || 'No hay contenido disponible',
                                allEntities
                              )}
                            </div>
                          ) : recording.analysis_status === 'processing' ? (
                            <div className="flex items-center justify-center p-4">
                              <div className="animate-pulse flex items-center">
                                <div className="h-4 w-4 bg-blue-400 dark:bg-blue-600 rounded-full mr-2"></div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Procesando transcripción...</span>
                              </div>
                            </div>
                          ) : recording.analysis_status === 'failed' ? (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Error al procesar la grabación</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                              En espera de procesamiento...
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Clinical Analysis Content */}
                      {analyses.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-4">
                            <Wand2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Análisis Clínico</h4>
                          </div>
                          
                          {analyses.map((analysis, index) => (
                            <div key={index} className="space-y-6">
                              {analysis.content?.entities && analysis.content.entities.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                  {renderEntities(analysis.content.entities)}
                                </div>
                              )}
                              
                              {analysis.content?.relationships && analysis.content.relationships.length > 0 && (
                                <div className="space-y-3">
                                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Relaciones Clínicas
                                  </h5>
                                  
                                  <div className="space-y-3">
                                    {analysis.content.relationships.map((rel, idx) => (
                                      <div 
                                        key={idx}
                                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                      >
                                        <div className="flex items-baseline justify-between mb-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                              {toSentenceCase(rel.source)}
                                            </span>
                                            <AttributeTag
                                              label="Relationship"
                                              value={rel.type}
                                            />
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                              {toSentenceCase(rel.target)}
                                            </span>
                                          </div>
                                          <span className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                                            {Math.round(rel.confidence * 100)}%
                                          </span>
                                        </div>
                                        
                                        {rel.evidence && (
                                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700">
                                            {rel.evidence}
                                          </p>
                                        )}
                                        
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {Object.entries(rel.metadata)
                                            .filter(([key, value]) => 
                                              value && 
                                              typeof value === 'string' && 
                                              !['direction', 'confidence'].includes(key)
                                            )
                                            .map(([key, value]) => (
                                              <AttributeTag
                                                key={key}
                                                label={key === 'clinical_significance' ? 'Context' :
                                                       key === 'temporality' ? 'Duration' :
                                                       toSentenceCase(key)}
                                                value={value as string}
                                              />
                                            ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};