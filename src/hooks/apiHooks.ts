// src/hooks/apiHooks.ts
import { useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useUser } from '@auth0/nextjs-auth0/client';
import type { Session, SessionWithDetails } from '@/types';
import type { RecordingUploadResult } from '@/lib/recordings';

export function useInitialLoad(): { isLoading: boolean } {
  const { user: auth0User, isLoading: isAuth0Loading } = useUser();
  const fetchUser = useUserStore((state) => state.fetchUser);
  const fetchDoctorProfile = useUserStore((state) => state.fetchDoctorProfile);
  const reset = useUserStore((state) => state.reset);

  useEffect(() => {
    if (!isAuth0Loading) {
      if (auth0User) {
        fetchUser().then(() => fetchDoctorProfile());
      } else {
        reset();
      }
    }
  }, [auth0User, isAuth0Loading, fetchUser, fetchDoctorProfile, reset]);

  return { isLoading: isAuth0Loading };
}

interface SessionData {
  session: SessionWithDetails | null;
  recordings: RecordingUploadResult[];
  isLoading: boolean;
  error: string | null;
  addRecording: (recording: RecordingUploadResult) => void;
}

export function useSessionData(sessionId: string): SessionData {
  const fetchSession = useSessionStore((state) => state.fetchSession);
  const fetchRecordings = useSessionStore((state) => state.fetchRecordings);
  const addRecording = useSessionStore((state) => state.addRecording);
  const session = useSessionStore((state) => state.currentSession as SessionWithDetails | null);
  const recordings = useSessionStore((state) => state.recordings);
  const isLoading = useSessionStore((state) => state.isLoading);
  const error = useSessionStore((state) => state.error);

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
      fetchRecordings(sessionId);
    }
  }, [sessionId, fetchSession, fetchRecordings]);

  return { session, recordings, isLoading, error, addRecording };
}

interface TodaySessionsData {
  todaySessions: Session[];
  isLoading: boolean;
  error: string | null;
}

export function useTodaySessions(doctorId: string | undefined): TodaySessionsData {
  const fetchTodaySessions = useSessionStore((state) => state.fetchTodaySessions);
  const todaySessions = useSessionStore((state) => state.todaySessions);
  const isLoading = useSessionStore((state) => state.isLoading);
  const error = useSessionStore((state) => state.error);

  useEffect(() => {
    if (doctorId) {
      fetchTodaySessions(doctorId);
    }
  }, [doctorId, fetchTodaySessions]);

  return { todaySessions, isLoading, error };
}