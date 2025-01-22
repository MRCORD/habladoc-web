// src/app/session/[sessionId]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useSessionData } from "@/hooks/apiHooks";
import { useSessionStore } from "@/stores/sessionStore";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ErrorMessage } from "@/components/common/error-message";
import { SessionStatusBadge } from "@/components/common/status-badges";
import AudioRecorder from "@/components/session/audio-recorder";
import { RecordingsList } from "@/components/session/recordings-list";
import { PatientData } from "@/components/session/patient-info";

import type { Recording, RecordingStatus } from "@/types";

interface ApiRecording {
  id: string;
  session_id: string;
  duration: number | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  status: RecordingStatus;
  metadata?: {
    sample_rate?: number;
    channels?: number;
    duration_seconds?: number;
    original_name?: string;
  };
  created_at: string;
  updated_at: string;
  is_processed: boolean;
}

function convertApiRecording(apiRec: ApiRecording): Recording {
  return {
    id: apiRec.id,
    session_id: apiRec.session_id,
    duration: apiRec.duration,
    file_path: apiRec.file_path,
    file_size: apiRec.file_size,
    mime_type: apiRec.mime_type,
    status: apiRec.status,
    metadata: apiRec.metadata,
    created_at: apiRec.created_at,
    updated_at: apiRec.updated_at,
    is_processed: apiRec.is_processed
  };
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

  if (!sessionData?.patient) {
    return null;
  }

  // Helper function to convert null to undefined
  const nullToUndefined = <T,>(value: T | null): T | undefined => 
    value === null ? undefined : value;

  // Pass the patient data directly, just converting nulls to undefined
  const patientData = {
    ...sessionData.patient,
    allergies: nullToUndefined(sessionData.patient.allergies),
    blood_type: nullToUndefined(sessionData.patient.blood_type),
    date_of_birth: nullToUndefined(sessionData.patient.date_of_birth),
    gender: nullToUndefined(sessionData.patient.gender),
    emergency_contact: nullToUndefined(sessionData.patient.emergency_contact),
    insurance_info: nullToUndefined(sessionData.patient.insurance_info),
    metadata: nullToUndefined(sessionData.patient.metadata)
  };

  // Ensure apiRecordings is an array and convert each recording
  const safeRecordings = Array.isArray(apiRecordings) ? apiRecordings as ApiRecording[] : [];
  const recordings = safeRecordings.map(convertApiRecording);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push("/dashboard")}
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
          <PatientData patientData={patientData} />

          {/* Recordings List */}
          {recordings.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Grabaciones
              </h2>
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