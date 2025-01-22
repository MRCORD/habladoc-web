// src/components/session/patient-info.tsx
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
import type { Patient, AllergyCondition } from '@/types';

interface PatientDataProps {
  patient: Patient;
}

export const PatientData: React.FC<PatientDataProps> = ({ patient }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const fullName = `${patient.user.first_name} ${patient.user.last_name}`;
  const formattedDOB = new Date(patient.date_of_birth).toLocaleDateString();

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const formatAllergyLabel = (allergy: string | AllergyCondition): string => {
    if (typeof allergy === 'string') {
      return allergy;
    }
    return allergy.name || 'Desconocido';
  };

  return (
    <div className="bg-white shadow-md rounded-md p-4 sm:p-6 space-y-6 mb-6 max-w-screen-lg mx-auto">
      {/* Header: Full Name + Doc Badge + Toggle Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <UserCircle className="w-7 h-7 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">{fullName}</h2>
        </div>
        <div className="flex items-center space-x-2">
          {patient.user.document_number && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {patient.user.document_number}
            </span>
          )}
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

      {/* Collapsible Section */}
      {isExpanded && (
        <>
          {/* Basic Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="flex items-start space-x-2">
              <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Nacimiento</p>
                <p className="font-medium text-gray-700">{formattedDOB}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <HeartPulse className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Género</p>
                <p className="font-medium text-gray-700">{patient.gender}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Droplet className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Sangre</p>
                <p className="font-medium text-gray-700">{patient.blood_type}</p>
              </div>
            </div>
          </div>

          {/* Insurance Info */}
          {patient.insurance_info && (
            Object.keys(patient.insurance_info).length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <BriefcaseMedical className="w-5 h-5 text-gray-500" />
                  <h3 className="text-md font-semibold text-gray-800">Seguro</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {patient.insurance_info.provider && (
                    <div className="flex items-start space-x-2">
                      <Globe2 className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Proveedor</p>
                        <p className="font-medium text-gray-700">
                          {patient.insurance_info.provider}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* Allergies */}
          {patient.allergies?.conditions?.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-md font-semibold text-gray-800">Alergias</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.conditions.map((allergy, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800"
                  >
                    {formatAllergyLabel(allergy)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {patient.emergency_contact && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <LifeBuoy className="w-5 h-5 text-gray-500" />
                <h3 className="text-md font-semibold text-gray-800">Emergencia</h3>
              </div>
              <p className="text-sm font-medium text-gray-700">{patient.emergency_contact}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};