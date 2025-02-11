// src/components/patient/patient-display.tsx
import type { User, PatientProfile, AllergyCondition } from '@/types';
import { PatientActionsSkeleton } from '@/components/common/loading-skeletons';

interface PatientDisplayProps {
  patient: {
    user: User;
    profile: PatientProfile;
  };
  onStartSession: () => void;
  isLoading: boolean;
}

export function PatientDisplay({ patient, onStartSession, isLoading }: PatientDisplayProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Datos del Paciente</h2>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-gray-500">Nombre</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {patient.user.first_name} {patient.user.last_name}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Documento</dt>
          <dd className="mt-1 text-sm text-gray-900">{patient.user.document_number || '-'}</dd>
        </div>
        {patient.user.email && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{patient.user.email}</dd>
          </div>
        )}
        {patient.user.phone && (
          <div>
            <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
            <dd className="mt-1 text-sm text-gray-900">{patient.user.phone}</dd>
          </div>
        )}
      </dl>
      
      {/* Allergies */}
      {patient.profile.allergies && patient.profile.allergies.conditions?.length > 0 && (
        <div className="mt-4">
          <dt className="text-sm font-medium text-gray-500">Alergias</dt>
          <dd className="mt-1">
            <ul className="flex flex-wrap gap-2">
              {patient.profile.allergies.conditions.map((allergy: string | AllergyCondition, index: number) => (
                <li
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                >
                  {typeof allergy === 'string' ? allergy : allergy.name}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      )}
      
      <div className="mt-6">
        <button
          onClick={onStartSession}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
        >
          {isLoading ? <PatientActionsSkeleton /> : 'Iniciar Sesión'}
        </button>
      </div>
    </div>
  );
}