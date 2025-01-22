// src/components/dashboard/session-list-item.tsx
import { format, isValid } from 'date-fns';
import { SessionStatusBadge } from '@/components/common/status-badges';
import type { Session } from '@/types';

// Helper function to get patient name
const getPatientName = (session: Session): string => {
  if (!session.patient) return 'Paciente';
  
  const { first_name, last_name } = session.patient;
  return first_name && last_name ? `${first_name} ${last_name}` : 'Paciente';
};

interface SessionListItemProps {
  session: Session;
  onSelect: () => void;
}

export function SessionListItem({ session, onSelect }: SessionListItemProps) {
  // Helper function to safely format dates
  const getFormattedDate = (dateStr?: string | null) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return isValid(date) ? format(date, 'dd/MM/yyyy HH:mm') : '---';
  };

  // Helper function to format duration
  const formatDuration = (duration?: number | null) => {
    if (!duration) return '---';
    const minutes = Math.floor(duration / 60);
    return `${minutes} min`;
  };

  return (
    <li 
      className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-gray-900">
            {getPatientName(session)}
          </p>
          <p className="text-sm text-gray-500">
            {getFormattedDate(session.scheduled_for)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <SessionStatusBadge status={session.status} />
          <span className="text-sm text-gray-500 min-w-[60px] text-right">
            {formatDuration(session.duration)}
          </span>
        </div>
      </div>
    </li>
  );
}

export default SessionListItem;