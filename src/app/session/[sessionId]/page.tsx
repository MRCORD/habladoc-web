// src/app/session/[sessionId]/page.tsx - Refactored with the new design system
"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mic, Sparkles, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";

import { useSessionData } from "@/hooks/apiHooks";
import { useSessionStore } from "@/stores/sessionStore";
import { ErrorMessage } from "@/components/common/error-message";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RecordingsList } from "@/components/session/recordings/recordings-list";
import { PatientData } from "@/components/session/patient/patient-info";
import AnalysisDisplay from "@/components/session/analysis/analysis-display";
import { PatientDisplaySkeleton, AnalysisDisplaySkeleton } from "@/components/common/loading-skeletons";

import type { InsuranceInfo } from "@/types";

// Map session statuses to badge variants
const statusToBadgeVariant = {
  'scheduled': 'info',
  'in_progress': 'primary',
  'completed': 'success',
  'cancelled': 'secondary'
} as const;

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const [activeTab, setActiveTab] = useState("consultation");
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
  const audioRecorderHeight = 120;

  return (
    <>
      {/* Main content with bottom padding to prevent audio recorder overlap */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ paddingBottom: `${audioRecorderHeight}px` }}>
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push("/dashboard")}
              aria-label="Go back to dashboard"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              Sesión en Progreso
            </h1>
          </div>
          
          <Badge 
            variant={statusToBadgeVariant[sessionData.status] || 'default'} 
            size="lg"
            withDot={sessionData.status === 'in_progress'}
            dotColor={sessionData.status === 'in_progress' ? 'primary' : undefined}
          >
            {sessionData.status === 'scheduled' ? 'Programada' :
             sessionData.status === 'in_progress' ? 'En Progreso' :
             sessionData.status === 'completed' ? 'Completada' : 'Cancelada'}
          </Badge>
        </div>

        {/* Common container for Patient Data */}
        <div className="max-w-screen-lg mx-auto space-y-6">
          {/* Patient Data Component */}
          <Suspense fallback={<PatientDisplaySkeleton />}>
            <PatientData patientData={patientData} />
          </Suspense>

          {/* Card container */}
          <Card variant="default">
            <CardContent className="px-0 py-0">
              {/* Top nav tabs - Improved version */}
              <div className="bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-lg shadow-sm mb-6">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTab("consultation")}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all ${
                      activeTab === "consultation"
                        ? "bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm font-medium"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-white/50 dark:hover:bg-neutral-700/50"
                    }`}
                  >
                    <Mic size={18} />
                    <span>Consulta</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all ${
                      activeTab === "analysis"
                        ? "bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm font-medium"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-white/50 dark:hover:bg-neutral-700/50"
                    }`}
                  >
                    <Sparkles size={18} />
                    <span>Análisis en Vivo</span>
                  </button>
                </div>
              </div>

              {/* Conditional content based on active tab */}
              {activeTab === "consultation" ? (
                <div className="space-y-4">
                  {/* Consultation content */}
                  <div className="px-6 pt-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">Grabaciones</CardTitle>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleRefresh}
                        isLoading={isRefreshing}
                      >
                        <RefreshCw size={16} className="mr-2" />
                        {isRefreshing ? 'Actualizando' : 'Actualizar'}
                      </Button>
                    </div>
                  </div>
                  <CardContent className="px-6 pt-0">
                    <RecordingsList
                      recordings={recordings}
                      transcriptions={transcriptions}
                      clinicalAnalysis={clinicalAnalysis}
                      onError={(msg) => useSessionStore.setState({ error: msg })}
                      isLoading={isRefreshing}
                    />
                  </CardContent>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Analysis content */}
                  <div className="px-6 pt-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">Consulta médica mejorada</CardTitle>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleRefresh}
                        isLoading={isRefreshing}
                      >
                        <RefreshCw size={16} className="mr-2" />
                        {isRefreshing ? 'Actualizando' : 'Actualizar'}
                      </Button>
                    </div>
                  </div>
                  <CardContent className="px-6 pt-0">
                    <Suspense fallback={<AnalysisDisplaySkeleton />}>
                      {isRefreshing ? (
                        <AnalysisDisplaySkeleton />
                      ) : (
                        <AnalysisDisplay sessionId={sessionId} />
                      )}
                    </Suspense>
                  </CardContent>
                </div>
              )}
            </CardContent>
          </Card>
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