// src/components/dashboard/session-list-item.tsx
import { format, isValid } from 'date-fns';
import { SessionStatusBadge } from '@/components/common/status-badges';
import type { Session } from '@/types';

// Helper function to get patient name and document
const getPatientName = (session: Session): { name: string; document?: string } => {
  if (!session.patient) return { name: 'Paciente' };
  
  const { first_name, last_name, document_number } = session.patient;
  return {
    name: first_name && last_name ? `${first_name} ${last_name}` : 'Paciente',
    document: document_number
  };
};

interface SessionListItemProps {
  session: Session;
  onSelect: () => void;
}

export function SessionListItem({ session, onSelect }: SessionListItemProps) {
  // Helper function to safely format time only
  const getFormattedTime = (dateStr?: string | null) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return isValid(date) ? format(date, 'HH:mm') : '---';
  };

  // Helper function to format duration
  const formatDuration = (duration?: number | null) => {
    if (!duration) return '---';
    const minutes = Math.floor(duration / 60);
    return `${minutes} min`;
  };

  const patientInfo = getPatientName(session);

  return (
    <li 
      className="px-4 py-3 sm:px-6 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-indigo-600">
            {patientInfo.name}
          </p>
          {patientInfo.document && (
            <p className="text-xs text-gray-500">
              DNI: {patientInfo.document}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <SessionStatusBadge status={session.status} />
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
              <svg className="h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-sm font-semibold text-blue-700">
                {getFormattedTime(session.scheduled_for)}
              </span>
            </div>
            {session.duration && (
              <span className="text-xs text-gray-500 mt-0.5">
                {formatDuration(session.duration)}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export default SessionListItem;