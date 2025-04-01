// src/components/session/recordings/recordings-list.tsx
import React, { useState, useCallback, useEffect } from 'react';
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
  Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Section } from '@/components/ui/section';
import { highlightEntitiesInText } from '@/utils/highlightEntities';
import { AttributeTag, toSentenceCase } from '@/components/common/attribute-tag';
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
  className?: string;
}

// Function to get status badge styling
const getStatusBadgeVariant = (status: AnalysisStatus | RecordingStatus) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'processing':
      return 'primary';
    case 'failed':
      return 'danger';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
};

export const RecordingsList: React.FC<RecordingsListProps> = ({ 
  recordings, 
  transcriptions = [], 
  clinicalAnalysis = {},
  onError,
  isLoading = false,
  className = ""
}) => {
  const [recordingUrls, setRecordingUrls] = useState<Record<string, string>>({});
  const [expandedRecordings, setExpandedRecordings] = useState<Record<string, boolean>>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // Audio elements refs
  const audioRefs = React.useRef<Record<string, HTMLAudioElement | null>>({});

  // Sort recordings by creation timestamp, newest first
  const sortedRecordings = React.useMemo(() => {
    return [...recordings].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [recordings]);

  // Reset recording URLs when recordings change to force re-fetching URLs
  useEffect(() => {
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
  useEffect(() => {
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
            <h5 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center">
              {type === 'symptom' ? (
                <>
                  <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                  Síntomas
                </>
              ) : type === 'condition' ? (
                <>
                  <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                  Condiciones
                </>
              ) : type === 'medication' ? (
                <>
                  <span className="w-2 h-2 bg-warning-500 rounded-full mr-2"></span>
                  Medicamentos
                </>
              ) : type === 'lab_result' ? (
                <>
                  <span className="w-2 h-2 bg-info-500 rounded-full mr-2"></span>
                  Resultados de Laboratorio
                </>
              ) : type === 'procedure' ? (
                <>
                  <span className="w-2 h-2 bg-violet-500 rounded-full mr-2"></span>
                  Procedimientos
                </>
              ) : type === 'past_medical_history' ? (
                <>
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                  Antecedentes Médicos
                </>
              ) : type === 'family_history' ? (
                <>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                  Antecedentes Familiares
                </>
              ) : type === 'vital_sign' ? (
                <>
                  <span className="w-2 h-2 bg-cyan-500 rounded-full mr-2"></span>
                  Signos Vitales
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-neutral-500 rounded-full mr-2"></span>
                  {toSentenceCase(type)}
                </>
              )}
            </h5>
            <div className="flex flex-wrap gap-2">
              {entities.map((entity, idx) => (
                <Badge
                  key={idx}
                  variant={type === 'symptom' ? 'primary' : 
                          type === 'condition' ? 'success' : 
                          type === 'medication' ? 'warning' :
                          type === 'lab_result' ? 'info' :
                          type === 'procedure' ? 'secondary' : 'default'}
                  className="cursor-pointer hover:opacity-90"
                  title={`Confianza: ${Math.round(entity.confidence * 100)}%`}
                >
                  {toSentenceCase(entity.name)}
                </Badge>
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
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                    <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                  </div>
                </div>
                <div className="h-6 w-24 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
              </div>
              <div className="mt-2 bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg">
                <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 w-full ${className}`}>
      {sortedRecordings.length === 0 ? (
        <Card className="border-dashed w-full">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800">
              <Headphones className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">No hay grabaciones</h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              Para comenzar, graba la consulta usando el botón de micrófono. El análisis comenzará automáticamente una vez finalices la grabación.
            </p>
            <div className="mt-4 inline-flex items-center text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Las grabaciones aparecerán aquí
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {sortedRecordings.map((recording) => {
            const isExpanded = expandedRecordings[recording.id];
            const transcription = getTranscriptionForRecording(recording.id);
            const analyses = clinicalAnalysis[recording.id] || [];
            const isPlaying = playingAudio === recording.id;

            // Get entities from analyses
            const allEntities = analyses.flatMap(analysis => analysis.content?.entities || []);
            
            return (
              <Card 
                key={recording.id}
                variant="default" 
                className="hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
              >
                {/* Recording Header */}
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpanded(recording.id)}
                        aria-label={isExpanded ? "Colapsar grabación" : "Expandir grabación"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                        )}
                      </Button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            Grabación {recordings.indexOf(recording) + 1}
                          </span>
                          <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(recording.duration)}
                          </div>
                          <div className="hidden sm:flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatTime(recording.created_at)} - {formatDate(recording.created_at)}
                          </div>
                        </div>
                        <div className="sm:hidden flex items-center text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatTime(recording.created_at)} - {formatDate(recording.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={getStatusBadgeVariant(recording.analysis_status)}
                        withDot={recording.analysis_status === 'processing'}
                        dotColor={recording.analysis_status === 'processing' ? 'primary' : undefined}
                      >
                        {recording.analysis_status === 'completed' ? 'Completado' : 
                         recording.analysis_status === 'processing' ? 'Procesando...' : 
                         recording.analysis_status === 'failed' ? 'Error' : 'Pendiente'}
                      </Badge>
                      
                      {recording.analysis_status === 'completed' && (
                        <div className="bg-success-100 dark:bg-success-900/30 p-1 rounded-full">
                          <Wand2 className="h-4 w-4 text-success-500 dark:text-success-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {recordingUrls[recording.id] && (
                    <div className="mt-3 flex items-center bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <Button
                        variant={isPlaying ? "danger" : "primary"}
                        size="sm"
                        className="mr-3 rounded-full h-10 w-10 p-0 shrink-0"
                        onClick={() => handlePlayPause(recording.id)}
                        aria-label={isPlaying ? "Pausar" : "Reproducir"}
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      
                      <div className="w-full min-w-0">
                        <audio
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
                    </div>
                  )}
                </CardContent>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-neutral-200 dark:border-neutral-700">
                    <CardContent className="p-6 bg-white dark:bg-neutral-800">
                      {/* Transcription Content */}
                      <Section
                        title="Transcripción"
                        icon={<FileText className="h-5 w-5 text-primary-500 dark:text-primary-400" />}
                        variant="flat"
                        isCollapsible={false}
                        className="mb-6"
                      >
                        <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                          {transcription ? (
                            <div className="text-sm text-neutral-900 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                              {highlightEntitiesInText(
                                transcription.content || 'No hay contenido disponible',
                                allEntities
                              )}
                            </div>
                          ) : recording.analysis_status === 'processing' ? (
                            <div className="flex items-center justify-center p-4">
                              <div className="animate-pulse flex items-center">
                                <div className="h-4 w-4 bg-primary-400 dark:bg-primary-600 rounded-full mr-2"></div>
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">Procesando transcripción...</span>
                              </div>
                            </div>
                          ) : recording.analysis_status === 'failed' ? (
                            <div className="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Error al procesar la grabación</span>
                            </div>
                          ) : (
                            <span className="text-sm text-neutral-500 dark:text-neutral-400 italic">
                              En espera de procesamiento...
                            </span>
                          )}
                        </div>
                      </Section>
                      
                      {/* Clinical Analysis Content */}
                      {analyses.length > 0 && (
                        <Section
                          title="Análisis Clínico"
                          icon={<Wand2 className="h-5 w-5 text-success-500 dark:text-success-400" />}
                          variant="flat"
                          isCollapsible={false}
                          className="border-t border-neutral-200 dark:border-neutral-700"
                        >
                          {analyses.map((analysis, index) => (
                            <div key={index} className="space-y-6">
                              {analysis.content?.entities && analysis.content.entities.length > 0 && (
                                <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                  {renderEntities(analysis.content.entities)}
                                </div>
                              )}
                              
                              {analysis.content?.relationships && analysis.content.relationships.length > 0 && (
                                <div className="space-y-4">
                                  <h5 className="text-sm sm:text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5 py-1">
                                    <Link2 className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                                    Relaciones Clínicas
                                  </h5>
                                  
                                  <div className="space-y-3">
                                    {analysis.content.relationships.map((rel, idx) => (
                                      <div 
                                        key={idx}
                                        className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700"
                                      >
                                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-1">
                                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-sm">
                                            <span className="font-medium text-neutral-900 dark:text-neutral-100 break-words">
                                              {toSentenceCase(rel.source)}
                                            </span>
                                            <AttributeTag
                                              label="Relationship"
                                              value={rel.type}
                                            />
                                            <span className="font-medium text-neutral-900 dark:text-neutral-100 break-words">
                                              {toSentenceCase(rel.target)}
                                            </span>
                                          </div>
                                          <Badge variant="default" size="sm" className="hidden sm:block text-[11px] sm:text-sm shrink-0 w-fit">
                                            {Math.round(rel.confidence * 100)}%
                                          </Badge>
                                        </div>
                                        
                                        {rel.evidence && (
                                          <p className="mt-2 text-[11px] sm:text-sm text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-md border border-neutral-200 dark:border-neutral-700 break-words">
                                            {rel.evidence}
                                          </p>
                                        )}
                                        
                                        <div className="mt-2 flex flex-wrap gap-1.5">
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
                        </Section>
                      )}
                    </CardContent>
                  </div>
                )}
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
};