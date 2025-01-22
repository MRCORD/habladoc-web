// src/components/session/recordings-list.tsx
import React from 'react';
import { format, isValid } from 'date-fns';
import { recordingsStorage } from '@/lib/recordings';
import type { Recording } from '@/types';

interface RecordingsListProps {
  recordings: Recording[];
  onError: (message: string) => void;
}

export const RecordingsList: React.FC<RecordingsListProps> = ({ recordings, onError }) => {
  const [recordingUrls, setRecordingUrls] = React.useState<Record<string, string>>({});

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

  return (
    <div className="space-y-4">
      {recordings.map((recording) => (
        <div
          key={recording.id}
          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {formatTime(recording.created_at)}
              </span>
              <span className="text-sm text-gray-500">
                {formatDuration(recording.duration)}
              </span>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              recording.status === 'processed' 
                ? 'bg-green-100 text-green-800'
                : recording.status === 'processing'
                ? 'bg-yellow-100 text-yellow-800'
                : recording.status === 'failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {recording.status.charAt(0).toUpperCase() + recording.status.slice(1)}
            </span>
          </div>
          
          {recordingUrls[recording.id] && (
            <audio
              controls
              className="w-full"
              src={recordingUrls[recording.id]}
            >
              Your browser does not support the audio element.
            </audio>
          )}
        </div>
      ))}
    </div>
  );
};