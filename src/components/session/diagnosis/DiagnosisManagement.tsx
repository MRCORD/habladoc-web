// src/components/session/diagnosis/DiagnosisManagement.tsx
import React, { useEffect, useState } from 'react';
import { 
  PlusCircle, 
  Stethoscope, 
  Heart,
  RefreshCw,
  AlertCircle,
  Star,
  StarOff,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  Info
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DiagnosisCreateData, DiagnosisType, DiagnosisStatus, DiagnosisUpdateData } from '@/types/diagnosis';
import DiagnosisBrowser from './DiagnosisBrowser'; // Updated import name
import { useDiagnosisStore } from '@/stores/diagnosisStore';

interface DiagnosisManagementProps {
  sessionId: string;
  className?: string;
}

const DiagnosisManagement: React.FC<DiagnosisManagementProps> = ({ 
  sessionId, 
  className = "" 
}) => {
  const [browserOpen, setBrowserOpen] = useState(false); // Updated variable name
  const [groupByType, setGroupByType] = useState(true);
  const [lastAction, setLastAction] = useState<string | null>(null);
  
  const { 
    setCurrentSession,
    getDiagnosesBySessionId,
    addDiagnosis, 
    updateDiagnosis, 
    removeDiagnosis,
    isLoading,
    error
  } = useDiagnosisStore();

  // Set the current session when component mounts
  useEffect(() => {
    if (sessionId) {
      console.log('📋 Setting current session for diagnosis management:', sessionId);
      setCurrentSession(sessionId);
    }
  }, [sessionId, setCurrentSession]);

  // Get diagnoses for this session
  const sessionDiagnoses = getDiagnosesBySessionId(sessionId);
  
  useEffect(() => {
    console.log('📊 Current diagnoses count:', sessionDiagnoses.length);
  }, [sessionDiagnoses.length]);

  // Handle new diagnosis from the browser
  const handleDiagnosisSelected = (diagnosis: DiagnosisCreateData) => {
    console.log('➕ Adding new diagnosis:', diagnosis);
    addDiagnosis(sessionId, diagnosis);
    setBrowserOpen(false); // Close the browser after selection
    setLastAction(`Diagnóstico añadido: ${diagnosis.title}`);
  };

  // Handle diagnosis update
  const handleUpdateDiagnosis = (id: string, data: DiagnosisUpdateData) => {
    console.log('🔄 Updating diagnosis:', id, data);
    updateDiagnosis(id, data);
    setLastAction(`Diagnóstico actualizado: ${data.type || data.status || 'propiedad'}`);
  };

  // Handle diagnosis deletion
  const handleDeleteDiagnosis = (id: string) => {
    console.log('❌ Removing diagnosis:', id);
    const diagnosisToRemove = sessionDiagnoses.find(d => d.id === id);
    removeDiagnosis(id);
    setLastAction(`Diagnóstico eliminado: ${diagnosisToRemove?.title || 'desconocido'}`);
  };

  // Toggle diagnosis type (primary/secondary)
  const toggleDiagnosisType = (id: string, currentType: DiagnosisType) => {
    const newType = currentType === DiagnosisType.PRIMARY 
      ? DiagnosisType.SECONDARY 
      : DiagnosisType.PRIMARY;
    
    console.log(`🔄 Changing diagnosis type: ${currentType} → ${newType}`);
    updateDiagnosis(id, { type: newType });
    setLastAction(`Tipo cambiado: ${currentType} → ${newType}`);
  };

  // Toggle diagnosis status
  const toggleDiagnosisStatus = (id: string) => {
    // Find the diagnosis to toggle
    const diagnosis = sessionDiagnoses.find(d => d.id === id);
    if (!diagnosis) return;
    
    // Toggle between confirmed and ruled out
    const newStatus = diagnosis.status === DiagnosisStatus.CONFIRMED 
      ? DiagnosisStatus.RULED_OUT 
      : DiagnosisStatus.CONFIRMED;
    
    console.log(`🔄 Changing diagnosis status: ${diagnosis.status} → ${newStatus}`);
    updateDiagnosis(id, { status: newStatus });
    setLastAction(`Estado cambiado: ${diagnosis.status} → ${newStatus}`);
  };

  // Group diagnoses by type if needed
  const primaryDiagnoses = sessionDiagnoses.filter(d => d.type === DiagnosisType.PRIMARY);
  const secondaryDiagnoses = sessionDiagnoses.filter(d => d.type === DiagnosisType.SECONDARY);
  const otherDiagnoses = sessionDiagnoses.filter(
    d => d.type !== DiagnosisType.PRIMARY && d.type !== DiagnosisType.SECONDARY
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Diagnosis List Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-success-500" />
            <CardTitle>Diagnósticos</CardTitle>
            <Badge variant="default">{sessionDiagnoses.length}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBrowserOpen(true)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Añadir diagnóstico (ICD-11)</span>
            </Button>
            
            {/* Toggle grouping button (only if there are diagnoses) */}
            {sessionDiagnoses.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGroupByType(!groupByType)}
                title={groupByType ? "Ver lista simple" : "Agrupar por tipo"}
                className="h-8 w-8"
              >
                {groupByType ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Status message for last action */}
          {lastAction && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-sm flex items-center text-blue-800 dark:text-blue-300">
              <Info className="h-4 w-4 mr-2 flex-shrink-0" />
              <p>{lastAction}</p>
            </div>
          )}
        
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-5 w-5 animate-spin text-primary-500 mr-2" />
              <span>Cargando diagnósticos...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8 text-danger-500 dark:text-danger-400">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          ) : sessionDiagnoses.length === 0 ? (
            <div className="text-center p-8 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-dashed border-neutral-200 dark:border-neutral-700">
              <Stethoscope className="h-10 w-10 text-neutral-400 dark:text-neutral-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-1">No hay diagnósticos</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Utilice el botón para agregar diagnósticos utilizando ICD-11.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setBrowserOpen(true)}
                className="mx-auto"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Añadir diagnóstico
              </Button>
            </div>
          ) : groupByType ? (
            // Grouped display
            <div className="space-y-6">
              {/* Primary diagnoses */}
              {primaryDiagnoses.length > 0 && (
                <div>
                  <h3 className="flex items-center font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <Heart className="h-4 w-4 text-success-500 mr-2" />
                    Diagnósticos Principales
                  </h3>
                  <div className="space-y-2">
                    {primaryDiagnoses.map(diagnosis => (
                      <DiagnosisCard 
                        key={diagnosis.id}
                        diagnosis={diagnosis}
                        onToggleType={toggleDiagnosisType}
                        onToggleStatus={toggleDiagnosisStatus}
                        onDelete={handleDeleteDiagnosis}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Secondary diagnoses */}
              {secondaryDiagnoses.length > 0 && (
                <div>
                  <h3 className="flex items-center font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <Heart className="h-4 w-4 text-neutral-500 mr-2" />
                    Diagnósticos Secundarios
                  </h3>
                  <div className="space-y-2">
                    {secondaryDiagnoses.map(diagnosis => (
                      <DiagnosisCard 
                        key={diagnosis.id}
                        diagnosis={diagnosis}
                        onToggleType={toggleDiagnosisType}
                        onToggleStatus={toggleDiagnosisStatus}
                        onDelete={handleDeleteDiagnosis}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Other diagnoses */}
              {otherDiagnoses.length > 0 && (
                <div>
                  <h3 className="flex items-center font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <Heart className="h-4 w-4 text-info-500 mr-2" />
                    Otros Diagnósticos
                  </h3>
                  <div className="space-y-2">
                    {otherDiagnoses.map(diagnosis => (
                      <DiagnosisCard 
                        key={diagnosis.id}
                        diagnosis={diagnosis}
                        onToggleType={toggleDiagnosisType}
                        onToggleStatus={toggleDiagnosisStatus}
                        onDelete={handleDeleteDiagnosis}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Flat list
            <div className="space-y-2">
              {sessionDiagnoses.map(diagnosis => (
                <DiagnosisCard 
                  key={diagnosis.id}
                  diagnosis={diagnosis}
                  onToggleType={toggleDiagnosisType}
                  onToggleStatus={toggleDiagnosisStatus}
                  onDelete={handleDeleteDiagnosis}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Diagnosis Browser (opens when adding a new diagnosis) */}
      <DiagnosisBrowser
        sessionId={sessionId}
        isOpen={browserOpen}
        onClose={() => setBrowserOpen(false)}
        onDiagnosisSelected={handleDiagnosisSelected}
      />
    </div>
  );
};

// Simple diagnosis card component
interface DiagnosisCardProps {
  diagnosis: {
    id: string;
    code: string;
    title: string;
    titleSpanish?: string;
    type: DiagnosisType;
    status: DiagnosisStatus;
  };
  onToggleType: (id: string, type: DiagnosisType) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

const DiagnosisCard: React.FC<DiagnosisCardProps> = ({ 
  diagnosis, 
  onToggleType, 
  onToggleStatus,
  onDelete
}) => {
  const isPrimary = diagnosis.type === DiagnosisType.PRIMARY;
  const isRuledOut = diagnosis.status === DiagnosisStatus.RULED_OUT;
  
  return (
    <div 
      className={`p-3 rounded-lg border ${
        isRuledOut ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 opacity-70' : 
        isPrimary ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20' : 
        'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className={`flex-1 ${isRuledOut ? 'line-through' : ''}`}>
          <div className="flex items-center gap-2">
            {isPrimary && (
              <Badge variant="primary" withDot>Principal</Badge>
            )}
            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
              {diagnosis.titleSpanish || diagnosis.title}
            </h4>
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            ICD-11: {diagnosis.code}
          </div>
        </div>
        
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleType(diagnosis.id, diagnosis.type)}
            title={isPrimary ? "Cambiar a secundario" : "Cambiar a principal"}
            className="h-7 w-7"
          >
            {isPrimary ? (
              <Star className="h-4 w-4 text-primary-500" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleStatus(diagnosis.id)}
            title={isRuledOut ? "Marcar como confirmado" : "Marcar como descartado"}
            className="h-7 w-7"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(diagnosis.id)}
            title="Eliminar diagnóstico"
            className="h-7 w-7 text-danger-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisManagement;