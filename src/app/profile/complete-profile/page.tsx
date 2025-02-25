// src/app/profile/complete-profile/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import { useSpecialtyStore } from '@/stores/specialtyStore';
import { CompleteProfileSkeleton } from '@/components/common/loading-skeletons';
import { ErrorMessage } from '@/components/common/error-message';
import type { Specialty } from '@/types';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  document_number: string;
  specialty_id: string;
  license_number: string;
  languages: string[];
  consultation_fee: string;
}

export default function CompleteProfile() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    user, 
    completeProfile, 
    isLoading: isUserLoading, 
    error: userError 
  } = useUserStore();

  const { 
    specialties, 
    searchTerm, 
    isDropdownOpen,
    setSearchTerm,
    setDropdownOpen,
    fetchSpecialties 
  } = useSpecialtyStore();

  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    document_number: '',
    specialty_id: '',
    license_number: '',
    languages: ['es'],
    consultation_fee: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load specialties on mount
  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  // Populate user data if available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        document_number: user.document_number || '',
      }));
    }
  }, [user]);

  // Hide dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setDropdownOpen]);

  // Prevent showing 404 errors
  const filteredUserError =
    userError && userError !== 'Doctor profile not found' ? userError : null;

  const filteredSpecialties = specialties.filter((specialty) =>
    specialty.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSpecialtySelect = (specialty: Specialty) => {
    setFormData((prev) => ({ ...prev, specialty_id: specialty.id }));
    setSearchTerm(specialty.name);
    setDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Ensure specialty is selected
    if (!formData.specialty_id) {
      useUserStore.setState({ error: 'Por favor selecciona una especialidad médica' });
      setIsSubmitting(false);
      return;
    }

    const success = await completeProfile({
      ...formData,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      document_number: formData.document_number || undefined,
      consultation_fee: formData.consultation_fee
        ? parseFloat(formData.consultation_fee)
        : null,
    });

    if (success) {
      router.push('/profile');
    }

    setIsSubmitting(false);
  };

  if (isUserLoading) {
    return <CompleteProfileSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Completa tu perfil</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Proporciona tu información personal y profesional para completar tu registro.
          </p>
        </div>

        {/* Show error only if it's not a 404 */}
        {filteredUserError && <ErrorMessage message={filteredUserError} />}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Información Personal</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre
                </label>
                <input
                  type="text"
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
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
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
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
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor="document_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  DNI
                </label>
                <input
                  type="text"
                  id="document_number"
                  value={formData.document_number}
                  onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Información Profesional</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div ref={dropdownRef}>
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Especialidad Médica
                </label>
                <input
                  type="text"
                  id="specialty"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Buscar especialidad..."
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
                {isDropdownOpen && (
                  <div className="mt-2 absolute z-10 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md">
                    {filteredSpecialties.map((specialty) => (
                      <div
                        key={specialty.id}
                        onClick={() => handleSpecialtySelect(specialty)}
                        className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        {specialty.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="license" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Número de Licencia (CMP)
                </label>
                <input
                  type="text"
                  id="license"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label htmlFor="languages" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Idiomas
                </label>
                <div className="flex gap-4">
                  {['es', 'en'].map((lang) => (
                    <label key={lang} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={formData.languages.includes(lang)}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            languages: e.target.checked
                              ? [...prev.languages, lang]
                              : prev.languages.filter((l) => l !== lang),
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                      />
                      {lang === 'es' ? 'Español' : 'Inglés'}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="fee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tarifa de Consulta
                </label>
                <input
                  type="number"
                  id="fee"
                  value={formData.consultation_fee}
                  onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 px-3 py-2 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Completar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}