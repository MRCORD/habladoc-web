// app/dashboard/new-session/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { usePatientStore } from '@/stores/patientStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useInitialLoad } from '@/hooks/apiHooks';
import { ErrorMessage } from '@/components/common/error-message';
import { PatientDisplay } from '@/components/patient/patient-display';
import { CreatePatientForm } from '@/components/patient/create-patient-form';
import { NewSessionSkeleton } from '@/components/common/loading-skeletons';
import { SessionStatus, SessionType } from '@/types';

export default function NewSessionPage() {
  const router = useRouter();
  const [documentNumber, setDocumentNumber] = useState('');
  
  const { doctorProfile, isLoading: isUserLoading } = useUserStore();
  const { 
    patient, 
    isLoading: isPatientLoading, 
    error: patientError,
    showCreateForm,
    searchPatient,
    setShowCreateForm 
  } = usePatientStore();
  const { startSession, isLoading: isSessionLoading, error: sessionError } = useSessionStore();
  
  useInitialLoad();

  const handleSearch = () => {
    if (!documentNumber.trim()) {
      usePatientStore.setState({ error: 'Por favor ingrese un número de DNI' });
      return;
    }
    searchPatient(documentNumber);
  };

  const handleStartSession = async () => {
    if (!patient || !doctorProfile) {
      return;
    }

    const success = await startSession({
      doctor_id: doctorProfile.id,
      patient_id: patient.profile.id,
      status: SessionStatus.IN_PROGRESS,
      session_type: SessionType.STANDARD,
      scheduled_for: new Date().toISOString(),
      metadata: { started_immediately: true }
    });

    if (success) {
      router.push(`/session/${success}`);
    }
  };

  if (isUserLoading || (isPatientLoading && !patient)) {
    return <NewSessionSkeleton />;
  }

  if (!doctorProfile) {
    return <ErrorMessage message="Failed to load doctor profile" />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">Nueva Sesión</h1>
      </div>

      {/* Patient Search */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Buscar Paciente</h2>
        <div className="max-w-xl">
          <div className="flex gap-4">
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Ingrese número de DNI"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            />
            <button
              onClick={handleSearch}
              disabled={isPatientLoading}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {isPatientLoading ? (
                <div className="h-5 w-5 bg-white/20 rounded animate-pulse"></div>
              ) : (
                'Buscar'
              )}
            </button>
          </div>

          {patientError && <ErrorMessage message={patientError} />}
          {sessionError && <ErrorMessage message={sessionError} />}
        </div>
      </div>

      {/* Patient Data Display */}
      {patient && (
        <PatientDisplay 
          patient={patient} 
          onStartSession={handleStartSession}
          isLoading={isSessionLoading}
        />
      )}

      {/* Create Patient Form */}
      {showCreateForm && (
        <CreatePatientForm
          documentNumber={documentNumber}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}