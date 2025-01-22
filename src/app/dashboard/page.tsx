// app/dashboard/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Mic } from 'lucide-react';
import { format } from 'date-fns';
import { useUserStore } from '@/stores/userStore';
import { useInitialLoad, useTodaySessions } from '@/hooks/apiHooks';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorMessage } from '@/components/common/error-message';
import SessionListItem from '@/components/dashboard/session-list-item';
import StatsGrid from '@/components/dashboard/stats-grid';
import type { Session, SessionStatus } from '@/types';

// Mock data as fallback with proper typing
const mockSessions = [
  { id: 1, patientName: 'Maria Garcia', date: '2024-01-18', status: 'completed' as SessionStatus, duration: '30 min' },
  { id: 2, patientName: 'Juan Rodriguez', date: '2024-01-18', status: 'scheduled' as SessionStatus, duration: '45 min' },
  { id: 3, patientName: 'Ana Martinez', date: '2024-01-17', status: 'cancelled' as SessionStatus, duration: '30 min' },
];

export default function Dashboard() {
  const router = useRouter();
  
  const { user, doctorProfile, error: userError } = useUserStore();
  const { isLoading: isInitialLoading } = useInitialLoad();
  const { todaySessions, isLoading: isSessionsLoading, error: sessionsError } = 
    useTodaySessions(doctorProfile?.id);

  if (isInitialLoading || isSessionsLoading) {
    return <LoadingSpinner />;
  }

  if (userError || sessionsError) {
    return <ErrorMessage message={userError || sessionsError || 'An error occurred'} />;
  }

  if (!user || !doctorProfile) {
    return null;
  }

  // Sessions display logic
  const displaySessions = todaySessions.length > 0 ? todaySessions : mockSessions;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, Dr. {user.last_name}
        </h1>
        <p className="text-gray-500">Esto es lo que está pasando con tus sesiones hoy</p>
      </div>

      {/* Stats Grid */}
      <StatsGrid todaySessions={todaySessions} />

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
            {displaySessions.map((session) => (
              <SessionListItem
                key={session.id}
                session={session}
                onSelect={() => router.push(`/session/${session.id}`)}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}