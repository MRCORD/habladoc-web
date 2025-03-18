'use client';

import React, { useState } from 'react';
import {
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
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/avatar';
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
      <span className="font-medium text-neutral-900 dark:text-neutral-100">{info.provider}</span>
      {info.status && (
        <Badge 
          variant={info.status === 'active' ? 'success' : 
                 info.status === 'inactive' ? 'danger' : 'warning'}
          className="ml-2"
        >
          {info.status === 'active' ? 'Activo' : 
           info.status === 'inactive' ? 'Inactivo' : 
           info.status}
        </Badge>
      )}
    </div>
    {info.plan_name && (
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        Plan: {info.plan_name}
      </div>
    )}
    {info.policy_number && (
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
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

  // Function to render medical conditions with proper styling
  const renderMedicalConditions = () => {
    if (!patientData.metadata?.medical_conditions || 
        patientData.metadata.medical_conditions.length === 0) {
      return (
        <p className="text-neutral-500 dark:text-neutral-400 italic">
          No hay condiciones médicas registradas
        </p>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {patientData.metadata.medical_conditions.map((condition, idx) => (
          <Badge
            key={idx}
            variant={condition.status === 'active' ? 'primary' : 'default'}
            withDot={condition.status === 'active'}
            dotColor="primary"
          >
            {condition.name}
          </Badge>
        ))}
      </div>
    );
  };

  // Function to render allergies with severity indicators
  const renderAllergies = () => {
    if (!patientData.allergies?.conditions || 
        patientData.allergies.conditions.length === 0) {
      return (
        <p className="text-neutral-500 dark:text-neutral-400 italic">
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
            <Badge
              key={idx}
              variant={
                severity === 'high' || severity === 'severe' ? 'danger' :
                severity === 'medium' || severity === 'moderate' ? 'warning' : 'default'
              }
              className="inline-flex items-center gap-1.5"
              title={typeof allergy !== 'string' && allergy.notes ? allergy.notes : undefined}
            >
              <BadgeAlert className="h-3.5 w-3.5" />
              <span>{allergyName}</span>
              {typeof allergy !== 'string' && allergy.severity && (
                <span className="ml-1 px-1 py-0.5 text-xs bg-white/40 dark:bg-black/20 rounded-full">
                  {allergy.severity}
                </span>
              )}
            </Badge>
          );
        })}
      </div>
    );
  };

  return (
    <Card className={className}>
      {/* Header - More compact for mobile */}
      <CardHeader className="flex flex-row items-start justify-between bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/10 dark:to-neutral-800 p-3 sm:p-6">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="bg-primary-100 dark:bg-primary-900/30 p-1.5 sm:p-2 rounded-full shrink-0">
            <UserAvatar 
              size="sm"
              className="bg-white dark:bg-neutral-800 w-8 h-8 sm:w-10 sm:h-10"
            />
          </div>
          <div className="min-w-0"> {/* Add min-w-0 to allow text truncation */}
            <h2 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {patientData.user.first_name} {patientData.user.last_name}
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 gap-1 sm:gap-0">
              <span className="flex items-center">
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                DNI: {patientData.user.document_number || 'No registrado'}
              </span>
              {patientData.date_of_birth && (
                <div className="flex items-center sm:ml-2">
                  <span className="hidden sm:inline mx-2">•</span>
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                  <span>{calculateAge(patientData.date_of_birth)} años</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Colapsar información" : "Expandir información"}
          className="ml-2"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </CardHeader>

      {/* Content - Keep multi-column layout */}
      {isExpanded && (
        <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {/* Birth Date */}
            <div className="flex items-start gap-2 p-2 sm:p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 dark:text-primary-400 mt-1 shrink-0" />
              <div className="min-w-0 w-full">
                <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Nacimiento</div>
                <div className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-200 truncate">
                  {patientData.date_of_birth ? formatDate(patientData.date_of_birth) : 'No registrado'}
                </div>
                {patientData.date_of_birth && (
                  <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                    {calculateAge(patientData.date_of_birth)} años
                  </div>
                )}
              </div>
            </div>

            {/* Gender */}
            <div className="flex items-start gap-2 p-2 sm:p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 text-danger-500 dark:text-danger-400 mt-1 shrink-0" />
              <div className="min-w-0 w-full">
                <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Género</div>
                <div className="mt-1">
                  {patientData.gender ? (
                    <Badge variant="primary" className="text-xs sm:text-sm">
                      {patientData.gender === 'male' ? 'Masculino' : 
                      patientData.gender === 'female' ? 'Femenino' : 
                      patientData.gender}
                    </Badge>
                  ) : (
                    <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">No registrado</span>
                  )}
                </div>
              </div>
            </div>

            {/* Blood Type */}
            <div className="flex items-start gap-2 p-2 sm:p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <Droplet className="w-4 h-4 sm:w-5 sm:h-5 text-danger-500 dark:text-danger-400 mt-1 shrink-0" />
              <div className="min-w-0 w-full">
                <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Tipo de Sangre</div>
                <div className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-200">
                  {patientData.blood_type || 'No registrado'}
                </div>
              </div>
            </div>

            {/* Insurance or Contact Info */}
            <div className="flex items-start gap-2 p-2 sm:p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              {patientData.insurance_info ? (
                <>
                  <BriefcaseMedical className="w-4 h-4 sm:w-5 sm:h-5 text-success-500 dark:text-success-400 shrink-0 mt-1" />
                  <div className="min-w-0 w-full">
                    <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Seguro médico</div>
                    <InsuranceInfo info={patientData.insurance_info} />
                  </div>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-info-500 dark:text-info-400 shrink-0 mt-1" />
                  <div className="min-w-0 w-full">
                    <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Contacto</div>
                    <div className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-200 truncate">
                      {patientData.user.phone || patientData.user.email || 'No registrado'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Rest of the content - Medical conditions, allergies, etc */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center">
                <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 dark:text-primary-400 mr-2" />
                Condiciones Médicas
              </h3>
              <Badge variant="primary" size="sm" className="text-xs">
                {patientData.metadata?.medical_conditions?.length || 0} registradas
              </Badge>
            </div>
            <div className="text-xs sm:text-sm">
              {renderMedicalConditions()}
            </div>
          </div>

          {/* Allergies */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-warning-500 dark:text-warning-400 mr-2" />
                Alergias
              </h3>
              <Badge variant="warning" size="sm" className="text-xs">
                {patientData.allergies?.conditions?.length || 0} registradas
              </Badge>
            </div>
            <div className="text-xs sm:text-sm">
              {renderAllergies()}
            </div>
          </div>

          {/* Medical History */}
          {patientData.medical_history && patientData.medical_history.length > 0 && (
            <div className="p-3 sm:p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 dark:text-neutral-500" />
                <h3 className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100">Historial Médico</h3>
              </div>
              <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                {patientData.medical_history.map((history, index) => (
                  <li key={index} className="pl-3 sm:pl-4 border-l-2 border-neutral-300 dark:border-neutral-600">
                    <span className="text-neutral-900 dark:text-neutral-200">{history}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Emergency Contact if available */}
          {patientData.emergency_contact && patientData.emergency_contact.name && (
            <div className="p-3 sm:p-4 border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-warning-600 dark:text-warning-400" />
                <h3 className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100">Contacto de Emergencia</h3>
              </div>
              <div className="pl-5 sm:pl-6 space-y-1 text-xs sm:text-sm">
                <div className="font-medium text-neutral-900 dark:text-neutral-200">
                  {patientData.emergency_contact.name}
                  {patientData.emergency_contact.relationship && (
                    <span className="ml-2 text-neutral-500 dark:text-neutral-400">
                      ({patientData.emergency_contact.relationship})
                    </span>
                  )}
                </div>
                {patientData.emergency_contact.phone && (
                  <div className="text-neutral-700 dark:text-neutral-300 flex items-center">
                    <Phone className="h-3.5 w-3.5 mr-1 text-neutral-500 dark:text-neutral-400" />
                    {patientData.emergency_contact.phone}
                  </div>
                )}
                {patientData.emergency_contact.email && (
                  <div className="text-neutral-700 dark:text-neutral-300 flex items-center">
                    <Mail className="h-3.5 w-3.5 mr-1 text-neutral-500 dark:text-neutral-400" />
                    {patientData.emergency_contact.email}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default PatientData;