// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, CircleDot, BarChart2, Mic } from 'lucide-react';
import { format } from 'date-fns';
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

// Mock data as fallback
const mockSessions: RecentSession[] = [
  { id: 1, patientName: 'Maria Garcia', date: '2024-01-18', status: 'completed', duration: '30 min' },
  { id: 2, patientName: 'Juan Rodriguez', date: '2024-01-18', status: 'scheduled', duration: '45 min' },
  { id: 3, patientName: 'Ana Martinez', date: '2024-01-17', status: 'cancelled', duration: '30 min' },
];

interface Session {
  id: string;
  patient_id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_for: string;
  started_at?: string;
  ended_at?: string;
  duration?: number;
  patient?: {
    first_name: string;
    last_name: string;
  };
}

export default function Dashboard() {
  const { user: auth0User, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<CombinedProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
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

              // Load today's sessions
              await loadTodaySessions(profileResponse.data.data.id);
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

  async function loadTodaySessions(doctorId: string) {
    try {
      setIsLoadingSessions(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await api.get(`/api/v1/sessions/doctor/${doctorId}/list`, {
        params: {
          from_date: today.toISOString(),
          to_date: tomorrow.toISOString()
        }
      });

      if (response.data) {
        setTodaySessions(response.data);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
      // We'll still show mock sessions as fallback
    } finally {
      setIsLoadingSessions(false);
    }
  }

  if (isUserLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!profile) {
    return null;
  }

  const stats = [
    { name: 'Sesiones Hoy', value: todaySessions.length || '0', icon: Calendar },
    { name: 'Próxima Sesión', value: todaySessions.find(s => s.status === 'scheduled')?.scheduled_for ? 
      format(new Date(todaySessions.find(s => s.status === 'scheduled')!.scheduled_for), 'HH:mm') : 
      'No hay', icon: Clock },
    { name: 'Sesiones Activas', value: todaySessions.filter(s => s.status === 'in_progress').length.toString() || '0', icon: CircleDot },
    { name: 'Sesiones Completadas', value: todaySessions.filter(s => s.status === 'completed').length.toString() || '0', icon: BarChart2 },
  ];

  // Combine real sessions with mock ones if needed
  const displaySessions = todaySessions.length > 0 ? todaySessions : mockSessions;

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
          {isLoadingSessions ? (
            <div className="p-4 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {displaySessions.map((session) => (
                <li 
                  key={session.id} 
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/session/${session.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-900">
                        {/* Handle both mock and real session data */}
                        {('patientName' in session) ? 
                          session.patientName : 
                          `${session.patient?.first_name || 'Paciente'} ${session.patient?.last_name || ''}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(('date' in session) ? session.date : session.scheduled_for), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <SessionStatusBadge status={session.status} />
                      <span className="ml-4 text-sm text-gray-500">
                        {('duration' in session) ? 
                          session.duration : 
                          session.duration ? `${session.duration} min` : '---'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}