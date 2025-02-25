"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Mic, 
  Square, 
  Pause, 
  Play, 
  Upload, 
  Trash2, 
  Volume2, 
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

const ffmpeg = typeof window !== 'undefined' ? new FFmpeg() : null;

export default function AudioRecorder({
  sessionId,
  doctorId,
  onRecordingComplete,
  className = ""
}: AudioRecorderProps) {
  // State
  const [state, setState] = useState<RecordingState>(DEFAULT_STATE);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        if (!ffmpeg) return; // Ensure we're in browser environment
        
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
    
    if (typeof window !== 'undefined') {
      loadFFmpeg();
    }
  }, []);

  // Refs
  const recordRtcRef = useRef<RecordRTCType | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Cleanup function
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

  // Set up audio analysis for volume indicators
  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
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
  };

  // Start recording
  const startRecording = async () => {
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
  };

  // Convert WebM to MP3
  const convertToMp3 = async (webmBlob: Blob) => {
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
  };

  // Stop recording
  const stopRecording = () => {
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
  };

  // Pause/Resume recording
  const togglePause = () => {
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
  };

  // Discard recording
  const discardRecording = () => {
    cleanup();
    setState(DEFAULT_STATE);
    recordRtcRef.current = null;
  };

  // Upload recording
  const uploadRecording = async () => {
    if (!state.audioUrl || state.isUploading) return;
    setState(prev => ({ ...prev, isUploading: true, error: null }));

    let uploadedFilePath = '';

    try {
      const response = await fetch(state.audioUrl);
      const blob = await response.blob();

      // Upload to storage
      const uploadResult = await recordingsStorage.upload(blob, doctorId, sessionId);
      if (uploadResult.error) throw uploadResult.error;

      uploadedFilePath = uploadResult.path;

      // Create recording record
      const recordingData: RecordingCreateData = {
        session_id: sessionId,
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

      // Reset state and notify parent to refresh recordings
      setState(DEFAULT_STATE);
      onRecordingComplete();

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
  };

  // Format timer display
  const formattedDuration = () => {
    const minutes = Math.floor(state.duration / 60);
    const seconds = (state.duration % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // Calculate volume bar height
  const getVolumeHeight = () => {
    if (!showVolumeIndicator || state.isPaused) return 0;
    return Math.max(4, Math.round(state.audioLevel * 40));
  };

  // Render volume indicator
  const renderVolumeIndicator = () => {
    if (!showVolumeIndicator) return null;
    
    return (
      <div className="flex items-center gap-1 ml-3">
        <Volume2 className={`h-4 w-4 ${state.isPaused ? 'text-gray-400' : 'text-blue-500'}`} />
        <div className="flex items-end gap-[2px] h-6">
          {[...Array(7)].map((_, index) => (
            <div 
              key={index}
              className={`w-1 rounded-sm ${
                state.isPaused 
                  ? 'bg-gray-300 dark:bg-gray-600' 
                  : state.audioLevel > index * 0.15
                    ? 'bg-blue-500 dark:bg-blue-400'
                    : 'bg-gray-300 dark:bg-gray-600'
              }`}
              style={{ 
                height: state.isPaused 
                  ? 4 
                  : state.audioLevel > index * 0.15 
                    ? Math.max(4, 4 + index * 3) 
                    : 4 
              }}
            ></div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-xl border-t border-gray-200 dark:border-gray-700 p-4 z-50 ${className}`}>
      {ffmpegLoading && (
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30 flex items-center justify-center z-10 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            <span className="text-sm font-medium">Cargando componentes de audio...</span>
          </div>
        </div>
      )}
      
      {state.error && (
        <div className="p-3 mb-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left side: timer + controls */}
          <div className="flex items-center">
            {/* Timer */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1 mr-4">
              {state.isRecording && (
                <span className={`flex h-3 w-3 mr-2 ${state.isPaused ? 'hidden' : ''}`}>
                  <span className="relative inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                  <span className="absolute inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                </span>
              )}
              <span className="text-lg font-mono text-gray-700 dark:text-gray-300 tabular-nums">
                {formattedDuration()}
              </span>
              
              {/* Volume indicator */}
              {renderVolumeIndicator()}
            </div>

            {/* Record Button */}
            {!state.isRecording && !state.audioUrl && (
              <button
                onClick={startRecording}
                disabled={ffmpegLoading || !ffmpegLoaded}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors relative group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Iniciar grabación"
              >
                <Mic className="w-6 h-6" />
                <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  Iniciar grabación
                </span>
              </button>
            )}

            {/* Stop Button */}
            {state.isRecording && (
              <button
                onClick={stopRecording}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors relative group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                title="Detener grabación"
              >
                <Square className="w-5 h-5" />
                <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  Detener grabación
                </span>
              </button>
            )}

            {/* Pause/Resume Button */}
            {state.isRecording && (
              <button
                onClick={togglePause}
                className={`ml-2 p-3 ${
                  state.isPaused 
                    ? "bg-blue-500 hover:bg-blue-600" 
                    : "bg-yellow-500 hover:bg-yellow-600"
                } text-white rounded-full transition-colors relative group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                title={state.isPaused ? "Reanudar grabación" : "Pausar grabación"}
              >
                {state.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  {state.isPaused ? "Reanudar grabación" : "Pausar grabación"}
                </span>
              </button>
            )}
          </div>

          {/* Right side: Audio preview & actions */}
          {state.audioUrl && !state.isRecording && (
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex-1 sm:w-64 bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                <audio
                  src={state.audioUrl}
                  controls
                  className="w-full"
                  onError={() => {
                    setState(prev => ({
                      ...prev,
                      error: "Error al reproducir la grabación"
                    }));
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={discardRecording}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors relative group focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  title="Descartar grabación"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Descartar</span>
                  <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity sm:hidden">
                    Descartar grabación
                  </span>
                </button>
                <button
                  onClick={uploadRecording}
                  disabled={state.isUploading}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative group focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  title="Enviar grabación"
                >
                  {state.isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      <span className="hidden sm:inline">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Enviar</span>
                    </>
                  )}
                  <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity sm:hidden">
                    Enviar grabación
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}