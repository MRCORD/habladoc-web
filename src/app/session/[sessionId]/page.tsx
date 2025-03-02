"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mic, Sparkles, RefreshCw } from "lucide-react";
import { Tab } from "@headlessui/react";
import dynamic from "next/dynamic";

import { useSessionData } from "@/hooks/apiHooks";
import { useSessionStore } from "@/stores/sessionStore";
import { ErrorMessage } from "@/components/common/error-message";
import { SessionStatusBadge } from "@/components/common/status-badges";
import { RecordingsList } from "@/components/session/recordings/recordings-list";
import { PatientData } from "@/components/session/patient/patient-info";
import AnalysisDisplay from "@/components/session/analysis/analysis-display";
import { PatientDisplaySkeleton, AnalysisDisplaySkeleton } from "@/components/common/loading-skeletons";

import type { InsuranceInfo } from "@/types";

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const [activeTab, setActiveTab] = useState("consultation");
  
  // Add loading state for refresh
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    session: sessionData,
    recordings,
    transcriptions,
    clinicalAnalysis,
    isLoading,
    error,
    fetchSessionState,
  } = useSessionData(sessionId);

  if (!sessionId) {
    return <ErrorMessage message="Invalid session parameters" />;
  }

  const handleRecordingComplete = async () => {
    setIsRefreshing(true);
    try {
      // First fetch recordings to get the new recording
      await useSessionStore.getState().fetchRecordings(sessionId);
      // Then fetch session state to get transcriptions and analysis
      await useSessionStore.getState().fetchSessionState(sessionId);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Single refresh handler that can be called from any component
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchSessionState(sessionId);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (isLoading || !sessionData?.patient) {
    return <PatientDisplaySkeleton />;
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
    metadata: nullToUndefined(sessionData.patient.metadata),
  };

  const AudioRecorder = dynamic(
    () => import("@/components/session/recordings/audio-recorder"),
    { ssr: false }
  );

  // Calculate the height of the audio recorder - approximately 80px for standard, 160px with preview
  const audioRecorderHeight = 120; // A good average height considering both states

  return (
    <>
      {/* Main content with bottom padding to prevent audio recorder overlap */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ paddingBottom: `${audioRecorderHeight}px` }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 text-black dark:text-white bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
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
          <Tab.Group
            selectedIndex={activeTab === "consultation" ? 0 : 1}
            onChange={(index) =>
              setActiveTab(index === 0 ? "consultation" : "analysis")
            }
          >
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 dark:bg-blue-900/40 p-1">
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center gap-2
                 ${
                   selected
                     ? "bg-white dark:bg-gray-800 shadow text-blue-700 dark:text-blue-400"
                     : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                 }`
                }
              >
                <Mic className="h-4 w-4" />
                Consulta
              </Tab>
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center gap-2
                 ${
                   selected
                     ? "bg-white dark:bg-gray-800 shadow text-blue-700 dark:text-blue-400"
                     : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                 }`
                }
              >
                <Sparkles className="h-4 w-4" />
                Análisis en Vivo
              </Tab>
            </Tab.List>

            <Tab.Panels className="mt-4">
              <Tab.Panel className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Grabaciones
                    </h2>
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                    </button>
                  </div>
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <RecordingsList
                      recordings={recordings}
                      transcriptions={transcriptions}
                      clinicalAnalysis={clinicalAnalysis}
                      onError={(msg) => useSessionStore.setState({ error: msg })}
                      isLoading={isRefreshing}
                    />
                  </div>
                </div>
              </Tab.Panel>

              <Tab.Panel className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Consulta médica mejorada
                  </h2>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                  </button>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <Suspense fallback={<AnalysisDisplaySkeleton />}>
                    {isRefreshing ? (
                      <AnalysisDisplaySkeleton />
                    ) : (
                      <AnalysisDisplay 
                        sessionId={sessionId}
                        // No longer passing onRefresh - using outer button only
                      />
                    )}
                  </Suspense>
                </div>
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