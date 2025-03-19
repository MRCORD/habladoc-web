'use client';

import React, { useEffect, Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Calendar, History, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

import { useUserStore } from '@/stores/userStore';
import { useInitialLoad, useTodaySessions } from '@/hooks/apiHooks';
import { useSessionStore } from '@/stores/sessionStore';
import { ErrorMessage } from '@/components/common/error-message';
import SessionListItem from '@/components/dashboard/session-list-item';
import StatsGrid from '@/components/dashboard/stats-grid';
import { StatsGridSkeleton, SessionListSkeleton } from '@/components/common/loading-skeletons';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { groupSessionsByDate, formatDateForDisplay } from '@/utils/timeline-utils';
import { Button } from '@/components/ui/button';

import type { Session } from '@/types';

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

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [expandedDateGroups, setExpandedDateGroups] = useState<Record<string, boolean>>({});
  const [dateGroupsInitialized, setDateGroupsInitialized] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  
  // Local loading state for historical sessions
  const [isHistoricalLoading, setIsHistoricalLoading] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);

  // State from our stores
  const { user, doctorProfile, error: userError } = useUserStore();
  const { isLoading: isInitialLoading } = useInitialLoad(); // custom hook that fetches user data
  const {
    todaySessions,
    isLoading: isTodaySessionsLoading,
    error: todaySessionsError,
  } = useTodaySessions(doctorProfile?.id);

  // Get historical sessions and fetch functions directly from the store
  const historicalSessions = useSessionStore((state) => state.historicalSessions);
  const fetchHistoricalSessions = useSessionStore((state) => state.fetchHistoricalSessions);

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
   * Using our own loading state to avoid conflicts with other API calls
   */
  useEffect(() => {
    let isMounted = true;
    
    async function loadHistoricalSessions() {
      if (activeTab === 'history' && doctorProfile?.id) {
        try {
          setIsHistoricalLoading(true);
          setHistoricalError(null);
          
          const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999);
          
          await fetchHistoricalSessions(doctorProfile.id, {
            from_date: selectedMonth.toISOString(),
            to_date: endOfMonth.toISOString()
          });
        } catch (error) {
          console.error('Error fetching historical sessions:', error);
          if (isMounted) {
            setHistoricalError(error instanceof Error ? error.message : 'Error al cargar sesiones históricas');
          }
        } finally {
          if (isMounted) {
            setIsHistoricalLoading(false);
          }
        }
      }
    }
    
    loadHistoricalSessions();
    
    return () => {
      isMounted = false;
    };
  }, [activeTab, doctorProfile?.id, selectedMonth, fetchHistoricalSessions]);

  /**
   * 4) Initialize expandedDateGroups after historical sessions are loaded
   */
  useEffect(() => {
    if (activeTab === 'history' && !isHistoricalLoading && historicalSessions.length > 0 && !dateGroupsInitialized) {
      const groupedSessions = groupSessionsByDate(historicalSessions, 'scheduled_for');
      const initialExpandState: Record<string, boolean> = {};
      
      Object.keys(groupedSessions).forEach(dateKey => {
        initialExpandState[dateKey] = true;
      });
      
      setExpandedDateGroups(initialExpandState);
      setDateGroupsInitialized(true);
    }
  }, [activeTab, isHistoricalLoading, historicalSessions, dateGroupsInitialized]);

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
  const isLoading = activeTab === 'today' ? isTodaySessionsLoading : isHistoricalLoading;
  const sessionsError = activeTab === 'today' ? todaySessionsError : historicalError;

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
          <div className="px-4 sm:px-6 py-3 flex items-center justify-center gap-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary-500 dark:text-primary-400" />
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 min-w-[140px] text-center capitalize">
                {formatMonth(selectedMonth)}
              </h3>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              disabled={new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1) > new Date()}
              className="h-8 w-8 p-0 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            </Button>
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
                    isLoading={false} // Never show loading on individual rows
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
                  <div key={dateKey} className="border-b border-neutral-200 dark:border-neutral-700 last:border-b-0">
                    {/* Date Header */}
                    <div 
                      className="flex items-center px-4 py-4 sm:px-6 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                      onClick={() => toggleDateGroup(dateKey)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                          <Calendar className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {formatDateForDisplay(dateKey)}
                          </h3>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {sessions.length} {sessions.length === 1 ? 'sesión' : 'sesiones'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                      >
                        {expandedDateGroups[dateKey] ? (
                          <ChevronUp className="h-4 w-4 text-neutral-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-neutral-500" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Sessions list for this date */}
                    {expandedDateGroups[dateKey] && (
                      <div className="border-t border-neutral-200 dark:border-neutral-700">
                        <ul role="list" className="divide-y divide-neutral-200 dark:divide-neutral-700">
                          {sessions.map((session: Session) => (
                            <SessionListItem
                              key={session.id}
                              session={session}
                              onSelect={() => router.push(`/session/${session.id}`)}
                              isLoading={false} // Never show loading on individual rows
                            />
                          ))}
                        </ul>
                      </div>
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