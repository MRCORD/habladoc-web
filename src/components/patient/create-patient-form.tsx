import { useState } from 'react';
import { usePatientStore } from '@/stores/patientStore';
import { ErrorMessage } from '@/components/common/error-message';
import { CreatePatientFormSkeleton } from '@/components/common/loading-skeletons';
import type { User, PatientProfile } from '@/types';
import { UserRole } from '@/types';

interface CreatePatientFormProps {
  documentNumber: string;
  onCancel: () => void;
}

interface PatientFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
}

export function CreatePatientForm({ documentNumber, onCancel }: CreatePatientFormProps) {
  const [formData, setFormData] = useState<PatientFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: ''
  });

  const { createPatient, isLoading, error } = usePatientStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const patientData = {
      user: {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        document_number: documentNumber,
        roles: [UserRole.PATIENT]
      } satisfies Partial<User>,
      profile: {
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        is_active: true
      } satisfies Partial<PatientProfile>
    };

    const success = await createPatient(patientData);
    if (success) {
      onCancel();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Crear Nuevo Paciente</h2>
      {error && <ErrorMessage message={error} />}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre
            </label>
            <input
              type="text"
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Apellido
            </label>
            <input
              type="text"
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              id="date_of_birth"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Género
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
          >
            {isLoading ? <CreatePatientFormSkeleton /> : 'Crear Paciente'}
          </button>
        </div>
      </form>
    </div>
  );
}