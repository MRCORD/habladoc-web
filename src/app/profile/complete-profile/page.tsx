'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Search } from 'lucide-react';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorMessage } from '@/components/common/error-message';
import type { User, Specialty } from '@/types';

interface FormData {
  specialty_id: string;
  license_number: string;
  languages: string[];
  consultation_fee: string;
}

export default function CompleteProfile() {
  const router = useRouter();
  const { user: auth0User, isLoading: isAuth0Loading } = useUser();
  const [serverUser, setServerUser] = useState<User | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    specialty_id: '',
    license_number: '',
    languages: ['es'], // Spanish by default
    consultation_fee: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle clicking outside the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const userResponse = await api.post('/api/v1/users/auth/verify');
        if (userResponse.data.success) {
          setServerUser(userResponse.data.data);

          const specialtiesResponse = await api.get('/api/v1/specialties');
          if (specialtiesResponse.data.success) {
            setSpecialties(specialtiesResponse.data.data);
          } else {
            throw new Error(specialtiesResponse.data.message || 'Failed to load specialties');
          }
        } else {
          throw new Error(userResponse.data.message);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load required data');
      } finally {
        setIsLoading(false);
      }
    }

    if (auth0User) {
      loadData();
    }
  }, [auth0User]);

  const filteredSpecialties = specialties.filter((specialty) =>
    specialty.name.toLowerCase().includes(specialtySearch.toLowerCase())
  );

  const handleSpecialtySelect = (specialty: Specialty) => {
    setFormData({ ...formData, specialty_id: specialty.id });
    setSpecialtySearch(specialty.name);
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!serverUser) throw new Error('User data not found');

      const profileData = {
        user_id: serverUser.id,
        specialty_id: formData.specialty_id,
        license_number: formData.license_number,
        is_active: true,
        metadata: {
          languages: formData.languages,
          consultation_fee: formData.consultation_fee,
        },
      };

      const response = await api.post('/api/v1/doctors/profile', profileData);

      if (!response.data.success) throw new Error(response.data.message || 'Failed to create profile');

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create doctor profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuth0Loading || isLoading) return <LoadingSpinner />;
  if (!auth0User || !serverUser) return null;

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow sm:rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Completa tu perfil</h2>
          <p className="mt-2 text-sm text-gray-600">
            Proporciona tu información profesional para completar tu registro.
          </p>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Specialty */}
          <div className="relative" ref={dropdownRef}>
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-900">
              Especialidad Médica
            </label>
            <div className="mt-2 relative">
              <input
                type="text"
                id="specialty"
                value={specialtySearch}
                onChange={(e) => {
                  setSpecialtySearch(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
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
            <label htmlFor="license" className="block text-sm font-medium text-gray-900">
              Número de Licencia Médica
            </label>
            <input
              type="text"
              id="license"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              className="mt-2 block w-full rounded-md border py-2 text-black shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              required
            />
          </div>

          {/* Languages */}
          <div>
            <label htmlFor="languages" className="block text-sm font-medium text-gray-900">
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
            <label htmlFor="fee" className="block text-sm font-medium text-gray-900">
              Tarifa de Consulta (USD)
            </label>
            <input
              type="number"
              id="fee"
              value={formData.consultation_fee}
              onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
              className="mt-2 block w-full rounded-md border py-2 text-black shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-x-4">
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
              {isSubmitting ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}