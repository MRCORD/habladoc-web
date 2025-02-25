'use client';

import React, { useState } from 'react';
import {
  UserCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Droplet,
  HeartPulse,
  BriefcaseMedical,
  AlertCircle,
} from 'lucide-react';
import type { User } from '@/types';

interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
}

interface InsuranceInformation {
  provider?: string;
  status?: string;
  plan_name?: string;
  policy_number?: string;
  expiration_date?: string;
  [key: string]: string | undefined;
}

interface MedicalCondition {
  name: string;
  type: string;
  status: string;
}

interface PatientMetadata {
  medical_conditions?: MedicalCondition[];
  last_visit?: string;
  preferred_language?: string;
  [key: string]: unknown;
}

interface PatientDataProps {
  patientData: {
    id: string;
    user: User;
    allergies?: {
      conditions: Array<string | { name: string; severity?: string; notes?: string }>;
    };
    blood_type?: string;
    date_of_birth?: string;
    gender?: string;
    emergency_contact?: EmergencyContact;
    insurance_info?: InsuranceInformation;
    metadata?: PatientMetadata;
    medical_history?: string[];
  };
}

const InsuranceInfo: React.FC<{ info: NonNullable<PatientDataProps['patientData']['insurance_info']> }> = ({ info }) => (
  <div className="flex flex-wrap items-center gap-2 text-sm">
    <span className="dark:text-gray-300">{info.provider}</span>
    <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
    <span className="dark:text-gray-300">{info.plan_name}</span>
  </div>
);

export const PatientData: React.FC<PatientDataProps> = ({ patientData }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <UserCircle className="w-8 h-8 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500 mt-1" />
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{patientData.user.first_name} {patientData.user.last_name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">DNI: {patientData.user.document_number}</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 -mr-2 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-3">
            {/* Birth Date */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-1" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Nacimiento</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{patientData.date_of_birth && formatDate(patientData.date_of_birth)}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{patientData.date_of_birth && `${calculateAge(patientData.date_of_birth)} años`}</div>
              </div>
            </div>

            {/* Gender */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <HeartPulse className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-1" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Género</div>
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                    {patientData.gender === 'male' ? 'Masculino' : 'Femenino'}
                  </span>
                </div>
              </div>
            </div>

            {/* Blood Type */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Droplet className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-1" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Tipo de Sangre</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{patientData.blood_type}</div>
              </div>
            </div>

            {/* Insurance */}
            {patientData.insurance_info && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <BriefcaseMedical className="w-5 h-5 text-gray-500 dark:text-gray-400 shrink-0 mt-1" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Seguro médico</div>
                  <InsuranceInfo info={patientData.insurance_info} />
                </div>
              </div>
            )}
          </div>

          {/* Medical Conditions */}
          {patientData.metadata?.medical_conditions && patientData.metadata.medical_conditions.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Condiciones Médicas</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {patientData.metadata.medical_conditions.map((condition, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-md bg-orange-50 dark:bg-orange-900/30 px-2.5 py-1.5 text-sm font-medium text-orange-700 dark:text-orange-300"
                  >
                    {condition.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allergies */}
          {patientData.allergies?.conditions && patientData.allergies.conditions.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Alergias</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {patientData.allergies.conditions.map((allergy, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/30 px-2.5 py-1.5 text-sm font-medium text-red-700 dark:text-red-300"
                  >
                    {typeof allergy === 'string' ? allergy : allergy.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Medical History */}
          {patientData.medical_history && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Historial Médico</h3>
              </div>
              <ul className="list-disc list-inside space-y-2">
                {patientData.medical_history.map((history, index) => (
                  <li key={index} className="text-sm text-gray-900 dark:text-gray-200">{history}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};