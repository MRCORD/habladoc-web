// app/dashboard/profile/page.tsx
'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle, Mail, Phone, Clipboard, Globe2, DollarSign } from 'lucide-react';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorMessage } from '@/components/common/error-message';
import UserEditDrawer from '@/components/profile/user-edit-drawer';
import type { User, DoctorProfile, Specialty } from '@/types';

interface CombinedProfile {
  user: User;
  doctor: DoctorProfile;
  specialty?: Specialty;
}

export default function ProfilePage() {
  const { user: auth0User, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<CombinedProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadProfiles() {
      if (!auth0User) return;
      
      try {
        console.log('🔄 Loading user and doctor profiles...');
        setIsLoading(true);
        
        // Step 1: Verify/create user
        const userResponse = await api.post('/api/v1/users/auth/verify');
        console.log('✅ User verification response:', userResponse.data);
        
        if (!userResponse.data.success) {
          throw new Error(userResponse.data.message || 'Failed to verify user');
        }

        const userData: User = userResponse.data.data;

        // Step 2: If user has doctor role, get doctor profile
        if (userData.roles.includes('doctor')) {
          try {
            console.log('🔄 Fetching doctor profile...');
            const profileResponse = await api.get('/api/v1/doctors/profile/me');
            
            if (profileResponse.data.success) {
              const doctorData: DoctorProfile = profileResponse.data.data;
              
              // Step 3: Get specialty details if available
              let specialtyData = undefined;
              if (doctorData.specialty_id) {
                const specialtyResponse = await api.get(`/api/v1/specialties/${doctorData.specialty_id}`);
                if (specialtyResponse.data.success) {
                  specialtyData = specialtyResponse.data.data;
                }
              }
              
              setProfile({
                user: userData,
                doctor: doctorData,
                specialty: specialtyData
              });
            }
          } catch (err: any) {
            // If profile not found, redirect to complete profile
            if (err.response?.status === 404) {
              router.push('/profile/complete-profile');
              return;
            }
            throw err;
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('❌ Error loading profiles:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred');
        }
        setIsLoading(false);
      }
    }

    if (auth0User && !isUserLoading) {
      loadProfiles();
    }
  }, [auth0User, isUserLoading, router]);

  const handleUserUpdate = (updatedUser: User) => {
    if (profile) {
      setProfile({
        ...profile,
        user: updatedUser
      });
    }
  };

  if (isUserLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!profile) {
    return null;
  }

return (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 profile-page">
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Profile Header */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <UserCircle className="h-12 w-12 text-gray-400" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {profile.user.first_name} {profile.user.last_name}
              </h2>
              {profile.specialty && (
                <p className="text-sm text-gray-500">{profile.specialty.name}</p>
              )}
              <p className="text-sm text-gray-500">DNI: {profile.user.document_number}</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-4">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Editar Perfil
            </button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Información de Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <Mail className="h-5 w-5 mr-2" />
                <span>{profile.user.email}</span>
              </div>
              {profile.user.phone && (
                <div className="flex items-center text-gray-700">
                  <Phone className="h-5 w-5 mr-2" />
                  <span>{profile.user.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Información Profesional</h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <Clipboard className="h-5 w-5 mr-2" />
                <span>Número de Licencia: {profile.doctor.license_number}</span>
              </div>
              {profile.doctor.metadata?.languages && (
                <div className="flex items-center text-gray-700">
                  <Globe2 className="h-5 w-5 mr-2" />
                  <span>Idiomas: {(profile.doctor.metadata.languages as string[])
                    .map(lang => lang === 'es' ? 'Español' : 'Inglés')
                    .join(', ')}
                  </span>
                </div>
              )}
              {profile.doctor.metadata?.consultation_fee && (
                <div className="flex items-center text-gray-700">
                  <DollarSign className="h-5 w-5 mr-2" />
                  <span>Tarifa de Consulta: ${profile.doctor.metadata.consultation_fee} USD</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Edit Profile Drawer */}
    <UserEditDrawer
      user={profile.user}
      isOpen={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      onUserUpdate={handleUserUpdate}
    />
  </div>
);
}