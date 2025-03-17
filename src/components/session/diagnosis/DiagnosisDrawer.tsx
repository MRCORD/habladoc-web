// src/components/session/diagnosis/DiagnosisDrawer.tsx

import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Search, 
  Check, 
  ArrowLeft,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import directly like in the sample
import * as ECT from '@whoicd/icd11ect';
// Import the CSS directly - make sure this is accessible
import '@whoicd/icd11ect/style.css';

import { ICDSelectedEntity, DiagnosisCreateData, DiagnosisType, DiagnosisStatus } from '@/types/diagnosis';

interface DiagnosisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onDiagnosisSelected: (diagnosis: DiagnosisCreateData) => void;
}

const DiagnosisDrawer: React.FC<DiagnosisDrawerProps> = ({ 
  isOpen,
  onClose,
  onDiagnosisSelected
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Create a stable instance ID
  const instanceNo = useRef(uuidv4());
  const inputRef = useRef<HTMLInputElement>(null);

  // Configure ECT when component mounts
  useEffect(() => {
    if (!isOpen) return;
    
    console.log('Initializing ICD-11 ECT component...');
    const currentInstanceId = instanceNo.current; // Store ref value
    
    // Configure the ECT as in the example
    const settings = {
      apiServerUrl: 'https://icd11restapi-developer-test.azurewebsites.net',
      autoBind: false,
      language: 'es',
      linearizationName: "mms",
      releaseId: "2023-01"
    };
    
    const callbacks = {
      selectedEntityFunction: (selectedEntity: ICDSelectedEntity) => {
        console.log('ICD-11 entity selected:', selectedEntity);
        
        // Create a diagnosis object with the selected entity
        const diagnosis: DiagnosisCreateData = {
          code: selectedEntity.code,
          title: selectedEntity.title,
          titleSpanish: selectedEntity.title,
          type: DiagnosisType.PRIMARY,
          status: DiagnosisStatus.CONFIRMED,
          confidence: 0.9,
          icdUri: selectedEntity.linearizationUri,
        };
        
        onDiagnosisSelected(diagnosis);
        
        // Clear the search input and results
        ECT.Handler.clear(currentInstanceId);
      },
      errorFunction: (error: Error | string) => {
        console.error('ECT Error:', error);
      }
    };
    
    console.log('Configuring ECT with settings:', settings);
    ECT.Handler.configure(settings, callbacks);
    
    // Bind the component after configuration
    setTimeout(() => {
      console.log(`Binding ECT instance: ${currentInstanceId}`);
      ECT.Handler.bind(currentInstanceId);
    }, 100);
    
    // Focus the input when everything is ready
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
    
    // Clean up when component unmounts
    return () => {
      console.log(`Cleaning up ECT instance: ${currentInstanceId}`);
      ECT.Handler.clear(currentInstanceId);
    };
  }, [isOpen, onDiagnosisSelected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // The ICD component handles the diagnosis selection through its callback
      // This submit handler is just for UX feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-2xl">
          {/* Drawer content */}
          <div className="h-full flex flex-col bg-white dark:bg-neutral-800 shadow-xl overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between bg-white dark:bg-neutral-800 sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  Diagnósticos
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="mb-4">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4">
                    Busque diagnósticos utilizando términos en español:
                  </p>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
                    {/* Input for ICD-11 search - exactly as in the example */}
                    <input
                      ref={inputRef}
                      type="text"
                      className="ctw-input w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary dark:bg-neutral-700 dark:text-neutral-100 shadow-sm"
                      placeholder="Buscar diagnóstico..."
                      autoComplete="off"
                      data-ctw-ino={instanceNo.current}
                    />
                  </div>
                  
                  <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Escriba al menos 3 caracteres para iniciar la búsqueda
                  </div>
                </div>
                
                {/* Container for ICD-11 search results - exactly as in the example */}
                <div 
                  className="ctw-window border border-neutral-300 dark:border-neutral-600 rounded-md min-h-[500px] max-h-[65vh] bg-white dark:bg-neutral-700" 
                  data-ctw-ino={instanceNo.current}
                ></div>
                
                {/* Help text */}
                <div className="flex items-center p-4 bg-info-50 dark:bg-info-900/20 text-info-700 dark:text-info-300 rounded-md text-sm">
                  <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>
                    Seleccione un diagnóstico de la lista para agregarlo a la sesión
                  </span>
                </div>
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisDrawer;