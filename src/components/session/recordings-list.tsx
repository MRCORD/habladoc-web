// src/components/session/recordings-list.tsx
import React from 'react';
import { format, isValid } from 'date-fns';
import { recordingsStorage } from '@/lib/recordings';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AttributeTag, translations, type AttributeLabel, type EntityType } from '@/components/common/attribute-tag';
import { toSentenceCase, highlightEntitiesInText } from '@/utils/highlightEntities';
import type { Recording, RecordingStatus } from '@/types';

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
  spans: any[];
  attributes: Record<string, any>;
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
}

const statusToTranslationKey = (status: RecordingStatus | string): 'processing' | 'completed' | 'failed' | 'processed' => {
  switch (status) {
    case 'processing':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'processed':
      return 'processed';
    default:
      return 'processing';
  }
};

export const RecordingsList: React.FC<RecordingsListProps> = ({ 
  recordings, 
  transcriptions = [], 
  clinicalAnalysis = {},
  onError 
}) => {
  const [recordingUrls, setRecordingUrls] = React.useState<Record<string, string>>({});
  const [expandedRecordings, setExpandedRecordings] = React.useState<Record<string, boolean>>({});

  const getSignedUrl = React.useCallback(async (recording: Recording) => {
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

  React.useEffect(() => {
    recordings.forEach(recording => {
      if (!recordingUrls[recording.id] && recording.file_path) {
        getSignedUrl(recording);
      }
    });
  }, [recordings, recordingUrls, getSignedUrl]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return isValid(date) ? format(date, 'HH:mm:ss') : '---';
  };

  const formatDuration = (duration?: number | null) => {
    if (!duration) return '---';
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

  const renderClinicalContent = (analysis: ClinicalAnalysis) => {
    if (!analysis?.content) return null;
    
    return (
      <div className="space-y-6">
        {/* Display Entities */}
        {analysis.content.entities.length > 0 && (
          <div>
            <h5 className="text-lg font-bold text-gray-900 mb-4">
              {translations.entityTypes['Clinical Findings']}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.content.entities.map((entity, idx) => (
                <div 
                  key={idx} 
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {toSentenceCase(entity.name)}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {translations.entityTypes[entity.type as EntityType] || toSentenceCase(entity.type)}
                    </span>
                  </div>
                  {Object.entries(entity.attributes).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {Object.entries(entity.attributes).map(([key, value]) => (
                        <AttributeTag
                          key={key}
                          label={toSentenceCase(key) as AttributeLabel}
                          value={value as string}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Display Relationships */}
        {analysis.content.relationships.length > 0 && (
          <div className="mt-8">
            <h5 className="text-lg font-bold text-gray-900 mb-4">
              {translations.entityTypes['Clinical Relationships']}
            </h5>
            <div className="grid grid-cols-1 gap-4">
              {analysis.content.relationships.map((rel, idx) => (
                <div 
                  key={idx} 
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-medium text-gray-900">{toSentenceCase(rel.source)}</span>
                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                      {toSentenceCase(rel.type)}
                    </span>
                    <span className="font-medium text-gray-900">{toSentenceCase(rel.target)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded-md">
                    {rel.evidence}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rel.metadata.impact && (
                      <AttributeTag label="Impact" value={rel.metadata.impact} />
                    )}
                    {rel.metadata.severity && (
                      <AttributeTag label="Severity" value={rel.metadata.severity} />
                    )}
                    {rel.metadata.certainty && (
                      <AttributeTag label="Certainty" value={rel.metadata.certainty} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {recordings.map((recording) => {
        const isExpanded = expandedRecordings[recording.id];
        const transcription = getTranscriptionForRecording(recording.id);
        const analyses = clinicalAnalysis[recording.id] || [];
        
        return (
          <div
            key={recording.id}
            className="bg-white shadow-sm rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            {/* Recording Header */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleExpanded(recording.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Grabación {formatTime(recording.created_at)}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({formatDuration(recording.duration)})
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  recording.status === 'processed' 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : recording.status === 'processing'
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    : recording.status === 'failed'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-gray-50 text-gray-700 border border-gray-200'
                }`}>
                  {translations.status[statusToTranslationKey(recording.status)] || toSentenceCase(recording.status)}
                </span>
              </div>
              
              {recordingUrls[recording.id] && (
                <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <audio
                    controls
                    className="w-full"
                    src={recordingUrls[recording.id]}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-200">
                <div className="p-6 bg-white">
                  {/* Transcription Content */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900">Transcripción</h4>
                      {transcription && (
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                          transcription.status === 'completed'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : transcription.status === 'processing'
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : transcription.status === 'failed'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}>
                          {translations.status[statusToTranslationKey(transcription.status)] || toSentenceCase(transcription.status)}
                        </span>
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {transcription ? 
                        highlightEntitiesInText(
                          transcription.content || 'No hay contenido disponible',
                          analyses.flatMap(analysis => analysis.content?.entities || [])
                        )
                        : 'La grabación se está procesando...'
                      }
                    </div>
                  </div>
                  
                  {/* Clinical Analysis Content */}
                  {analyses.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      {analyses.map((analysis, index) => (
                        <div key={index}>
                          {renderClinicalContent(analysis)}
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
    </div>
  );
};