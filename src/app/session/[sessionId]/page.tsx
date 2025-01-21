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
import { PatientData } from '@/components/session/patient-info';  // Import the PatientData component

interface User {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  document_number: string;
}

interface Patient {
  id: string;
  date_of_birth: string;
  gender: string;
  blood_type: string;
  allergies: any;
  emergency_contact: string | null;
  insurance_info: any;
  metadata: any;
  user: User;
}

interface SessionData {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: SessionStatus;
  session_type: string;
  scheduled_for: string;
  metadata: any;
  patient: Patient;
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
          {/* Patient Data Component placed under the heading */}
          <PatientData patient={sessionData.patient} />

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