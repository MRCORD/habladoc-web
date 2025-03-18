// Modified version of src/components/session/recordings/audio-recorder.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Mic, 
  Square, 
  Pause, 
  Play, 
  Upload, 
  Trash2, 
  AlertCircle,
  Loader2
} from "lucide-react";
import RecordRTC from "recordrtc";
import { recordingsStorage } from "@/lib/recordings";
import api from "@/lib/api";
import type { RecordingCreateData } from "@/types";
import { RecordingStatus } from "@/types";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Button } from '@/components/ui/button';

interface AudioRecorderProps {
  sessionId: string;
  doctorId: string;
  onRecordingComplete: () => void;
  className?: string;
}

// RecordRTC instance type
type RecordRTCType = RecordRTC & {
  startRecording: () => void;
  stopRecording: (callback: () => void) => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  getBlob: () => Blob;
};

// Recording state type
interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUrl: string | null;
  isUploading: boolean;
  error: string | null;
  audioLevel: number;
}

const DEFAULT_STATE: RecordingState = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  audioUrl: null,
  isUploading: false,
  error: null,
  audioLevel: 0
};

// Update MIME type and file extension constants
const RECORD_MIME_TYPE = 'audio/webm'; // Format for recording
const STORAGE_MIME_TYPE = 'audio/mpeg'; // Format for storage
const FILE_EXTENSION = 'mp3'; // Storage file extension

// Create FFmpeg instance once
const ffmpeg = typeof window !== 'undefined' ? new FFmpeg() : null;

// Add type definition for WebKit AudioContext
interface WebKitAudioContext extends AudioContext {
  createMediaStreamSource(stream: MediaStream): MediaStreamAudioSourceNode;
}

// Using React.memo to prevent unnecessary re-renders
const AudioRecorder: React.FC<AudioRecorderProps> = React.memo(({ 
  sessionId,
  doctorId,
  onRecordingComplete,
  className = ""
}: AudioRecorderProps) => {
  // Create a ref for the onRecordingComplete callback
  const onRecordingCompleteRef = useRef(onRecordingComplete);
  
  // Update the ref when the callback changes
  useEffect(() => {
    onRecordingCompleteRef.current = onRecordingComplete;
  }, [onRecordingComplete]);

  // State
  const [state, setState] = useState<RecordingState>(DEFAULT_STATE);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load FFmpeg only once with useEffect
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        if (!ffmpeg || ffmpegLoaded) return; // Skip if already loaded
        
        setFfmpegLoading(true);
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setFfmpegLoaded(true);
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        setState(prev => ({
          ...prev,
          error: 'Error al cargar el convertidor de audio'
        }));
      } finally {
        setFfmpegLoading(false);
      }
    };
    
    if (typeof window !== 'undefined' && !ffmpegLoaded) {
      loadFFmpeg();
    }
    
    // This component is being unmounted
    return () => {
      console.log('AudioRecorder component is unmounting');
    };
  }, [ffmpegLoaded]);

  // Refs - keep stable across renders
  const recordRtcRef = useRef<RecordRTCType | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  // Create a session ID ref to prevent issues with stale captures in closures
  const sessionIdRef = useRef(sessionId);
  const doctorIdRef = useRef(doctorId);
  
  // Update refs when props change
  useEffect(() => {
    sessionIdRef.current = sessionId;
    doctorIdRef.current = doctorId;
  }, [sessionId, doctorId]);

  // Cleanup function - use useCallback to stabilize the reference
  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    
    if (typeof window !== "undefined" && state.audioUrl) {
      window.URL.revokeObjectURL(state.audioUrl);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
      analyserRef.current = null;
      dataArrayRef.current = null;
    }
  }, [state.audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Set up audio analysis for volume indicators - stablized with useCallback
  const setupAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      // Create audio context with proper typing
      const AudioContext = window.AudioContext || (window as { webkitAudioContext?: new () => WebKitAudioContext }).webkitAudioContext;
      if (!AudioContext) {
        throw new Error('AudioContext not supported');
      }
      audioContextRef.current = new AudioContext();
      
      // Create analyser node
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // Connect stream to analyser
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Create data array for analysis
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      // Start volume analysis
      volumeIntervalRef.current = setInterval(() => {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          
          // Calculate average volume
          const average = dataArrayRef.current.reduce((acc, val) => acc + val, 0) / 
                          dataArrayRef.current.length;
          
          // Normalize to 0-1 range and update state
          const normalizedLevel = Math.min(1, average / 128);
          setState(prev => ({
            ...prev,
            audioLevel: normalizedLevel
          }));
        }
      }, 100);
      
      setShowVolumeIndicator(true);
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
      setShowVolumeIndicator(false);
    }
  }, []);

  // Start recording - stabilized with useCallback
  const startRecording = useCallback(async () => {
    try {
      cleanup();
      setState({ ...DEFAULT_STATE });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Set up audio analysis for volume indicators
      setupAudioAnalysis(stream);

      recordRtcRef.current = new RecordRTC(stream, {
        type: "audio",
        mimeType: RECORD_MIME_TYPE,
        recorderType: RecordRTC.MediaStreamRecorder,
        timeSlice: 1000,
        desiredSampRate: 16000,
        numberOfAudioChannels: 1,
      });

      recordRtcRef.current.startRecording();
      startTimeRef.current = Date.now();
      
      durationIntervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
          isRecording: true
        }));
      }, 1000);

    } catch (err) {
      console.error("startRecording error:", err);
      setState(prev => ({
        ...prev,
        error: "No se pudo acceder al micrófono"
      }));
    }
  }, [cleanup, setupAudioAnalysis]);

  // Convert WebM to MP3 - stabilized with useCallback
  const convertToMp3 = useCallback(async (webmBlob: Blob) => {
    if (!ffmpeg || !ffmpegLoaded) {
      throw new Error('FFmpeg not loaded');
    }

    const webmFile = new File([webmBlob], 'recording.webm', { type: 'audio/webm' });
    await ffmpeg.writeFile('recording.webm', await fetchFile(webmFile));

    // Add better audio conversion parameters
    await ffmpeg.exec([
      '-i', 'recording.webm',
      '-c:a', 'libmp3lame',
      '-b:a', '128k',
      '-ar', '44100',
      'recording.mp3'
    ]);

    const mp3Data = await ffmpeg.readFile('recording.mp3');
    const mp3Blob = new Blob([mp3Data], { type: STORAGE_MIME_TYPE });
    const mp3Url = URL.createObjectURL(mp3Blob);

    // Clean up ffmpeg virtual filesystem
    await ffmpeg.deleteFile('recording.webm');
    await ffmpeg.deleteFile('recording.mp3');

    return { mp3Blob, mp3Url };
  }, [ffmpegLoaded]);

  // Stop recording - stabilized with useCallback
  const stopRecording = useCallback(() => {
    if (!recordRtcRef.current) return;

    // Stop volume analysis
    setShowVolumeIndicator(false);
    
    recordRtcRef.current.stopRecording(async () => {
      const webmBlob = recordRtcRef.current?.getBlob();
      if (webmBlob && typeof window !== 'undefined') {
        setState(prev => ({ ...prev, isRecording: false, isPaused: false }));
        try {
          const { mp3Url } = await convertToMp3(webmBlob);
          setState(prev => ({
            ...prev,
            audioUrl: mp3Url,
          }));
        } catch (error) {
          console.error('Conversion error:', error);
          setState(prev => ({
            ...prev,
            error: "Error al convertir la grabación"
          }));
        }
      }
      recordRtcRef.current = null;
    });

    cleanup();
  }, [cleanup, convertToMp3]);

  // Pause/Resume recording - stabilized with useCallback
  const togglePause = useCallback(() => {
    if (!recordRtcRef.current || !state.isRecording) return;

    if (state.isPaused) {
      recordRtcRef.current.resumeRecording();
      const pausedTime = Date.now() - (startTimeRef.current + state.duration * 1000);
      startTimeRef.current = Date.now() - state.duration * 1000 + pausedTime;

      durationIntervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000)
        }));
      }, 1000);
      
      // Resume volume analysis
      setShowVolumeIndicator(true);
    } else {
      recordRtcRef.current.pauseRecording();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      // Pause volume analysis
      setShowVolumeIndicator(false);
    }

    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, [state.isRecording, state.isPaused, state.duration]);

  // Discard recording - stabilized with useCallback
  const discardRecording = useCallback(() => {
    cleanup();
    setState(DEFAULT_STATE);
    recordRtcRef.current = null;
  }, [cleanup]);

  // Upload recording - stabilized with useCallback
  const uploadRecording = useCallback(async () => {
    if (!state.audioUrl || state.isUploading) return;
    setState(prev => ({ ...prev, isUploading: true, error: null }));

    // Use refs to get the current session and doctor IDs
    const currentSessionId = sessionIdRef.current;
    const currentDoctorId = doctorIdRef.current;
    let uploadedFilePath = '';

    try {
      const response = await fetch(state.audioUrl);
      const blob = await response.blob();

      // Upload to storage
      const uploadResult = await recordingsStorage.upload(blob, currentDoctorId, currentSessionId);
      if (uploadResult.error) throw uploadResult.error;

      uploadedFilePath = uploadResult.path;

      // Create recording record
      const recordingData: RecordingCreateData = {
        session_id: currentSessionId,
        duration: state.duration,
        file_path: uploadedFilePath,
        file_size: uploadResult.size,
        mime_type: STORAGE_MIME_TYPE,
        status: RecordingStatus.PENDING,
        detected_components: null,
        metadata: {
          sample_rate: 44100,
          channels: 1,
          duration_seconds: state.duration,
          original_name: `recording-${new Date().toISOString()}.${FILE_EXTENSION}`
        }
      };

      const recordingResponse = await api.post("/api/v1/recordings", recordingData);

      if (!recordingResponse.data.success) {
        throw new Error(recordingResponse.data.message || "Failed to save recording");
      }

      // Start processing pipeline and wait for initial processing
      const recordingId = recordingResponse.data.data.id;
      await api.post(`/api/v1/processing/recordings/${recordingId}/process`);

      // Wait a moment to ensure the processing has started
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Reset state and notify parent to refresh recordings using the ref
      setState(DEFAULT_STATE);
      onRecordingCompleteRef.current();

    } catch (err) {
      console.error('Upload process error:', err);
      
      // Cleanup uploaded file if record creation failed
      if (uploadedFilePath) {
        try {
          await recordingsStorage.delete(uploadedFilePath);
        } catch (deleteErr) {
          console.error('Failed to clean up file:', deleteErr);
        }
      }

      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Error al subir la grabación',
        isUploading: false
      }));
    }
  }, [state.audioUrl, state.isUploading, state.duration]);

  // Format timer display
  const formattedDuration = () => {
    const minutes = Math.floor(state.duration / 60);
    const seconds = (state.duration % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // Add console logs to track component lifecycle
  useEffect(() => {
    console.log('AudioRecorder mounted or updated with sessionId:', sessionId);
    return () => {
      console.log('AudioRecorder unmounting with sessionId:', sessionId);
    };
  }, [sessionId]);

  return (
    <div className={`fixed bottom-6 left-0 right-0 z-[55] flex justify-center items-center ${className}`}>
      {/* Glowing background effect */}
      <div className="absolute h-14 w-14 bg-red-500/30 dark:bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
      
      {ffmpegLoading && (
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30 flex items-center justify-center z-10 backdrop-blur-sm rounded-full">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            <span className="text-sm font-medium">Cargando audio...</span>
          </div>
        </div>
      )}
      
      {state.error && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 p-2.5 bg-red-50 dark:bg-red-900/90 text-red-700 dark:text-red-300 rounded-full border border-red-200 dark:border-red-800/50 text-sm flex items-center shadow-md">
          <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
          <span className="max-w-xs truncate">{state.error}</span>
        </div>
      )}

      {!state.audioUrl ? (
        // Recording state - Larger more noticeable floating pill
        <div className="bg-white/95 dark:bg-gray-800/95 shadow-xl rounded-full py-2.5 px-5 border border-gray-200 dark:border-gray-700 backdrop-blur-sm flex items-center gap-4 max-w-md">
          {!state.isRecording ? (
            // Initial state - just record button with label
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Grabar audio</span>
              <button
                onClick={startRecording}
                disabled={ffmpegLoading || !ffmpegLoaded}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-md relative group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-100 animate-pulse"
                title="Iniciar grabación"
              >
                <Mic className="h-5 w-5" />
              </button>
            </div>
          ) : (
            // Recording state - timer, waveform, controls
            <>
              {/* Recording indicator */}
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-sm font-medium text-red-500">REC</span>
              </div>
              
              {/* Timer display */}
              <div className="flex items-center">
                <span className="text-base font-mono text-gray-700 dark:text-gray-300 tabular-nums font-medium min-w-[48px]">
                  {formattedDuration()}
                </span>
              </div>
              
              {/* Volume indicator */}
              {showVolumeIndicator && (
                <div className="flex-1 px-2 max-w-[140px]">
                  <div className="flex items-end h-8 gap-[2px] justify-center">
                    {[...Array(12)].map((_, index) => (
                      <div 
                        key={index}
                        className={`w-[3px] rounded-full ${
                          state.isPaused 
                            ? 'bg-gray-300 dark:bg-gray-600' 
                            : state.audioLevel > index * 0.08
                              ? 'bg-blue-500 dark:bg-blue-400'
                              : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                        style={{ 
                          height: state.isPaused 
                            ? 4 
                            : state.audioLevel > index * 0.08 
                              ? Math.max(4, Math.min(24, state.audioLevel * 35 - index)) 
                              : 4 
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Control buttons during recording */}
              <div className="flex items-center gap-2">
                {/* Pause/Resume */}
                <Button
                  variant={state.isPaused ? "primary" : "warning"}
                  size="icon"
                  onClick={togglePause}
                  className="rounded-full"
                >
                  {state.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                
                {/* Stop button */}
                <Button
                  variant="danger"
                  size="icon"
                  onClick={stopRecording}
                  className="rounded-full"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        // Preview & Upload UI - More noticeable
        <div className="bg-white/95 dark:bg-gray-800/95 shadow-xl rounded-full py-3 px-6 border border-gray-200 dark:border-gray-700 backdrop-blur-sm flex items-center gap-4 max-w-md sm:max-w-xl">
          {!isMobile && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Grabación lista</span>
            </div>
          )}
          <div className={`${isMobile ? 'w-48' : 'w-72'}`}>
            <audio
              src={state.audioUrl}
              controls
              className="h-8 w-full"
              onError={() => {
                setState(prev => ({
                  ...prev,
                  error: "Error al reproducir la grabación"
                }));
              }}
            />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={discardRecording}
              className="p-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-all hover:shadow relative focus:outline-none transform hover:scale-105 active:scale-100"
              title="Descartar grabación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={uploadRecording}
              disabled={state.isUploading}
              className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-full shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all relative focus:outline-none focus:ring-1 focus:ring-offset-1 transform hover:scale-105 active:scale-100"
              title="Enviar grabación"
            >
              {state.isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

AudioRecorder.displayName = 'AudioRecorder';
export default AudioRecorder;