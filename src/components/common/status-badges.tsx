// src/components/common/status-badges.tsx
import React from 'react';
import { cn } from '@/lib/utils';

export type RecordingStatus = 'pending' | 'recording' | 'processing' | 'completed' | 'failed';
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface StatusBadgeProps {
  className?: string;
}

interface RecordingBadgeProps extends StatusBadgeProps {
  status: RecordingStatus;
}

interface SessionBadgeProps extends StatusBadgeProps {
  status: SessionStatus;
}

export function RecordingStatusBadge({ status, className }: RecordingBadgeProps) {
  const statusConfig: Record<RecordingStatus, { label: string; classes: string }> = {
    pending: {
      label: 'Pendiente',
      classes: 'bg-yellow-100 text-yellow-800',
    },
    recording: {
      label: 'Grabando',
      classes: 'bg-red-100 text-red-800',
    },
    processing: {
      label: 'Procesando',
      classes: 'bg-blue-100 text-blue-800',
    },
    completed: {
      label: 'Completado',
      classes: 'bg-green-100 text-green-800',
    },
    failed: {
      label: 'Error',
      classes: 'bg-red-100 text-red-800',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        config.classes,
        className
      )}
    >
      {config.label}
      {status === 'recording' && (
        <span className="ml-1.5 h-2 w-2 rounded-full bg-red-400 animate-pulse" />
      )}
    </span>
  );
}

export function SessionStatusBadge({ status, className }: SessionBadgeProps) {
  const statusConfig: Record<SessionStatus, { label: string; classes: string }> = {
    scheduled: {
      label: 'Programada',
      classes: 'bg-indigo-100 text-indigo-800',
    },
    in_progress: {
      label: 'En Progreso',
      classes: 'bg-blue-100 text-blue-800',
    },
    completed: {
      label: 'Completada',
      classes: 'bg-green-100 text-green-800',
    },
    cancelled: {
      label: 'Cancelada',
      classes: 'bg-gray-100 text-gray-800',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        config.classes,
        className
      )}
    >
      {config.label}
      {status === 'in_progress' && (
        <span className="ml-1.5 h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
      )}
    </span>
  );
}

// Example usage:
export function StatusBadgeExample() {
  return (
    <div className="space-y-4">
      <div className="space-x-2">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Recording Statuses:</h3>
        <RecordingStatusBadge status="pending" />
        <RecordingStatusBadge status="recording" />
        <RecordingStatusBadge status="processing" />
        <RecordingStatusBadge status="completed" />
        <RecordingStatusBadge status="failed" />
      </div>

      <div className="space-x-2">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Session Statuses:</h3>
        <SessionStatusBadge status="scheduled" />
        <SessionStatusBadge status="in_progress" />
        <SessionStatusBadge status="completed" />
        <SessionStatusBadge status="cancelled" />
      </div>
    </div>
  );
}