// components/dashboard/session-list-item.tsx
import { format } from 'date-fns';
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

export function SessionListItem({ session, onSelect }: SessionListItemProps) {
  const getDisplayName = () => {
    if (isMockSession(session)) {
      return session.patientName;
    }
    // Handle nested user structure from real session data
    return `${session.patient?.user?.first_name || 'Paciente'} ${session.patient?.user?.last_name || ''}`;
  };

  const getFormattedDate = () => {
    const dateStr = isMockSession(session) ? session.date : session.scheduled_for;
    return format(new Date(dateStr), 'dd/MM/yyyy HH:mm');
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