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

// Custom styling to override ECT styles for dark mode
// Using :root.dark to ensure higher specificity
const customStyles = `
  /* Global container styling */
  :root .ctw-eb-window,
  :root .ctw-eb-window * {
    background-color: #0f172a !important; /* Dark navy */
    color: #f9fafb !important;
    border-color: #334155 !important;
  }
  
  /* Main window/container */
  :root .ctw-eb-window {
    border-radius: 0.375rem !important;
    overflow: hidden !important;
  }
  
  /* Results area styling */
  :root .ctw-eb-window .ctw-browser-content,
  :root .ctw-eb-window .ctw-result-content,
  :root .ctw-eb-window .ctw-searching .ctw-result-container {
    background-color: #1e293b !important; /* Slightly lighter navy */
  }
  
  /* Tree/hierarchy styling */
  :root .ctw-eb-window .ctw-eb-hierarchy-container,
  :root .ctw-eb-window .ctw-tree {
    background-color: #0f172a !important; /* Dark navy */
    border-right: 1px solid #334155 !important;
  }
  
  :root .ctw-eb-window .ctw-tree-node,
  :root .ctw-eb-window .ctw-tree-node-content {
    background-color: transparent !important;
    border-color: #334155 !important;
  }
  
  :root .ctw-eb-window .ctw-tree-node-expanded > .ctw-tree-node-content {
    background-color: #1e293b !important;
  }
  
  /* Links styling */
  :root .ctw-eb-window a,
  :root .ctw-eb-window a:visited {
    color: #60a5fa !important; /* Blue for links */
  }
  
  :root .ctw-eb-window a:hover {
    color: #93c5fd !important; /* Lighter blue on hover */
    text-decoration: underline !important;
  }
  
  /* Search result items */
  :root .ctw-eb-window .ctw-result-item {
    border-color: #334155 !important;
    border-width: 0 0 1px 0 !important;
    padding: 8px 4px !important;
  }
  
  :root .ctw-eb-window .ctw-result-item:hover {
    background-color: #1e293b !important;
  }
  
  /* Search highlight - orange to match screenshot */
  :root .ctw-eb-window .ctw-highlight,
  :root .ctw-eb-window .ctw-browser-content .ctw-highlight,
  :root .ctw-eb-window .ctw-result-icd11-title .ctw-highlight {
    color: #f97316 !important; /* Orange */
    background-color: transparent !important;
    font-weight: normal !important;
  }
  
  /* Buttons */
  :root .ctw-eb-window button,
  :root .ctw-eb-window .ctw-button,
  :root .ctw-eb-window .ctw-result-actions button {
    background-color: #1e40af !important; /* Dark blue */
    color: white !important;
    border-color: #1e3a8a !important;
    border-radius: 0.25rem !important;
    box-shadow: none !important;
  }
  
  :root .ctw-eb-window button:hover,
  :root .ctw-eb-window .ctw-button:hover,
  :root .ctw-eb-window .ctw-result-actions button:hover {
    background-color: #2563eb !important; /* Lighter blue on hover */
  }
  
  /* Form inputs */
  :root .ctw-eb-window input,
  :root .ctw-eb-window .ctw-input,
  :root .ctw-eb-window select,
  :root .ctw-eb-window .ctw-select {
    background-color: #0f172a !important;
    color: #f9fafb !important;
    border-color: #334155 !important;
    border-radius: 0.25rem !important;
  }
  
  :root .ctw-eb-window ::placeholder {
    color: #9ca3af !important;
  }
  
  /* Message boxes (e.g., incomplete results) */
  :root .ctw-eb-window .ctw-message-box {
    background-color: #1e293b !important;
    border-color: #334155 !important;
    color: #f97316 !important; /* Orange */
    padding: 8px !important;
  }
  
  /* Advanced search toggle button */
  :root .ctw-eb-window .ctw-advanced-search-btn {
    color: #f59e0b !important; /* Amber */
  }
  
  /* Entity titles */
  :root .ctw-eb-window .ctw-entity-title {
    background-color: #1e293b !important;
    color: white !important;
    padding: 8px !important;
  }
  
  /* Typography improvements */
  :root .ctw-eb-window *,
  :root .ctw-eb-window button,
  :root .ctw-eb-window input,
  :root .ctw-eb-window select {
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
  }
  
  /* Selected tab styling */
  :root .ctw-eb-window .ctw-tab-selected {
    background-color: #2563eb !important;
    color: white !important;
  }
  
  /* Clear any box shadows */
  :root .ctw-eb-window * {
    box-shadow: none !important;
  }
`;

const DiagnosisBrowser: React.FC<DiagnosisBrowserProps> = ({ 
  sessionId, 
  isOpen,
  onClose,
  onDiagnosisSelected
}) => {
  // Create a stable instance ID
  const instanceNo = useRef(uuidv4());
  const styleElRef = useRef<HTMLStyleElement | null>(null);
  
  // Apply custom styles
  useEffect(() => {
    if (isOpen) {
      // Ensure dark class is added to root
      document.documentElement.classList.add('dark');
      
      // Inject custom styles for dark mode
      const styleEl = document.createElement('style');
      styleEl.id = 'ect-custom-styles';
      styleEl.innerHTML = customStyles;
      document.head.appendChild(styleEl);
      styleElRef.current = styleEl;
      
      return () => {
        // Clean up styles when component unmounts
        if (styleElRef.current) {
          styleElRef.current.remove();
        }
      };
    }
  }, [isOpen]);
  
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
      height: "75vh", // Set a height for the browser
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
        try {
          // Call the backend endpoint to get a token
          console.log('Getting new token...');
          
          const tokenUrl = '/api/icd/token';
          const response = await fetch(tokenUrl);
          const data = await response.json();
          
          return data.token;
        } catch (error) {
          console.error('Error getting token:', error);
          return null;
        }
      },
      // Called when browser has fully loaded
      browserLoadedFunction: () => {
        console.log('ICD-11 Browser fully loaded!');
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0f172a] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#334155] flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-xl font-medium text-white">
          Codificación de Diagnósticos ICD-11
        </h2>
        <Button 
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full text-white hover:bg-[#1e293b]"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Help text */}
        <div className="flex items-center p-4 mb-4 bg-[#1e3a8a]/20 text-blue-300 rounded-md text-sm border border-[#2563eb]/30">
          <Info className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>
            Navegue por la clasificación ICD-11 y seleccione un diagnóstico haciendo clic en el botón "Select" que aparece junto a cada entidad.
          </span>
        </div>
        
        {/* Embedded Browser Container */}
        <div 
          className="ctw-eb-window border border-[#334155] rounded-md overflow-hidden" 
          data-ctw-ino={instanceNo.current}
          style={{ height: "calc(75vh - 100px)" }}
        >
          {/* The Embedded Browser will be rendered here by the ECT library */}
        </div>
      </div>
    </div>
  );
};

export default DiagnosisBrowser;