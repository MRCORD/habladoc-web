// src/app/session/[sessionId]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSessionData } from '@/hooks/apiHooks';
import { useSessionStore } from '@/stores/sessionStore';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorMessage } from '@/components/common/error-message';
import { SessionStatusBadge } from '@/components/common/status-badges';
import AudioRecorder from '@/components/session/audio-recorder';
import { RecordingsList } from '@/components/session/recordings-list';
import { PatientData } from '@/components/session/patient-info';
import type { Patient } from '@/types';

function isValidPatient(patient: any): patient is Patient {
  return patient && 
    typeof patient.user === 'object' &&
    typeof patient.user.first_name === 'string' &&
    typeof patient.user.last_name === 'string';
}

export default function SessionPage() {
  const params = useParams();
  if (!params) {
    return <ErrorMessage message="Invalid session parameters" />;
  }
  const sessionId = params.sessionId as string;
  const router = useRouter();
  
  const { 
    session: sessionData, 
    recordings, 
    isLoading, 
    error,
    addRecording 
  } = useSessionData(sessionId);

  const handleRecordingComplete = () => {
    // Instead of reloading all data, we'll just fetch the new recordings
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
        doctorId={sessionData.doctor_id}
        onRecordingComplete={handleRecordingComplete}
      />
    </>
  );
}