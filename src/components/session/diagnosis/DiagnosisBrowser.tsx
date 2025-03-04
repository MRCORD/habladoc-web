// src/components/session/diagnosis/DiagnosisBrowser.tsx
import React, { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, Info } from 'lucide-react';

// Import directly like in the sample
import * as ECT from '@whoicd/icd11ect';
// Import the CSS directly - make sure this is accessible
import '@whoicd/icd11ect/style.css';

import { Button } from '@/components/ui/button';
import { ICDSelectedEntity, DiagnosisCreateData, DiagnosisType, DiagnosisStatus } from '@/types/diagnosis';

interface DiagnosisBrowserProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onDiagnosisSelected: (diagnosis: DiagnosisCreateData) => void;
}

const DiagnosisBrowser: React.FC<DiagnosisBrowserProps> = ({ 
  sessionId, 
  isOpen,
  onClose,
  onDiagnosisSelected
}) => {
  // Create a stable instance ID
  const instanceNo = useRef(uuidv4());
  
  // Configure ECT when component mounts
  useEffect(() => {
    if (!isOpen) return;

    console.log('Initializing ICD-11 Embedded Browser...');
    
    // Configure the ECT with the Official WHO API
    const settings = {
      apiServerUrl: 'https://id.who.int',
      apiSecured: true,
      language: 'es', // Spanish
      browserHierarchyAvailable: true,
      browserSearchAvailable: true,
      browserAdvancedSearchAvailable: true,
      enableSelectButton: "all", // Enable select button for all entities
      height: "80vh", // Set a height for the browser
      sourceApp: "HablaDoc",
      autoBind: false
    };
    
    const callbacks = {
      // Called when the user selects an entity
      selectedEntityFunction: (selectedEntity: ICDSelectedEntity) => {
        console.log('ICD-11 entity selected:', selectedEntity);
        
        // Create a diagnosis object with the selected entity
        const diagnosis: DiagnosisCreateData = {
          code: selectedEntity.code,
          title: selectedEntity.title,
          titleSpanish: selectedEntity.title, // Already in Spanish
          type: DiagnosisType.PRIMARY,
          status: DiagnosisStatus.CONFIRMED,
          confidence: 0.9,
          icdUri: selectedEntity.linearizationUri,
        };
        
        onDiagnosisSelected(diagnosis);
      },
      // Function to get OAuth token - important for accessing the WHO API
      getNewTokenFunction: async () => {
        // In a production environment, this should call your backend
        // to avoid exposing credentials in frontend code
        try {
          // This is just a demonstration - in production, move this to your backend
          const clientId = 'f7574d19-c342-4d4a-ad9c-5c6c8dda6cb2_d2ee6484-98a6-4975-b1ca-131893a734a6';
          const clientSecret = 'kaLbknTsSH76516QJ/4FNJDva5pkD7IaD9UwxkVai4g=';
          
          // Example of how you might get a token
          // In reality, you should call a server endpoint that handles this securely
          console.log('Getting new token...');
          
          // This is a placeholder - replace with actual token acquisition logic
          // from your backend service
          const tokenUrl = '/api/icd/token'; // Your backend endpoint that securely gets the token
          const response = await fetch(tokenUrl);
          const data = await response.json();
          
          return data.token;
        } catch (error) {
          console.error('Error getting token:', error);
          // Provide a fallback or error handling
          return null;
        }
      },
      // Called when browser has fully loaded
      browserLoadedFunction: () => {
        console.log('ICD-11 Browser fully loaded!');
      },
      // Called when browser content changes
      browserChangedFunction: (browserContent: any) => {
        console.log('Browser content changed:', browserContent);
      },
      // Called when an error occurs
      errorFunction: (error: any) => {
        console.error('ECT Error:', error);
      }
    };
    
    console.log('Configuring ECT with settings:', settings);
    
    // Configure the ECT
    ECT.Handler.configure(settings, callbacks);
    
    // Bind the component after configuration
    setTimeout(() => {
      console.log(`Binding ECT Embedded Browser instance: ${instanceNo.current}`);
      ECT.Handler.bind(instanceNo.current);
    }, 100);
    
    // Clean up when component unmounts
    return () => {
      if (instanceNo.current) {
        console.log(`Cleaning up ECT Embedded Browser instance: ${instanceNo.current}`);
        // Clean up the ECT instance
        ECT.Handler.clear(instanceNo.current);
      }
    };
  }, [isOpen, onDiagnosisSelected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-white dark:bg-neutral-900 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between bg-white dark:bg-neutral-900 sticky top-0 z-10">
        <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">
          Codificación de Diagnósticos ICD-11
        </h2>
        <Button 
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Help text */}
        <div className="flex items-center p-4 mb-4 bg-info-50 dark:bg-info-900/20 text-info-700 dark:text-info-300 rounded-md text-sm">
          <Info className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>
            Navegue por la clasificación ICD-11 y seleccione un diagnóstico haciendo clic en el botón "Select" que aparece junto a cada entidad.
          </span>
        </div>
        
        {/* Embedded Browser Container */}
        <div 
          className="ctw-eb-window border border-neutral-300 dark:border-neutral-600 rounded-md overflow-hidden" 
          data-ctw-ino={instanceNo.current}
          style={{ height: "calc(80vh - 120px)" }}
        >
          {/* The Embedded Browser will be rendered here by the ECT library */}
        </div>
      </div>
    </div>
  );
};

export default DiagnosisBrowser;