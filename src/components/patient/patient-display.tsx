// src/components/patient/patient-display.tsx
import { Patient } from '@/types';
import { LoadingSpinner } from '@/components/common/loading-spinner';

interface PatientDisplayProps {
  patient: Patient;
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
      {patient.allergies?.conditions?.length > 0 && (
        <div className="mt-4">
          <dt className="text-sm font-medium text-gray-500">Alergias</dt>
          <dd className="mt-1">
            <ul className="flex flex-wrap gap-2">
              {patient.allergies.conditions.map((allergy, index) => (
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
          className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {isLoading ? <LoadingSpinner /> : 'Iniciar Sesión'}
        </button>
      </div>
    </div>
  );
}