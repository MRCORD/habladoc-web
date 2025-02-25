import React from 'react';
import { Calendar, Clock, CircleDot, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Session } from '@/types';

interface StatsGridProps {
  todaySessions: Session[];
}

const getNextScheduledSession = (sessions: Session[]): string => {
  const scheduledSession = sessions.find(s => s.status === 'scheduled');
  if (!scheduledSession?.scheduled_for) return 'No hay';
  return format(new Date(scheduledSession.scheduled_for), 'HH:mm');
};

export function StatsGrid({ todaySessions }: StatsGridProps) {
  // Stats calculation
  const stats = [
    { 
      name: 'Sesiones Hoy', 
      value: todaySessions.length || '0', 
      icon: Calendar 
    },
    { 
      name: 'Próxima Sesión', 
      value: getNextScheduledSession(todaySessions), 
      icon: Clock 
    },
    { 
      name: 'Sesiones Activas', 
      value: todaySessions.filter(s => s.status === 'in_progress').length.toString() || '0', 
      icon: CircleDot 
    },
    { 
      name: 'Sesiones Completadas', 
      value: todaySessions.filter(s => s.status === 'completed').length.toString() || '0', 
      icon: BarChart2 
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 flex flex-col items-center space-y-3 hover:shadow-lg transition-shadow min-w-[120px]"
        >
          <stat.icon className="w-8 h-8 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{stat.name}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsGrid;