// src/app/session/[sessionId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, StopCircle, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorMessage } from '@/components/common/error-message';
import { SessionStatusBadge, RecordingStatusBadge, type SessionStatus, type RecordingStatus } from '@/components/common/status-badges';
import { use } from 'react';

interface SessionData {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: SessionStatus;
  session_type: string;
  scheduled_for: string;
  metadata: any;
}

interface RecordingState {
  status: RecordingStatus;
  duration: number;
}

export default function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [recording, setRecording] = useState<RecordingState>({
    status: 'pending',
    duration: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await api.get(`/api/v1/sessions/${resolvedParams.sessionId}`);
        if (response.data.success) {
          setSessionData(response.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error loading session');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [resolvedParams.sessionId]);

  const startRecording = async () => {
    try {
      setRecording({ status: 'recording', duration: 0 });
      // TODO: Implement actual recording logic
    } catch (err: any) {
      setError('Error starting recording');
      setRecording(prev => ({ ...prev, status: 'failed' }));
    }
  };

  const stopRecording = async () => {
    try {
      setRecording(prev => ({ ...prev, status: 'processing' }));
      // TODO: Implement stop recording and save logic
      setTimeout(() => {
        setRecording(prev => ({ ...prev, status: 'completed' }));
      }, 2000); // Simulate processing
    } catch (err: any) {
      setError('Error stopping recording');
      setRecording(prev => ({ ...prev, status: 'failed' }));
    }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <p className="text-gray-500">ID: {sessionData.id}</p>
          </div>
          <SessionStatusBadge status={sessionData.status} />
        </div>
      </div>

      {/* Recording Controls */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium text-gray-900">Grabación</h2>
            <RecordingStatusBadge status={recording.status} />
          </div>
          <div className="space-x-4">
            {recording.status === 'pending' && (
              <button
                onClick={startRecording}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
              >
                <Mic className="h-5 w-5 mr-2" />
                Iniciar Grabación
              </button>
            )}
            {recording.status === 'recording' && (
              <button
                onClick={stopRecording}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                <StopCircle className="h-5 w-5 mr-2" />
                Detener Grabación
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div className="bg-white shadow rounded-lg p-6">
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
  );
}