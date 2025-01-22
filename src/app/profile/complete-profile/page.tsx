'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { useSpecialtyStore } from '@/stores/specialtyStore';
import { useInitialLoad } from '@/hooks/apiHooks';
import { LoadingSpinner } from '@/components/common/loading-spinner';
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
  
  // Get store data
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

  // Form state with type
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

  // Load initial data
  useInitialLoad();

  // Load specialties on mount
  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  // Update form when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        document_number: user.document_number || '',
      }));
    }
  }, [user]);

  // Handle clicking outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setDropdownOpen]);

  const filteredSpecialties = specialties.filter((specialty) =>
    specialty.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSpecialtySelect = (specialty: Specialty) => {
    setFormData(prev => ({ ...prev, specialty_id: specialty.id }));
    setSearchTerm(specialty.name);
    setDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    if (!formData.specialty_id) {
      useUserStore.setState({ error: 'Please select a specialty' });
      setIsSubmitting(false);
      return;
    }

    const success = await completeProfile({
      ...formData,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      document_number: formData.document_number || undefined,
      consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null
    });

    if (success) {
      router.push('/profile');
    }
    
    setIsSubmitting(false);
  };

  if (isUserLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow sm:rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Completa tu perfil</h2>
          <p className="mt-2 text-sm text-gray-600">
            Proporciona tu información personal y profesional para completar tu registro.
          </p>
        </div>

        {userError && <ErrorMessage message={userError} />}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Información Personal</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                  required
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
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                  required
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
                <label htmlFor="document_number" className="block text-sm font-medium text-gray-700">
                  Número de Documento
                </label>
                <input
                  type="text"
                  id="document_number"
                  value={formData.document_number}
                  onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Información Profesional</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Specialty Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
                  Especialidad Médica
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    id="specialty"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setDropdownOpen(true)}
                    placeholder="Buscar especialidad..."
                    className="block w-full rounded-md border py-2 pl-10 pr-4 text-black shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    required
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  {isDropdownOpen && filteredSpecialties.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                      {filteredSpecialties.map((specialty) => (
                        <div
                          key={specialty.id}
                          onClick={() => handleSpecialtySelect(specialty)}
                          className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {specialty.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* License Number */}
              <div>
                <label htmlFor="license" className="block text-sm font-medium text-gray-700">
                  Número de Licencia Médica
                </label>
                <input
                  type="text"
                  id="license"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  className="mt-1 block w-full rounded-md border py-2 text-black shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  required
                />
              </div>

              {/* Languages */}
              <div>
                <label htmlFor="languages" className="block text-sm font-medium text-gray-700">
                  Idiomas Hablados
                </label>
                <div className="mt-2 flex gap-x-4">
                  {['es', 'en'].map((lang) => (
                    <label key={lang} className="flex items-center text-sm">
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
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="ml-2">{lang === 'es' ? 'Español' : 'Inglés'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fee */}
              <div>
                <label htmlFor="fee" className="block text-sm font-medium text-gray-700">
                  Tarifa de Consulta (USD)
                </label>
                <input
                  type="number"
                  id="fee"
                  value={formData.consultation_fee}
                  onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                  className="mt-1 block w-full rounded-md border py-2 text-black shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {isSubmitting ? 'Guardando...' : 'Completar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}