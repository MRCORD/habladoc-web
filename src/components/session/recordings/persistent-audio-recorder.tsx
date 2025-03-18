import React, { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the recorder component with no SSR
const AudioRecorderComponent = dynamic(
  () => import('@/components/session/recordings/audio-recorder'),
  { ssr: false }
);

// Create a context to manage recorder state
interface RecorderContextType {
  onRecordingComplete: () => void;
}

const RecorderContext = React.createContext<RecorderContextType | undefined>(undefined);

// Provider component that will be placed at the top level
export const RecorderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const recordingCompleteCallbackRef = useRef<() => void>(() => {});
  
  const contextValue = {
    onRecordingComplete: () => {
      if (recordingCompleteCallbackRef.current) {
        recordingCompleteCallbackRef.current();
      }
    },
    setRecordingCompleteCallback: (callback: () => void) => {
      recordingCompleteCallbackRef.current = callback;
    }
  };

  return (
    <RecorderContext.Provider value={contextValue}>
      {children}
    </RecorderContext.Provider>
  );
};

// Custom hook to use the recorder context
export const useRecorder = () => {
  const context = React.useContext(RecorderContext);
  if (!context) {
    throw new Error('useRecorder must be used within a RecorderProvider');
  }
  return context;
};

// The audio recorder component that will remain stable across renders
const PersistentAudioRecorder: React.FC<{
  sessionId: string;
  doctorId: string;
  onRecordingComplete: () => void;
}> = React.memo(({ sessionId, doctorId, onRecordingComplete }) => {
  // Use ref to store the callback to prevent re-renders
  const callbackRef = useRef(onRecordingComplete);
  
  // Update the ref when the callback changes
  useEffect(() => {
    callbackRef.current = onRecordingComplete;
  }, [onRecordingComplete]);
  
  // Wrap the callback to use the ref
  const stableCallback = () => {
    callbackRef.current();
  };
  
  return (
    <AudioRecorderComponent
      sessionId={sessionId}
      doctorId={doctorId}
      onRecordingComplete={stableCallback}
    />
  );
});

PersistentAudioRecorder.displayName = 'PersistentAudioRecorder';

export default PersistentAudioRecorder;