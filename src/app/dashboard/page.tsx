'use client';

import React, { useEffect, Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Calendar, History, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

import { useUserStore } from '@/stores/userStore';
import { useInitialLoad, useTodaySessions, useHistoricalSessions } from '@/hooks/apiHooks';
import { ErrorMessage } from '@/components/common/error-message';
import SessionListItem from '@/components/dashboard/session-list-item';
import StatsGrid from '@/components/dashboard/stats-grid';
import { StatsGridSkeleton, SessionListSkeleton } from '@/components/common/loading-skeletons';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { groupSessionsByDate, formatDateForDisplay } from '@/utils/timeline-utils';
import { Button } from '@/components/ui/button';

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
  status?: number;
  data?: {
    detail?: string;
  };
  message?: string;
}

function isErrorResponse(error: unknown): error is ErrorResponse {
  if (typeof error === 'object' && error !== null) {
    return 'status' in error || 'data' in error || 'message' in error;
  }
  return false;
}

interface HistoricalSessionsOptions {
  limit?: number;
  offset?: number;
  from_date?: string;
  to_date?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [expandedDateGroups, setExpandedDateGroups] = useState<Record<string, boolean>>({});
  const [dateGroupsInitialized, setDateGroupsInitialized] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // State from our stores
  const { user, doctorProfile, error: userError } = useUserStore();
  const { isLoading: isInitialLoading } = useInitialLoad(); // custom hook that fetches user data
  const {
    todaySessions,
    isLoading: isTodaySessionsLoading,
    error: todaySessionsError,
  } = useTodaySessions(doctorProfile?.id);

  // Historical sessions data
  const {
    historicalSessions,
    isLoading: isHistoricalSessionsLoading,
    error: historicalSessionsError,
    fetchHistoricalSessions
  } = useHistoricalSessions(doctorProfile?.id) as {
    historicalSessions: Session[];
    isLoading: boolean;
    error: string | null;
    fetchHistoricalSessions: (options?: HistoricalSessionsOptions) => Promise<void>;
  };

  // Toggle date group expansion
  const toggleDateGroup = useCallback((dateKey: string) => {
    setExpandedDateGroups(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  }, []);

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
    if (!isInitialLoading && !isTodaySessionsLoading) {
      // sessionsError === '404' is your store's custom way of indicating "Doctor profile not found"
      const is404Error =
        todaySessionsError === '404' ||
        (isErrorResponse(todaySessionsError) && todaySessionsError.data?.detail === 'Doctor profile not found');

      if (is404Error || (!doctorProfile && !userError)) {
        router.replace('/profile/complete-profile');
      }
    }
  }, [isInitialLoading, isTodaySessionsLoading, todaySessionsError, doctorProfile, userError, router]);

  /**
   * 3) Fetch historical sessions when the history tab is selected or month changes
   */
  useEffect(() => {
    if (activeTab === 'history' && doctorProfile?.id && !isHistoricalSessionsLoading) {
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      fetchHistoricalSessions({
        from_date: selectedMonth.toISOString(),
        to_date: endOfMonth.toISOString()
      }).catch(error => {
        console.error('Error fetching historical sessions:', error);
      });
    }
  }, [activeTab, doctorProfile?.id, selectedMonth]);

  /**
   * 4) Initialize expandedDateGroups after historical sessions are loaded
   */
  useEffect(() => {
    if (activeTab === 'history' && !isHistoricalSessionsLoading && historicalSessions.length > 0 && !dateGroupsInitialized) {
      const groupedSessions = groupSessionsByDate(historicalSessions, 'scheduled_for');
      const initialExpandState: Record<string, boolean> = {};
      
      Object.keys(groupedSessions).forEach(dateKey => {
        initialExpandState[dateKey] = true;
      });
      
      setExpandedDateGroups(initialExpandState);
      setDateGroupsInitialized(true);
    }
  }, [activeTab, isHistoricalSessionsLoading, historicalSessions, dateGroupsInitialized]);

  /**
   * 5) Reset dateGroupsInitialized when switching tabs
   */
  useEffect(() => {
    if (activeTab === 'today') {
      setDateGroupsInitialized(false);
    }
  }, [activeTab]);

  /**
   * 6) Show any error returned from user store.
   */
  if (userError) {
    return <ErrorMessage message={userError} />;
  }

  /**
   * 7) If there's still no user or no doctorProfile, we return null. 
   *    Our useEffects above will handle the redirects.
   */
  if (!user || !doctorProfile) {
    return null;
  }

  // Group sessions by date for the history tab
  const groupedHistoricalSessions = activeTab === 'history' 
    ? groupSessionsByDate(historicalSessions, 'scheduled_for') 
    : {};

  // If we get this far, we have a user and a doctorProfile.
  const isLoading = activeTab === 'today' ? isTodaySessionsLoading : isHistoricalSessionsLoading;
  const sessionsError = activeTab === 'today' ? todaySessionsError : historicalSessionsError;

  // Helper function to format month display
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('es', { month: 'long', year: 'numeric' });
  };

  // Month navigation handlers
  const goToPreviousMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    if (nextMonth <= new Date()) {
      setSelectedMonth(nextMonth);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Bienvenido, Dr. {user.last_name}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Esto es lo que está pasando con tus sesiones hoy
        </p>
      </div>
      {/* Stats Grid */}
      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGrid todaySessions={todaySessions} />
      </Suspense>
      {/* Sessions Section with Tabs */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Sesiones</h2>
          <button
            onClick={() => router.push('/dashboard/new-session')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700"
          >
            <Mic className="h-4 w-4 mr-2" />
            Nueva Sesión
          </button>
        </div>
        
        {/* Tabs for Today and History */}
        <div className="px-4 sm:px-6 pt-2">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'today' | 'history')}>
            <TabsList className="w-full flex-none mb-4">
              <TabsTrigger value="today" className="flex-1 items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Sesiones de Hoy</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 items-center gap-1.5">
                <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Historial de Sesiones</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Month Selection for History Tab */}
        {activeTab === 'history' && (
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={goToPreviousMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
              {formatMonth(selectedMonth)}
            </h3>
            <button
              onClick={goToNextMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              disabled={new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1) > new Date()}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <SessionListSkeleton />
          ) : sessionsError ? (
            <div className="px-4 py-6 sm:px-6 text-center">
              <ErrorMessage message={typeof sessionsError === 'string' ? sessionsError : 'Error al cargar sesiones'} />
            </div>
          ) : activeTab === 'today' ? (
            // Today's Sessions - Simple list
            <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
              {todaySessions.length > 0 ? (
                todaySessions.map((session) => (
                  <SessionListItem
                    key={session.id}
                    session={session}
                    onSelect={() => router.push(`/session/${session.id}`)}
                    isLoading={isLoading}
                  />
                ))
              ) : (
                <li className="px-4 py-8 sm:px-6 text-center">
                  <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                    <Calendar className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">No hay sesiones para hoy</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                    Las nuevas sesiones que inicies aparecerán aquí.
                  </p>
                </li>
              )}
            </ul>
          ) : (
            // Historical Sessions - Grouped by date
            <div>
              {Object.keys(groupedHistoricalSessions).length > 0 ? (
                Object.entries(groupedHistoricalSessions).map(([dateKey, sessions]) => (
                  <div key={dateKey} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    {/* Date Header */}
                    <div 
                      className="flex items-center px-4 py-3 sm:px-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => toggleDateGroup(dateKey)}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mr-2 h-8 w-8"
                      >
                        {expandedDateGroups[dateKey] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatDateForDisplay(dateKey)}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {sessions.length} {sessions.length === 1 ? 'sesión' : 'sesiones'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Sessions for this date */}
                    {expandedDateGroups[dateKey] && (
                      <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sessions.map((session: Session) => (
                          <SessionListItem
                            key={session.id}
                            session={session}
                            onSelect={() => router.push(`/session/${session.id}`)}
                            isLoading={isLoading}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 sm:px-6 text-center">
                  <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                    <History className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">No hay sesiones en este mes</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                    Selecciona otro mes o inicia una nueva sesión.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}