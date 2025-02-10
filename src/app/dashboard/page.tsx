'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Mic } from 'lucide-react';

import { useUserStore } from '@/stores/userStore';
import { useInitialLoad, useTodaySessions } from '@/hooks/apiHooks';
import { ErrorMessage } from '@/components/common/error-message';
import SessionListItem from '@/components/dashboard/session-list-item';
import StatsGrid from '@/components/dashboard/stats-grid';
import { StatsGridSkeleton, SessionListSkeleton } from '@/components/common/loading-skeletons';

import type { Session, SessionStatus, SessionType } from '@/types';

// Mock data (optional fallback)
const mockSessions: Session[] = [
  {
    id: '1',
    doctor_id: 'mock-doctor-id',
    patient_id: 'mock-patient-1',
    status: 'completed' as SessionStatus,
    session_type: 'standard' as SessionType,
    scheduled_for: '2024-01-18T10:00:00Z',
    started_at: '2024-01-18T10:00:00Z',
    ended_at: '2024-01-18T10:30:00Z',
    duration: 1800,
    created_at: '2024-01-18T09:00:00Z',
    updated_at: '2024-01-18T10:30:00Z',
    patient: {
      id: 'mock-patient-1',
      first_name: 'Maria',
      last_name: 'Garcia',
      document_number: 'DOC123'
    }
  },
  {
    id: '2',
    doctor_id: 'mock-doctor-id',
    patient_id: 'mock-patient-2',
    status: 'scheduled' as SessionStatus,
    session_type: 'standard' as SessionType,
    scheduled_for: '2024-01-18T14:00:00Z',
    created_at: '2024-01-18T09:00:00Z',
    updated_at: '2024-01-18T09:00:00Z',
    patient: {
      id: 'mock-patient-2',
      first_name: 'Juan',
      last_name: 'Rodriguez',
      document_number: 'DOC456'
    }
  },
  {
    id: '3',
    doctor_id: 'mock-doctor-id',
    patient_id: 'mock-patient-3',
    status: 'cancelled' as SessionStatus,
    session_type: 'standard' as SessionType,
    scheduled_for: '2024-01-17T15:00:00Z',
    created_at: '2024-01-17T09:00:00Z',
    updated_at: '2024-01-17T14:00:00Z',
    patient: {
      id: 'mock-patient-3',
      first_name: 'Ana',
      last_name: 'Martinez',
      document_number: 'DOC789'
    }
  }
];

interface ErrorResponse {
  data: {
    detail: string;
  };
}

function isErrorResponse(error: unknown): error is ErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof (error as ErrorResponse).data?.detail === 'string'
  );
}

export default function Dashboard() {
  const router = useRouter();

  // State from our stores
  const { user, doctorProfile, error: userError } = useUserStore();
  const { isLoading: isInitialLoading } = useInitialLoad(); // custom hook that fetches user data
  const {
    todaySessions,
    isLoading: isSessionsLoading,
    error: sessionsError,
  } = useTodaySessions(doctorProfile?.id);

  /**
   * 1) If no user is logged in (and we've finished loading), redirect to login.
   */
  useEffect(() => {
    if (!isInitialLoading && !user) {
      router.replace('/login');
    }
  }, [isInitialLoading, user, router]);

  /**
   * 2) If there's a 404 or no doctor profile, redirect to "complete-profile" (after loads finish).
   */
  useEffect(() => {
    if (!isInitialLoading && !isSessionsLoading) {
      // sessionsError === '404' is your store's custom way of indicating “Doctor profile not found”
      const is404Error =
        sessionsError === '404' ||
        (isErrorResponse(sessionsError) && sessionsError.data.detail === 'Doctor profile not found');

      if (is404Error || (!doctorProfile && !userError)) {
        router.replace('/profile/complete-profile');
      }
    }
  }, [isInitialLoading, isSessionsLoading, sessionsError, doctorProfile, userError, router]);

  /**
   * 4) Show any error returned from user store.
   */
  if (userError) {
    return <ErrorMessage message={userError} />;
  }

  /**
   * 5) If there's still no user or no doctorProfile, we return null. 
   *    Our useEffects above will handle the redirects.
   */
  if (!user || !doctorProfile) {
    return null;
  }

  // If we get this far, we have a user and a doctorProfile.
  // We'll either show sessions or the fallback mockSessions.

  const displaySessions = todaySessions.length > 0 ? todaySessions : mockSessions;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, Dr. {user.last_name}
        </h1>
        <p className="text-gray-500">
          Esto es lo que está pasando con tus sesiones hoy
        </p>
      </div>

      {/* Stats Grid */}
      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGrid todaySessions={todaySessions} />
      </Suspense>

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
          <Suspense fallback={<SessionListSkeleton />}>
            <ul role="list" className="divide-y divide-gray-200">
              {displaySessions.map((session) => (
                <SessionListItem
                  key={session.id}
                  session={session}
                  onSelect={() => router.push(`/session/${session.id}`)}
                />
              ))}
            </ul>
          </Suspense>
        </div>
      </div>
    </div>
  );
}