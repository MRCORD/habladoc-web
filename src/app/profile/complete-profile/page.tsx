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
    consultation_fee: ''
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
        if (err instanceof Error) {
          setError(err.message || 'Failed to load required data');
        } else {
          setError('Failed to load required data');
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (auth0User) {
      loadData();
    }
  }, [auth0User]);

  const filteredSpecialties = specialties.filter(specialty =>
    specialty.name.toLowerCase().includes(specialtySearch.toLowerCase())
  );

  const handleSpecialtySelect = (specialty: Specialty) => {
    setFormData({ ...formData, specialty_id: specialty.id });
    setSpecialtySearch(specialty.name);
    setIsDropdownOpen(false);
  };

  const selectedSpecialty = specialties.find(s => s.id === formData.specialty_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!serverUser) {
        throw new Error('User data not found');
      }

      const profileData = {
        user_id: serverUser.id,
        specialty_id: formData.specialty_id,
        license_number: formData.license_number,
        is_active: true,
        metadata: {
          languages: formData.languages,
          consultation_fee: formData.consultation_fee
        }
      };

      const response = await api.post('/api/v1/doctors/profile', profileData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create profile');
      }
      
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
    <div className="max-w-2xl mx-auto py-8">
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Completa tu perfil</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Por favor proporciona tu información profesional para completar tu registro.
          </p>

          {error && <ErrorMessage message={error} />}

          <form onSubmit={handleSubmit} className="mt-10 space-y-8 divide-y divide-gray-200">
            <div className="space-y-6">
              <div className="relative" ref={dropdownRef}>
                <label htmlFor="specialty" className="block text-sm font-medium leading-6 text-gray-900">
                  Especialidad Médica
                </label>
                <div className="mt-2 relative">
                  <div className="relative">
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
                      className="block w-full rounded-md border-0 py-1.5 pl-10 text-black shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                      required
                    />
                    <Search className="absolute left-3 top-2 h-4 w-4 text-gray-400" />
                  </div>
                  {isDropdownOpen && filteredSpecialties.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                      {filteredSpecialties.map((specialty) => (
                        <div
                          key={specialty.id}
                          onClick={() => handleSpecialtySelect(specialty)}
                          className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                        >
                          {specialty.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="license" className="block text-sm font-medium leading-6 text-gray-900">
                  Número de Licencia Médica
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="license"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-black shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="languages" className="block text-sm font-medium leading-6 text-gray-900">
                  Idiomas Hablados
                </label>
                <div className="mt-2 space-y-2">
                  {['es', 'en'].map((lang) => (
                    <div key={lang} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`lang-${lang}`}
                        checked={formData.languages.includes(lang)}
                        onChange={(e) => {
                          const languages = e.target.checked
                            ? [...formData.languages, lang]
                            : formData.languages.filter(l => l !== lang);
                          setFormData({ ...formData, languages });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor={`lang-${lang}`} className="ml-2 text-sm text-gray-900">
                        {lang === 'es' ? 'Español' : 'Inglés'}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="fee" className="block text-sm font-medium leading-6 text-gray-900">
                  Tarifa de Consulta (USD)
                </label>
                <div className="mt-2">
                  <input
                    type="number"
                    id="fee"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-black shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-end gap-x-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Perfil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}