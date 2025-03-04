// src/components/session/diagnosis/DiagnosisBrowser.tsx
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, Info } from 'lucide-react';

// Import directly like in the sample
import * as ECT from '@whoicd/icd11ect';
// Import the CSS directly - make sure this is accessible
import '@whoicd/icd11ect/style.css';

import { Button } from '@/components/ui/button';
import { ICDSelectedEntity, DiagnosisCreateData, DiagnosisType, DiagnosisStatus } from '@/types/diagnosis';
import { useTheme } from '@/components/theme/theme-provider';

interface DiagnosisBrowserProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onDiagnosisSelected: (diagnosis: DiagnosisCreateData) => void;
}

// Custom styling to override ECT styles for light and dark modes
const lightModeStyles = `
  /* Global container styling */
  :root .ctw-eb-window,
  :root .ctw-eb-window * {
    background-color: #ffffff !important;
    color: #1e293b !important;
    border-color: #e2e8f0 !important;
  }
  
  /* Main window/container */
  :root .ctw-eb-window {
    border-radius: 0.375rem !important;
    overflow: auto !important;
    height: 100% !important;
  }
  
  /* Results area styling */
  :root .ctw-eb-window .ctw-browser-content,
  :root .ctw-eb-window .ctw-result-content,
  :root .ctw-eb-window .ctw-searching .ctw-result-container {
    background-color: #f8fafc !important;
    overflow: auto !important;
  }
  
  /* Tree/hierarchy styling */
  :root .ctw-eb-window .ctw-eb-hierarchy-container,
  :root .ctw-eb-window .ctw-tree {
    background-color: #ffffff !important;
    border-right: 1px solid #e2e8f0 !important;
    overflow: auto !important;
    max-height: none !important;
  }
  
  :root .ctw-eb-window .ctw-tree-node,
  :root .ctw-eb-window .ctw-tree-node-content {
    background-color: transparent !important;
    border-color: #e2e8f0 !important;
  }
  
  :root .ctw-eb-window .ctw-tree-node-expanded > .ctw-tree-node-content {
    background-color: #f1f5f9 !important;
  }
  
  /* Links styling */
  :root .ctw-eb-window a,
  :root .ctw-eb-window a:visited {
    color: #3b82f6 !important; /* Blue for links */
  }
  
  :root .ctw-eb-window a:hover {
    color: #2563eb !important; /* Darker blue on hover */
    text-decoration: underline !important;
  }
  
  /* Search result items */
  :root .ctw-eb-window .ctw-result-item {
    border-color: #e2e8f0 !important;
    border-width: 0 0 1px 0 !important;
    padding: 8px 4px !important;
  }
  
  :root .ctw-eb-window .ctw-result-item:hover {
    background-color: #f1f5f9 !important;
  }
  
  /* Search highlight */
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
    background-color: #2563eb !important; /* Blue */
    color: white !important;
    border-color: #1d4ed8 !important;
    border-radius: 0.25rem !important;
    box-shadow: none !important;
  }
  
  :root .ctw-eb-window button:hover,
  :root .ctw-eb-window .ctw-button:hover,
  :root .ctw-eb-window .ctw-result-actions button:hover {
    background-color: #1d4ed8 !important; /* Darker blue on hover */
  }
  
  /* Form inputs */
  :root .ctw-eb-window input,
  :root .ctw-eb-window .ctw-input,
  :root .ctw-eb-window select,
  :root .ctw-eb-window .ctw-select {
    background-color: #ffffff !important;
    color: #1e293b !important;
    border-color: #e2e8f0 !important;
    border-radius: 0.25rem !important;
  }
  
  :root .ctw-eb-window ::placeholder {
    color: #94a3b8 !important;
  }
  
  /* Message boxes (e.g., incomplete results) */
  :root .ctw-eb-window .ctw-message-box {
    background-color: #f8fafc !important;
    border-color: #e2e8f0 !important;
    color: #f97316 !important; /* Orange */
    padding: 8px !important;
  }
  
  /* Advanced search toggle button */
  :root .ctw-eb-window .ctw-advanced-search-btn {
    color: #f59e0b !important; /* Amber */
  }
  
  /* Entity titles */
  :root .ctw-eb-window .ctw-entity-title {
    background-color: #f8fafc !important;
    color: #1e293b !important;
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
  
  /* Fix for scrolling to the bottom */
  :root .ctw-eb-window .ctw-result-container {
    padding-bottom: 60px !important;
  }
  
  :root .ctw-eb-window .ctw-tree {
    padding-bottom: 60px !important;
  }
  
  /* Fix internal browser height */
  :root .ctw-eb-window .ctw-content {
    height: 100% !important;
    max-height: none !important;
  }
  
  :root .ctw-eb-window .ctw-browser-content {
    height: 100% !important;
    max-height: none !important;
  }
`;

// Dark mode styles - same structure but with dark colors
const darkModeStyles = `
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
    overflow: auto !important;
    height: 100% !important;
  }
  
  /* Results area styling */
  :root .ctw-eb-window .ctw-browser-content,
  :root .ctw-eb-window .ctw-result-content,
  :root .ctw-eb-window .ctw-searching .ctw-result-container {
    background-color: #1e293b !important; /* Slightly lighter navy */
    overflow: auto !important;
  }
  
  /* Tree/hierarchy styling */
  :root .ctw-eb-window .ctw-eb-hierarchy-container,
  :root .ctw-eb-window .ctw-tree {
    background-color: #0f172a !important; /* Dark navy */
    border-right: 1px solid #334155 !important;
    overflow: auto !important;
    max-height: none !important;
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
  
  /* Fix for scrolling to the bottom */
  :root .ctw-eb-window .ctw-result-container {
    padding-bottom: 60px !important;
  }
  
  :root .ctw-eb-window .ctw-tree {
    padding-bottom: 60px !important;
  }
  
  /* Fix internal browser height */
  :root .ctw-eb-window .ctw-content {
    height: 100% !important;
    max-height: none !important;
  }
  
  :root .ctw-eb-window .ctw-browser-content {
    height: 100% !important;
    max-height: none !important;
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
  
  // Get the current theme from the theme provider
  const { theme, isDarkMode } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(isDarkMode ? 'dark' : 'light');

  // Effect to manage body scroll
  useEffect(() => {
    if (isOpen) {
      // Disable body scroll
      document.body.style.overflow = 'hidden';
    }
    return () => {
      // Re-enable body scroll on cleanup
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // Update current theme when isDarkMode changes
  useEffect(() => {
    setCurrentTheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
  
  // Apply custom styles based on the current theme
  useEffect(() => {
    if (isOpen) {
      // Use the appropriate styles based on the current theme
      const styles = currentTheme === 'dark' ? darkModeStyles : lightModeStyles;
      
      // Remove existing style element if it exists
      if (styleElRef.current) {
        styleElRef.current.remove();
        styleElRef.current = null;
      }
      
      // Inject custom styles for the current theme mode
      const styleEl = document.createElement('style');
      styleEl.id = 'ect-custom-styles';
      styleEl.innerHTML = styles;
      document.head.appendChild(styleEl);
      styleElRef.current = styleEl;
    }
    
    return () => {
      // Clean up styles when component unmounts or theme changes
      if (styleElRef.current) {
        styleElRef.current.remove();
        styleElRef.current = null;
      }
    };
  }, [isOpen, currentTheme]);
  
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
      // No fixed height - let the container determine sizing
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
    <>
      {/* Full viewport dark transparent backdrop with higher z-index */}
      <div 
        className="fixed inset-0 z-[80] bg-black/60" 
        onClick={onClose}
      />
      
      {/* Modal dialog - sized with margins on all sides, with higher z-index to be above backdrop */}
      <div 
        className={`fixed z-[90] top-20 bottom-16 left-20 right-20 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full w-full flex flex-col">
          {/* Header - now sticky within the modal */}
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between bg-inherit`}>
            <h2 className={`text-xl font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Codificación de Diagnósticos ICD-11
            </h2>
            <Button 
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={`rounded-full ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} hover:bg-opacity-10`}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Expanded content container to fill remaining space */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Help text */}
            <div className={`flex items-center p-4 mx-6 mt-6 rounded-md text-sm border ${
              isDarkMode 
                ? 'bg-blue-900/30 text-blue-300 border-blue-800' 
                : 'bg-blue-50 text-blue-700 border-blue-100'
            }`}>
              <Info className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                Navegue por la clasificación ICD-11 y seleccione un diagnóstico haciendo clic en el botón "Select" que aparece junto a cada entidad.
              </span>
            </div>
            
            {/* Embedded Browser Container with explicit overflow settings */}
            <div className="mx-6 mt-4 mb-6 flex-1 overflow-hidden flex flex-col">
              <div 
                className={`ctw-eb-window border rounded-md flex-1 overflow-auto ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
                data-ctw-ino={instanceNo.current}
                style={{ height: "100%" }}
              >
                {/* The Embedded Browser will be rendered here by the ECT library */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DiagnosisBrowser;