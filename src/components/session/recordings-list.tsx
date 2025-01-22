// src/components/session/recordings-list.tsx
import React from 'react';
import { recordingsStorage } from '@/lib/recordings';
import { Recording } from '@/types';

interface RecordingsListProps {
  recordings: Recording[];
  onError: (error: string) => void;
}

export const RecordingsList: React.FC<RecordingsListProps> = ({ recordings, onError }) => {
  const [recordingUrls, setRecordingUrls] = React.useState<Record<string, string>>({});

  const getSignedUrl = React.useCallback(async (recording: Recording) => {
    try {
      const { signedUrl, error } = await recordingsStorage.getUrl(recording.filePath);
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
      if (!recordingUrls[recording.id]) {
        getSignedUrl(recording);
      }
    });
  }, [recordings, recordingUrls, getSignedUrl]);

  return (
    <div className="space-y-4">
      {recordings.map((recording) => (
        <div
          key={recording.id}
          className="border rounded-lg p-4 hover:bg-gray-50"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {new Date(recording.createdAt).toLocaleTimeString()}
              </span>
              <span className="text-sm text-gray-500">
                {recording.duration ? 
                  `${Math.floor(recording.duration / 60)}:${(recording.duration % 60)
                    .toString()
                    .padStart(2, '0')}` 
                  : '---'}
              </span>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              recording.status === 'processed' 
                ? 'bg-green-100 text-green-800'
                : recording.status === 'processing'
                ? 'bg-yellow-100 text-yellow-800'
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