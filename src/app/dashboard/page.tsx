// app/dashboard/page.tsx
'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, CircleDot, BarChart2, Mic } from 'lucide-react';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorMessage } from '@/components/common/error-message';
import { SessionStatusBadge } from '@/components/common/status-badges';
import type { User, DoctorProfile } from '@/types';

interface CombinedProfile {
  user: User;
  doctor: DoctorProfile;
}

interface RecentSession {
  id: number;
  patientName: string;
  date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  duration: string;
}

export default function Dashboard() {
  const { user: auth0User, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<CombinedProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadProfiles() {
      if (!auth0User) return;
      
      try {
        setIsLoading(true);
        
        // Verify/create user
        const userResponse = await api.post('/api/v1/users/auth/verify');
        if (!userResponse.data.success) {
          throw new Error(userResponse.data.message || 'Failed to verify user');
        }

        const userData: User = userResponse.data.data;

        // Get doctor profile
        if (userData.roles.includes('doctor')) {
          try {
            const profileResponse = await api.get('/api/v1/doctors/profile/me');
            
            if (profileResponse.data.success) {
              setProfile({
                user: userData,
                doctor: profileResponse.data.data
              });
            }
          } catch (err: any) {
            if (err.response?.status === 404) {
              router.push('/dashboard/complete-profile');
              return;
            }
            throw err;
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading profiles:', err);
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

  if (isUserLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!profile) {
    return null;
  }

  // Placeholder data for demonstration
  const stats = [
    { name: 'Sesiones Hoy', value: '3', icon: Calendar },
    { name: 'Próxima Sesión', value: '2:30 PM', icon: Clock },
    { name: 'Sesiones Activas', value: '1', icon: CircleDot },
    { name: 'Sesiones Completadas', value: '42', icon: BarChart2 },
  ];

  const recentSessions: RecentSession[] = [
    { id: 1, patientName: 'Maria Garcia', date: '2024-01-18', status: 'completed', duration: '30 min' },
    { id: 2, patientName: 'Juan Rodriguez', date: '2024-01-18', status: 'scheduled', duration: '45 min' },
    { id: 3, patientName: 'Ana Martinez', date: '2024-01-17', status: 'cancelled', duration: '30 min' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, Dr. {profile.user.last_name}
        </h1>
        <p className="text-gray-500">Esto es lo que está pasando con tus sesiones hoy</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sessions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Sesiones Recientes</h2>
          <button
            onClick={() => router.push('/dashboard/new-session')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
          >
            <Mic className="h-4 w-4 mr-2" />
            Nueva Sesión
          </button>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {recentSessions.map((session) => (
              <li key={session.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-gray-900">{session.patientName}</p>
                    <p className="text-sm text-gray-500">{session.date}</p>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${session.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {session.status}
                    </span>
                    <span className="ml-4 text-sm text-gray-500">{session.duration}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}