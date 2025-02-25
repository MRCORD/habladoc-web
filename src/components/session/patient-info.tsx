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
  Phone,
  Mail,
  MapPin,
  Clock,
  BadgeAlert
} from 'lucide-react';
import type { User } from '@/types';
import { AttributeTag } from '@/components/common/attribute-tag';

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

interface AllergyCondition {
  name: string;
  severity?: string;
  notes?: string;
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
      conditions: Array<string | AllergyCondition>;
    };
    blood_type?: string;
    date_of_birth?: string;
    gender?: string;
    emergency_contact?: EmergencyContact;
    insurance_info?: InsuranceInformation;
    metadata?: PatientMetadata;
    medical_history?: string[];
  };
  className?: string;
}

const InsuranceInfo: React.FC<{ info: NonNullable<PatientDataProps['patientData']['insurance_info']> }> = ({ info }) => (
  <div className="space-y-1">
    <div className="flex items-center text-sm">
      <span className="font-medium text-gray-900 dark:text-gray-100">{info.provider}</span>
      {info.status && (
        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full 
          ${info.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
          info.status === 'inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}
        >
          {info.status === 'active' ? 'Activo' : 
           info.status === 'inactive' ? 'Inactivo' : 
           info.status}
        </span>
      )}
    </div>
    {info.plan_name && (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Plan: {info.plan_name}
      </div>
    )}
    {info.policy_number && (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Póliza: {info.policy_number}
      </div>
    )}
  </div>
);

export const PatientData: React.FC<PatientDataProps> = ({ patientData, className = "" }) => {
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

  // Get severity color for allergies
  const getAllergySeverityColor = (severity: string = 'medium') => {
    switch (severity.toLowerCase()) {
      case 'high':
      case 'severe':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium':
      case 'moderate':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'low':
      case 'mild':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
  };

  // Function to render medical conditions with proper styling
  const renderMedicalConditions = () => {
    if (!patientData.metadata?.medical_conditions || 
        patientData.metadata.medical_conditions.length === 0) {
      return (
        <p className="text-gray-500 dark:text-gray-400 italic">
          No hay condiciones médicas registradas
        </p>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {patientData.metadata.medical_conditions.map((condition, idx) => (
          <div
            key={idx}
            className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium
              ${condition.status === 'active' ? 
                'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 
                'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
          >
            {condition.status === 'active' && <span className="mr-1.5 text-blue-500">●</span>}
            {condition.name}
          </div>
        ))}
      </div>
    );
  };

  // Function to render allergies with severity indicators
  const renderAllergies = () => {
    if (!patientData.allergies?.conditions || 
        patientData.allergies.conditions.length === 0) {
      return (
        <p className="text-gray-500 dark:text-gray-400 italic">
          No hay alergias registradas
        </p>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {patientData.allergies.conditions.map((allergy, idx) => {
          const allergyName = typeof allergy === 'string' ? allergy : allergy.name;
          const severity = typeof allergy === 'string' ? 'medium' : allergy.severity;
          
          return (
            <div
              key={idx}
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium border
                ${getAllergySeverityColor(severity)}`}
              title={typeof allergy !== 'string' && allergy.notes ? allergy.notes : undefined}
            >
              <BadgeAlert className="h-4 w-4 mr-1.5" />
              {allergyName}
              {typeof allergy !== 'string' && allergy.severity && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-white/40 dark:bg-black/20 rounded-full">
                  {allergy.severity}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
            <UserCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{patientData.user.first_name} {patientData.user.last_name}</h2>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                DNI: {patientData.user.document_number || 'No registrado'}
              </span>
              {patientData.date_of_birth && (
                <>
                  <span className="mx-2">•</span>
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {calculateAge(patientData.date_of_birth)} años
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors"
          aria-label={isExpanded ? "Colapsar información" : "Expandir información"}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-3">
            {/* Birth Date */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
              <Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-1" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Nacimiento</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                  {patientData.date_of_birth ? formatDate(patientData.date_of_birth) : 'No registrado'}
                </div>
                {patientData.date_of_birth && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">{calculateAge(patientData.date_of_birth)} años</div>
                )}
              </div>
            </div>

            {/* Gender */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
              <HeartPulse className="w-5 h-5 text-pink-500 dark:text-pink-400 mt-1" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Género</div>
                <div className="mt-1">
                  {patientData.gender ? (
                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                      {patientData.gender === 'male' ? 'Masculino' : 
                      patientData.gender === 'female' ? 'Femenino' : 
                      patientData.gender}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">No registrado</span>
                  )}
                </div>
              </div>
            </div>

            {/* Blood Type */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
              <Droplet className="w-5 h-5 text-red-500 dark:text-red-400 mt-1" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Tipo de Sangre</div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                  {patientData.blood_type || 'No registrado'}
                </div>
              </div>
            </div>

            {/* Insurance or Contact Info */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
              {patientData.insurance_info ? (
                <>
                  <BriefcaseMedical className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-1" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Seguro médico</div>
                    <InsuranceInfo info={patientData.insurance_info} />
                  </div>
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-1" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Contacto</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                      {patientData.user.phone || patientData.user.email || 'No registrado'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Medical Conditions */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <HeartPulse className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" />
                Condiciones Médicas
              </h3>
              <div className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-md border border-blue-100 dark:border-blue-800">
                {patientData.metadata?.medical_conditions?.length || 0} registradas
              </div>
            </div>
            <div>
              {renderMedicalConditions()}
            </div>
          </div>

          {/* Allergies */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 mr-2" />
                Alergias
              </h3>
              <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-md border border-amber-100 dark:border-amber-800">
                {patientData.allergies?.conditions?.length || 0} registradas
              </div>
            </div>
            <div>
              {renderAllergies()}
            </div>
          </div>

          {/* Medical History */}
          {patientData.medical_history && patientData.medical_history.length > 0 && (
            <div className="mt-6 space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Historial Médico</h3>
              </div>
              <ul className="space-y-2">
                {patientData.medical_history.map((history, index) => (
                  <li key={index} className="text-sm pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                    <span className="text-gray-900 dark:text-gray-200">{history}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Emergency Contact if available */}
          {patientData.emergency_contact && patientData.emergency_contact.name && (
            <div className="mt-6 p-3 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Contacto de Emergencia</h3>
              </div>
              <div className="pl-6 space-y-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                  {patientData.emergency_contact.name}
                  {patientData.emergency_contact.relationship && (
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                      ({patientData.emergency_contact.relationship})
                    </span>
                  )}
                </div>
                {patientData.emergency_contact.phone && (
                  <div className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                    <Phone className="h-3.5 w-3.5 mr-1 text-gray-500 dark:text-gray-400" />
                    {patientData.emergency_contact.phone}
                  </div>
                )}
                {patientData.emergency_contact.email && (
                  <div className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                    <Mail className="h-3.5 w-3.5 mr-1 text-gray-500 dark:text-gray-400" />
                    {patientData.emergency_contact.email}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientData;