// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle, Mail, Phone, Clipboard, Globe2, DollarSign } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { useInitialLoad } from '@/hooks/apiHooks';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorMessage } from '@/components/common/error-message';
import UserEditDrawer from '@/components/profile/user-edit-drawer';

interface DoctorMetadata {
  languages?: string[];
  consultation_fee?: number;
  [key: string]: unknown;
}

export default function ProfilePage() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const { 
    user, 
    doctorProfile, 
    specialty,
    isLoading,
    error 
  } = useUserStore();
  
  const { isLoading: isInitialLoading } = useInitialLoad();

  // Redirect to complete profile if doctor profile is missing
  useEffect(() => {
    if (user && !doctorProfile && !isLoading) {
      router.push('/profile/complete-profile');
    }
  }, [user, doctorProfile, isLoading, router]);

  if (isInitialLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!user || !doctorProfile) {
    return null;
  }

  const metadata = doctorProfile.metadata as DoctorMetadata;
  const languages = metadata?.languages;
  const consultationFee = metadata?.consultation_fee;

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
                  {user.first_name} {user.last_name}
                </h2>
                {specialty && (
                  <p className="text-sm text-gray-500">{specialty.name}</p>
                )}
                <p className="text-sm text-gray-500">DNI: {user.document_number}</p>
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
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center text-gray-700">
                    <Phone className="h-5 w-5 mr-2" />
                    <span>{user.phone}</span>
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
                  <span>Número de Licencia: {doctorProfile.license_number}</span>
                </div>
                {languages && (
                  <div className="flex items-center text-gray-700">
                    <Globe2 className="h-5 w-5 mr-2" />
                    <span>
                      Idiomas: {languages
                        .map(lang => lang === 'es' ? 'Español' : 'Inglés')
                        .join(', ')}
                    </span>
                  </div>
                )}
                {consultationFee !== undefined && (
                  <div className="flex items-center text-gray-700">
                    <DollarSign className="h-5 w-5 mr-2" />
                    <span>Tarifa de Consulta: ${consultationFee} USD</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Drawer */}
      <UserEditDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        onUserUpdate={(updatedUser) => {
          useUserStore.setState({ user: updatedUser });
        }}
      />
    </div>
  );
}