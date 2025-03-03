// src/components/session/diagnosis/DiagnosisDrawer.tsx - VERSION 4 FIX
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Search, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  X,
  ArrowLeft,
  Info
} from 'lucide-react';

// Import our components and types
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ICDSelectedEntity, DiagnosisCreateData, DiagnosisType, DiagnosisStatus } from '@/types/diagnosis';

// IMPORTANT: We'll import the ECT package dynamically to avoid SSR issues
interface ECTHandler {
  configure: (settings: any, callbacks: any) => void;
  bind: (instanceId: string) => void;
  clear: (instanceId: string) => void;
  unbind: (instanceId: string) => void;
}

interface DiagnosisDrawerProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onDiagnosisSelected: (diagnosis: DiagnosisCreateData) => void;
}

const DiagnosisDrawer: React.FC<DiagnosisDrawerProps> = ({ 
  sessionId, 
  isOpen,
  onClose,
  onDiagnosisSelected
}) => {
  const instanceNo = useRef<string>(uuidv4());
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ECT, setECT] = useState<{ Handler: ECTHandler } | null>(null);
  const [searchDebug, setSearchDebug] = useState<{
    lastQuery: string;
    resultsFound: boolean;
    error: string | null;
  }>({
    lastQuery: '',
    resultsFound: false,
    error: null
  });

  // First, we need to dynamically import the ECT package
  useEffect(() => {
    if (!isOpen) return;

    const loadECTPackage = async () => {
      try {
        // Dynamically import the ECT package
        console.log('🔄 Loading ICD-11 ECT package...');
        
        // Load the ECT styles by injecting a style tag instead of importing the CSS module
        const loadStyles = () => {
          try {
            console.log('🎨 Injecting ECT styles...');
            // Check if styles are already loaded
            const existingStyle = document.getElementById('icd11ect-styles');
            if (existingStyle) {
              console.log('✅ ECT styles already loaded');
              return;
            }

            // Create style element
            const styleEl = document.createElement('style');
            styleEl.id = 'icd11ect-styles';
            // Basic styles for the ECT component
            styleEl.textContent = `
              .ctw-window {
                font-family: sans-serif;
                line-height: 1.5;
                overflow-y: auto;
              }
              .ctw-window * {
                box-sizing: border-box;
              }
              .ctw-window ul {
                list-style-type: none;
                padding: 0;
                margin: 0;
              }
              .ctw-window li {
                padding: 8px 12px;
                border-bottom: 1px solid #eee;
                cursor: pointer;
              }
              .ctw-window li:hover {
                background-color: #f5f5f5;
              }
              .ctw-window .ctw-result-info {
                font-size: 90%;
                color: #666;
              }
              .dark .ctw-window {
                color: #e0e0e0;
                background-color: #333;
              }
              .dark .ctw-window li {
                border-bottom: 1px solid #444;
              }
              .dark .ctw-window li:hover {
                background-color: #444;
              }
              .dark .ctw-window .ctw-result-info {
                color: #aaa;
              }
            `;
            document.head.appendChild(styleEl);
            console.log('✅ ECT styles loaded');
          } catch (err) {
            console.error('❌ Error loading ECT styles:', err);
          }
        };
        
        // Load the styles
        loadStyles();
        
        // Load the ECT module
        const ectModule = await import('@whoicd/icd11ect');
        console.log(`✅ ECT package loaded successfully`);
        setECT(ectModule);
      } catch (error) {
        console.error('❌ Failed to load ECT package:', error);
        setIsError(true);
      }
    };

    loadECTPackage();
  }, [isOpen]);

  // Monitor input changes for debugging
  useEffect(() => {
    if (!isOpen || !isInitialized) return;
    
    const handleInputChange = (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input && input.dataset.ctwIno === instanceNo.current) {
        const query = input.value;
        if (query.length >= 3) {
          console.log(`🔍 Search query: "${query}"`);
          setSearchDebug(prev => ({
            ...prev,
            lastQuery: query
          }));
        }
      }
    };
    
    // Monitor the search results container for changes
    const observeResults = () => {
      const resultsContainer = document.querySelector(`div[data-ctw-ino="${instanceNo.current}"]`);
      if (resultsContainer) {
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              // Check if we have results
              const hasResults = resultsContainer.querySelector('li') !== null;
              console.log(`📊 Search results found: ${hasResults}`);
              setSearchDebug(prev => ({
                ...prev,
                resultsFound: hasResults,
                error: hasResults ? null : 'No se encontraron resultados para la búsqueda'
              }));
            }
          }
        });
        
        observer.observe(resultsContainer, { childList: true, subtree: true });
        return () => observer.disconnect();
      }
    };
    
    // Add input event listeners
    const inputs = document.querySelectorAll(`input[data-ctw-ino="${instanceNo.current}"]`);
    inputs.forEach(input => {
      input.addEventListener('input', handleInputChange);
    });
    
    const cleanup = observeResults();
    
    return () => {
      inputs.forEach(input => {
        input.removeEventListener('input', handleInputChange);
      });
      if (cleanup) cleanup();
    };
  }, [isOpen, isInitialized]);

  // Configure ECT when the package is loaded
  useEffect(() => {
    if (!isOpen || !ECT || !ECT.Handler) return;

    const initializeECT = async () => {
      console.log('🔄 Initializing ICD-11 ECT component...');
      setIsLoading(true);
      try {
        instanceNo.current = uuidv4();
        console.log(`📌 Created new ECT instance: ${instanceNo.current}`);
        
        // Enhanced settings with proper search configuration
        const settings = {
          apiServerUrl: 'https://icd11restapi-developer-test.azurewebsites.net',
          autoBind: false,
          language: 'es',
          // Add specific search configuration that was missing
          searchConfig: {
            usePrecoordinated: true,
            useClaml: false,
            useFastMode: true,
            useFlexisearch: true,
            useRegExp: false,
            mode: 'wordParts',
            numberOfSuggestionsEntities: 20
          },
          // Make sure we specify the search method
          searchMethod: 'POST'
        };
        
        // Callback for when a diagnosis is selected
        const callbacks = {
          selectedEntityFunction: (selectedEntity: ICDSelectedEntity) => {
            console.log('✅ ICD-11 entity selected:', selectedEntity);
            
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
            
            console.log('📋 Created diagnosis object:', diagnosis);
            onDiagnosisSelected(diagnosis);
            
            // Clear the search input and results
            if (inputRef.current) {
              inputRef.current.value = '';
            }
            ECT.Handler.clear(instanceNo.current);
          },
          // Add log messages for other callback events for debugging
          errorFunction: (error: any) => {
            console.error('❌ ECT Error:', error);
            setSearchDebug(prev => ({
              ...prev,
              error: typeof error === 'string' ? error : 'Error en la búsqueda'
            }));
            setIsError(true);
          },
          // Track search results
          searchResultsFunction: (results: any) => {
            console.log('🔍 Search results:', results);
            const hasResults = results && results.length > 0;
            setSearchDebug(prev => ({
              ...prev,
              resultsFound: hasResults,
              error: hasResults ? null : 'No se encontraron resultados para la búsqueda'
            }));
          }
        };
        
        console.log('⚙️ Configuring ECT with settings:', settings);
        ECT.Handler.configure(settings, callbacks);
        
        // Short delay to ensure the DOM elements are ready
        setTimeout(() => {
          if (instanceNo.current) {
            console.log(`🔗 Binding ECT to instance: ${instanceNo.current}`);
            ECT.Handler.bind(instanceNo.current);
            setIsInitialized(true);
            setIsError(false);
          }
        }, 800); // Increased delay to ensure language resources are loaded
      } catch (error) {
        console.error('❌ Error initializing ICD-11 ECT:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeECT();

    // Cleanup function
    return () => {
      try {
        if (instanceNo.current && ECT.Handler) {
          console.log(`🧹 Cleaning up ECT instance: ${instanceNo.current}`);
          ECT.Handler.clear(instanceNo.current);
          ECT.Handler.unbind(instanceNo.current);
        }
      } catch (error) {
        console.error('❌ Error cleaning up ICD-11 ECT:', error);
      }
    };
  }, [isOpen, ECT, onDiagnosisSelected]);

  // Focus the input when drawer opens
  useEffect(() => {
    if (isOpen && inputRef.current && isInitialized) {
      console.log('🔍 Focusing search input');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 1000); // Increased delay to ensure component is fully initialized
    }
  }, [isOpen, isInitialized]);

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
                <button 
                  onClick={onClose}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-500 dark:text-neutral-500 dark:hover:text-neutral-400"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  Codificación de Diagnósticos ICD-11
                </h2>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-6">
              {isError ? (
                <div className="flex flex-col items-center justify-center p-8 text-danger-500 dark:text-danger-400">
                  <AlertTriangle className="h-10 w-10 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Error al cargar la herramienta de codificación</h3>
                  <p className="text-center mb-4">No se pudo inicializar la herramienta de búsqueda ICD-11</p>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setIsError(false);
                      setIsInitialized(false);
                      if (ECT && instanceNo.current) {
                        ECT.Handler.clear(instanceNo.current);
                        instanceNo.current = uuidv4();
                        setTimeout(() => {
                          ECT.Handler.bind(instanceNo.current);
                          setIsInitialized(true);
                        }, 800);
                      }
                    }}
                  >
                    Reintentar
                  </Button>
                </div>
              ) : isLoading || !isInitialized ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <RefreshCw className="h-10 w-10 animate-spin text-primary-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Cargando herramienta de codificación</h3>
                  <p className="text-center text-neutral-500 dark:text-neutral-400">
                    Espere mientras se inicializa la herramienta de búsqueda ICD-11...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="mb-4">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-4">
                      Busque diagnósticos utilizando términos en español:
                    </p>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
                      {/* Input for ICD-11 search */}
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
                  
                  {/* Container for ICD-11 search results */}
                  <div 
                    className="ctw-window border border-neutral-300 dark:border-neutral-600 rounded-md min-h-[500px] max-h-[65vh] bg-white dark:bg-neutral-700" 
                    data-ctw-ino={instanceNo.current}
                  ></div>
                  
                  {/* Search debug info */}
                  {searchDebug.lastQuery && (
                    <div className={`mt-2 px-3 py-2 text-xs rounded border ${
                      searchDebug.error 
                        ? 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-800' 
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                    }`}>
                      <div className="flex items-start">
                        <Info className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                        <div>
                          <div>Última búsqueda: <span className="font-medium">{searchDebug.lastQuery}</span></div>
                          {searchDebug.error && (
                            <div className="text-danger-600 dark:text-danger-400 mt-1">{searchDebug.error}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Debug info - useful to display what's going on with the ECT component */}
                  <div className="mt-2 px-3 py-2 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                    <div>ID de instancia: {instanceNo.current}</div>
                    <div>Estado: {isInitialized ? 'Inicializado' : 'No inicializado'}</div>
                  </div>
                  
                  {/* Help text */}
                  <div className="flex items-center p-4 bg-info-50 dark:bg-info-900/20 text-info-700 dark:text-info-300 rounded-md text-sm">
                    <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>
                      Seleccione un diagnóstico de la lista para agregarlo a la sesión
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisDrawer;