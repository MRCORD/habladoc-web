// src/app/dashboard/new-session/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorMessage } from '@/components/common/error-message';

interface PatientData {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    document_number: string;
  };
  profile: {
    id: string;
    date_of_birth: string | null;
    gender: string | null;
    blood_type: string | null;
  };
}

export default function NewSessionPage() {
  const router = useRouter();
  const [documentNumber, setDocumentNumber] = useState('');
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const searchPatient = async () => {
    if (!documentNumber.trim()) {
      setError('Por favor ingrese un número de documento');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/v1/patients/search?document_number=${documentNumber}`);
      if (response.data.success) {
        setPatientData(response.data.data);
        setShowCreateForm(false);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setShowCreateForm(true);
        setPatientData(null);
      } else {
        setError(err.response?.data?.message || 'Error buscando paciente');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              placeholder="Ingrese número de documento"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            />
            <button
              onClick={searchPatient}
              disabled={isLoading}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {isLoading ? <LoadingSpinner /> : 'Buscar'}
            </button>
          </div>

          {error && <ErrorMessage message={error} />}
        </div>
      </div>

      {/* Patient Data Display */}
      {patientData && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Datos del Paciente</h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nombre</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {patientData.user.first_name} {patientData.user.last_name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Documento</dt>
              <dd className="mt-1 text-sm text-gray-900">{patientData.user.document_number}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{patientData.user.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
              <dd className="mt-1 text-sm text-gray-900">{patientData.user.phone || '-'}</dd>
            </div>
            {patientData.profile?.date_of_birth && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Nacimiento</dt>
                <dd className="mt-1 text-sm text-gray-900">{patientData.profile.date_of_birth}</dd>
              </div>
            )}
            {patientData.profile?.gender && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Género</dt>
                <dd className="mt-1 text-sm text-gray-900">{patientData.profile.gender}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6">
            <button
              onClick={() => {/* Handle continue to session */}}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Continuar con la Sesión
            </button>
          </div>
        </div>
      )}

      {/* Create New Patient Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Paciente</h2>
          <CreatePatientForm
            documentNumber={documentNumber}
            onSuccess={(data) => {
              setPatientData(data);
              setShowCreateForm(false);
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}
    </div>
  );
}

// Create Patient Form Component
function CreatePatientForm({
  documentNumber,
  onSuccess,
  onCancel
}: {
  documentNumber: string;
  onSuccess: (data: PatientData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/v1/patients', {
        user: {
          ...formData,
          document_number: documentNumber,
        },
        profile: {
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
        },
      });

      if (response.data.success) {
        onSuccess(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creando paciente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <input
            type="text"
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
            Apellido
          </label>
          <input
            type="text"
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Teléfono
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
            Fecha de Nacimiento
          </label>
          <input
            type="date"
            id="date_of_birth"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
            Género
          </label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
          >
            <option value="">Seleccionar...</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="other">Otro</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {isLoading ? <LoadingSpinner /> : 'Crear Paciente'}
        </button>
      </div>
    </form>
  );
}