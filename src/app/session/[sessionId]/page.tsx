// src/app/session/[sessionId]/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mic, Sparkles } from "lucide-react";
import { Tab } from '@headlessui/react';

import { useSessionData } from "@/hooks/apiHooks";
import { useSessionStore } from "@/stores/sessionStore";
import { ErrorMessage } from "@/components/common/error-message";
import { SessionStatusBadge } from "@/components/common/status-badges";
import AudioRecorder from "@/components/session/audio-recorder";
import { RecordingsList } from "@/components/session/recordings-list";
import { PatientData } from "@/components/session/patient-info";
import AnalysisDisplay from "@/components/session/analysis-display";
import { PatientDisplaySkeleton } from "@/components/common/loading-skeletons";
import { AnalysisDisplaySkeleton } from "@/components/common/loading-skeletons";

import type { InsuranceInfo } from "@/types";

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const [activeTab, setActiveTab] = useState('consultation');
  
  const {
    session: sessionData,
    recordings,
    isLoading,
    error,
  } = useSessionData(sessionId);

  if (!sessionId) {
    return <ErrorMessage message="Invalid session parameters" />;
  }

  const handleRecordingComplete = () => {
    useSessionStore.getState().fetchRecordings(sessionId);
    // Switch to analysis tab after recording
    setActiveTab('analysis');
  };

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!sessionData?.patient) {
    return null;
  }

  const nullToUndefined = <T,>(value: T | null): T | undefined =>
    value === null ? undefined : value;

  const insuranceInfo = sessionData.patient.insurance_info
    ? (sessionData.patient.insurance_info as InsuranceInfo)
    : undefined;

  const patientData = {
    id: sessionData.patient.id,
    user: sessionData.patient.user,
    allergies: nullToUndefined(sessionData.patient.allergies),
    blood_type: nullToUndefined(sessionData.patient.blood_type),
    date_of_birth: nullToUndefined(sessionData.patient.date_of_birth),
    gender: nullToUndefined(sessionData.patient.gender),
    emergency_contact: nullToUndefined(sessionData.patient.emergency_contact),
    insurance_info: insuranceInfo,
    metadata: nullToUndefined(sessionData.patient.metadata)
  };

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

        {/* Common container for Patient Data */}
        <div className="max-w-screen-lg mx-auto space-y-6">
          {/* Patient Data Component */}
          <Suspense fallback={<PatientDisplaySkeleton />}>
            <PatientData patientData={patientData} />
          </Suspense>

          {/* Tabs */}
          <Tab.Group selectedIndex={activeTab === 'consultation' ? 0 : 1} onChange={index => setActiveTab(index === 0 ? 'consultation' : 'analysis')}>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
              <Tab className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center gap-2
                 ${selected
                  ? 'bg-white shadow text-blue-700'
                  : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                }`
              }>
                <Mic className="h-4 w-4" />
                Consulta
              </Tab>
              <Tab className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center gap-2
                 ${selected
                  ? 'bg-white shadow text-blue-700'
                  : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                }`
              }>
                <Sparkles className="h-4 w-4" />
                Análisis en Vivo
              </Tab>
            </Tab.List>

            <Tab.Panels className="mt-6">
              <Tab.Panel className="space-y-4">
                {recordings.length > 0 && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Grabaciones
                    </h2>
                    <RecordingsList
                      recordings={recordings}
                      onError={(msg) => useSessionStore.setState({ error: msg })}
                    />
                  </div>
                )}
              </Tab.Panel>

              <Tab.Panel className="space-y-4">
                <Suspense fallback={<AnalysisDisplaySkeleton />}>
                  <AnalysisDisplay sessionId={sessionId} />
                </Suspense>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
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