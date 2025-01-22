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
  LifeBuoy,
  Globe2,
  Clipboard,
} from 'lucide-react';

interface AllergyData {
  conditions: any[];
}

interface InsuranceInfo {
  provider: string;
  plan_name: string;
}

interface MedicalCondition {
  name: string;
  type: string;
  status: string;
}

interface Metadata {
  medical_conditions?: MedicalCondition[];
  [key: string]: any;
}

interface User {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  document_number: string;
}

interface Patient {
  id: string;
  date_of_birth: string;
  gender: string;
  blood_type: string;
  allergies?: AllergyData;
  emergency_contact?: string | null;
  insurance_info?: InsuranceInfo;
  metadata?: Metadata;
  user: User;
}

interface PatientDataProps {
  patient: Patient;
}

export const PatientData: React.FC<PatientDataProps> = ({ patient }) => {
  const { date_of_birth, gender, blood_type, allergies, emergency_contact, insurance_info, metadata, user } = patient;

  const [isExpanded, setIsExpanded] = useState(true); // State to manage collapsible section
  const fullName = `${user.first_name} ${user.last_name}`;
  const formattedDOB = new Date(date_of_birth).toLocaleDateString();

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white shadow-md rounded-md p-4 sm:p-6 space-y-6 mb-6 max-w-screen-lg mx-auto">
      {/* --------- Header: Full Name + Doc Badge + Toggle Button --------- */}
      <div className="flex items-center justify-between">
        {/* Name + Icon */}
        <div className="flex items-center space-x-2">
          <UserCircle className="w-7 h-7 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">{fullName}</h2>
        </div>
        <div className="flex items-center space-x-2">
          {/* Document Badge */}
          {user.document_number && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {user.document_number}
            </span>
          )}
          {/* Toggle Button */}
          <button
            onClick={toggleExpanded}
            className="flex items-center justify-center text-gray-600 hover:text-gray-800 focus:outline-none"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" aria-label="Collapse section" />
            ) : (
              <ChevronDown className="w-5 h-5" aria-label="Expand section" />
            )}
          </button>
        </div>
      </div>

      {/* --------- Collapsible Section --------- */}
      {isExpanded && (
        <>
          {/* Row: Birthdate, Gender, Blood Type */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Birthdate */}
            <div className="flex items-start space-x-2">
              <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Nacimiento</p>
                <p className="font-medium text-gray-700">{formattedDOB}</p>
              </div>
            </div>
            {/* Gender */}
            <div className="flex items-start space-x-2">
              <HeartPulse className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Género</p>
                <p className="font-medium text-gray-700">{gender}</p>
              </div>
            </div>
            {/* Blood Type */}
            <div className="flex items-start space-x-2">
              <Droplet className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Sangre</p>
                <p className="font-medium text-gray-700">{blood_type}</p>
              </div>
            </div>
          </div>

          {/* Insurance Info */}
          {insurance_info && (insurance_info.provider || insurance_info.plan_name) && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <BriefcaseMedical className="w-5 h-5 text-gray-500" />
                <h3 className="text-md font-semibold text-gray-800">Seguro</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Provider */}
                {insurance_info.provider && (
                  <div className="flex items-start space-x-2">
                    <Globe2 className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Proveedor</p>
                      <p className="font-medium text-gray-700">{insurance_info.provider}</p>
                    </div>
                  </div>
                )}
                {/* Plan */}
                {insurance_info.plan_name && (
                  <div className="flex items-start space-x-2">
                    <Clipboard className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Plan</p>
                      <p className="font-medium text-gray-700">{insurance_info.plan_name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Allergies */}
          {allergies?.conditions?.length ? (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-md font-semibold text-gray-800">Alergias</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {allergies.conditions.map((allergy, idx) => {
                  const allergyLabel =
                    typeof allergy === 'object' && allergy !== null
                      ? allergy.name ?? 'Desconocido'
                      : allergy;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800"
                    >
                      {allergyLabel}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Medical Conditions */}
          {metadata?.medical_conditions?.length ? (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <BriefcaseMedical className="w-5 h-5 text-gray-500" />
                <h3 className="text-md font-semibold text-gray-800">
                  Condiciones
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.medical_conditions.map((condition, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800"
                  >
                    {condition.name} ({condition.type})
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Emergency Contact */}
          {emergency_contact && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <LifeBuoy className="w-5 h-5 text-gray-500" />
                <h3 className="text-md font-semibold text-gray-800">Emergencia</h3>
              </div>
              <p className="text-sm font-medium text-gray-700">{emergency_contact}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};