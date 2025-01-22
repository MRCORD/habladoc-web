// src/app/session/[sessionId]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSessionData } from '@/hooks/apiHooks';
import { useSessionStore } from '@/stores/sessionStore';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorMessage } from '@/components/common/error-message';
import { SessionStatusBadge } from '@/components/common/status-badges';
import AudioRecorder from '@/components/session/audio-recorder';
import { RecordingsList } from '@/components/session/recordings-list';
import { PatientData } from '@/components/session/patient-info';
import type { Patient, Recording, ApiRecording } from '@/types';
import { convertApiRecording } from '@/types';

interface PatientValidation {
  user: {
    first_name: string;
    last_name: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function isValidPatient(patient: unknown): patient is Patient {
  const validation = patient as PatientValidation;
  return Boolean(
    validation &&
    typeof validation.user === 'object' &&
    validation.user &&
    typeof validation.user.first_name === 'string' &&
    typeof validation.user.last_name === 'string'
  );
}

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const { 
    session: sessionData, 
    recordings: apiRecordings, 
    isLoading, 
    error,
  } = useSessionData(sessionId);

  if (!sessionId) {
    return <ErrorMessage message="Invalid session parameters" />;
  }

  const handleRecordingComplete = () => {
    useSessionStore.getState().fetchRecordings(sessionId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!sessionData || !isValidPatient(sessionData.patient)) {
    return null;
  }

  // Convert API recordings to frontend format
  const recordings: Recording[] = (apiRecordings as ApiRecording[]).map(convertApiRecording);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-black bg-transparent hover:bg-gray-200 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
              Sesión en Progreso
            </h1>
          </div>
          <div className="mt-2 sm:mt-0">
            <SessionStatusBadge status={sessionData.status} />
          </div>
        </div>

        {/* Common container for Patient Data and Recordings List */}
        <div className="max-w-screen-lg mx-auto space-y-6">
          {/* Patient Data Component */}
          <PatientData patient={sessionData.patient} />

          {/* Recordings List */}
          {recordings.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Grabaciones</h2>
              <RecordingsList 
                recordings={recordings}
                onError={(msg) => useSessionStore.setState({ error: msg })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom audio recorder */}
      <AudioRecorder 
        sessionId={sessionId}
        doctorId={sessionData.doctorId}
        onRecordingComplete={handleRecordingComplete}
      />
    </>
  );
}