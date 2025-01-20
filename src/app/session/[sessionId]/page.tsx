// src/app/session/[sessionId]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorMessage } from '@/components/common/error-message';
import { SessionStatusBadge, type SessionStatus } from '@/components/common/status-badges';
import { use } from 'react';
import AudioRecorder from '@/components/session/audio-recorder';
import { RecordingsList } from '@/components/session/recordings-list';

interface SessionData {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: SessionStatus;
  session_type: string;
  scheduled_for: string;
  metadata: any;
}

interface Recording {
  id: string;
  file_path: string;
  duration: number;
  status: string;
  created_at: string;
}

export default function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      // Load session data
      const sessionResponse = await api.get(`/api/v1/sessions/${resolvedParams.sessionId}`);
      if (sessionResponse.data.success) {
        setSessionData(sessionResponse.data.data);
      }

      // Load recordings
      const recordingsResponse = await api.get(`/api/v1/recordings/session/${resolvedParams.sessionId}`);
      if (recordingsResponse.data.success) {
        setRecordings(recordingsResponse.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading session');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resolvedParams.sessionId]);

  const handleRecordingComplete = () => {
    // Reload data to get the new recording
    loadData();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!sessionData) {
    return null;
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-transparent hover:bg-gray-200 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver al Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sesión en Progreso</h1>
              {/* <p className="text-gray-500">ID: {sessionData.id}</p> */}
            </div>
            <SessionStatusBadge status={sessionData.status} />
          </div>
        </div>

        {/* (Optional) Recordings List */}
        {recordings.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Grabaciones</h2>
            <RecordingsList 
              recordings={recordings}
              onError={(msg) => setError(msg)}
            />
          </div>
        )}

        {/* Session Info */}
        <div className="bg-white shadow rounded-lg p-6 mb-24">
          {/* added `mb-24` so the fixed bottom recorder doesn't cover content */}
          <h2 className="text-lg font-medium text-gray-900 mb-4">Información de la Sesión</h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Tipo de Sesión</dt>
              <dd className="mt-1 text-sm text-gray-900">{sessionData.session_type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <SessionStatusBadge status={sessionData.status} />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha y Hora</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(sessionData.scheduled_for).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Fixed bottom audio recorder */}
      <AudioRecorder 
        sessionId={resolvedParams.sessionId}
        doctorId={sessionData.doctor_id}
        onRecordingComplete={handleRecordingComplete}
      />
    </>
  );
}