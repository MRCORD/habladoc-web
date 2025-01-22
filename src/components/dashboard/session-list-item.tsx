// components/dashboard/session-list-item.tsx
import { format, isValid } from 'date-fns';
import { SessionStatusBadge } from '@/components/common/status-badges';
import type { Session, SessionStatus } from '@/types';

interface MockSession {
  id: number;
  patientName: string;
  date: string;
  status: SessionStatus;
  duration: string;
}

interface SessionListItemProps {
  session: Session | MockSession;
  onSelect: () => void;
}

// Type guard to check if it's a mock session
function isMockSession(session: Session | MockSession): session is MockSession {
  return 'patientName' in session;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (!isValid(date)) {
      console.warn('Invalid date:', dateStr);
      return 'Invalid date';
    }
    return format(date, 'dd/MM/yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

export function SessionListItem({ session, onSelect }: SessionListItemProps) {
  const getDisplayName = () => {
    if (isMockSession(session)) {
      return session.patientName;
    }
    // Handle nested user structure from real session data
    return `${session.patient?.user?.first_name || 'Paciente'} ${session.patient?.user?.last_name || ''}`;
  };

  const getFormattedDate = () => {
    const dateStr = isMockSession(session) ? session.date : session.scheduledFor;
    return formatDate(dateStr);
  };

  const getDuration = () => {
    if (isMockSession(session)) {
      return session.duration;
    }
    return session.duration ? `${session.duration} min` : '---';
  };

  return (
    <li 
      className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-gray-900">
            {getDisplayName()}
          </p>
          <p className="text-sm text-gray-500">
            {getFormattedDate()}
          </p>
        </div>
        <div className="flex items-center">
          <SessionStatusBadge status={session.status} />
          <span className="ml-4 text-sm text-gray-500">
            {getDuration()}
          </span>
        </div>
      </div>
    </li>
  );
}

export default SessionListItem;