'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorMessage } from '@/components/common/error-message';

interface DoctorProfile {
  id: string;
  user_id: string;
  specialty_id: string;
  license_number: string;
  is_active: boolean;
}

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
  const { user } = useUser();
  const [documentNumber, setDocumentNumber] = useState('');
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load doctor profile on mount
  useEffect(() => {
    const loadDoctorProfile = async () => {
      try {
        console.log('Loading doctor profile...');
        const response = await api.get('/api/v1/doctors/profile/me');
        console.log('Doctor profile response:', response.data);
        if (response.data.success) {
          setDoctorProfile(response.data.data);
        } else {
          setError('Failed to load doctor profile');
        }
      } catch (err: any) {
        console.error('Error loading doctor profile:', err);
        setError(err.response?.data?.message || 'Error loading doctor profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDoctorProfile();
    }
  }, [user]);

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

  const startSession = async () => {
    if (!patientData || !doctorProfile) {
      setError('Missing required data to start session');
      console.error('Missing data:', { patientData, doctorProfile });
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating session with data:', {
        doctor_id: doctorProfile.id,
        patient_id: patientData.profile.id
      });

      const response = await api.post('/api/v1/sessions', {
        doctor_id: doctorProfile.id,
        patient_id: patientData.profile.id,
        status: 'in_progress',
        session_type: 'standard', // Using the correct enum value from database
        scheduled_for: new Date().toISOString(),
        metadata: {
          started_immediately: true
        }
      });

      if (response.data.success) {
        // Updated route path to match the correct file structure
        router.push(`/session/${response.data.data.id}`);
      }
    } catch (err: any) {
      console.error('Error starting session:', err);
      setError(err.response?.data?.message || 'Error starting session');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while fetching doctor profile
  if (isLoading && !doctorProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error if doctor profile failed to load
  if (!doctorProfile && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage message="Failed to load doctor profile. Please try again later." />
      </div>
    );
  }

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
              onClick={startSession}
              disabled={isLoading}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {isLoading ? <LoadingSpinner /> : 'Iniciar Sesión'}
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