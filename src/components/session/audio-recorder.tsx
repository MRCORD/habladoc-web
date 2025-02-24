// src/components/session/audio-recorder.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Pause, Play, Upload, Trash2 } from "lucide-react";
import RecordRTC from "recordrtc";
import { recordingsStorage } from "@/lib/recordings";
import api from "@/lib/api";
import type { RecordingCreateData } from "@/types";
import { RecordingStatus } from "@/types";  // Removed unused SOAPComponent import
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface AudioRecorderProps {
  sessionId: string;
  doctorId: string;
  onRecordingComplete: () => void;
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
}

const DEFAULT_STATE: RecordingState = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  audioUrl: null,
  isUploading: false,
  error: null,
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
}: AudioRecorderProps) {
  // State
  const [state, setState] = useState<RecordingState>(DEFAULT_STATE);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        if (!ffmpeg) return; // Ensure we're in browser environment
        
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setFfmpegLoaded(true);
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
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
  const startTimeRef = useRef<number>(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (typeof window !== "undefined" && state.audioUrl) {
      window.URL.revokeObjectURL(state.audioUrl);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, [state.audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

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

    return { mp3Url };
  };

  // Stop recording
  const stopRecording = () => {
    if (!recordRtcRef.current) return;

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
    } else {
      recordRtcRef.current.pauseRecording();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
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

      // Wait a moment to ensure the recording is processed
      await new Promise(resolve => setTimeout(resolve, 1000));

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
    const mm = Math.floor(state.duration / 60);
    const ss = (state.duration % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-11/12 sm:w-[26rem] bg-white border p-4 shadow-lg rounded-xl z-50">
      {state.error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-3">
          {state.error}
        </div>
      )}

      {/* Timer + Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {state.isRecording && (
            <span className="text-red-500 text-sm animate-pulse">● REC</span>
          )}
          <span className="text-lg font-mono text-gray-700">{formattedDuration()}</span>
        </div>

        <div className="flex gap-2">
          {/* Record Button */}
          {!state.isRecording && !state.audioUrl && (
            <button
              onClick={startRecording}
              className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
              title="Iniciar grabación"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          {/* Stop Button */}
          {state.isRecording && (
            <button
              onClick={stopRecording}
              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
              title="Detener grabación"
            >
              <Square className="w-5 h-5" />
            </button>
          )}

          {/* Pause/Resume Button */}
          {state.isRecording && (
            <button
              onClick={togglePause}
              className={`p-3 ${
                state.isPaused 
                  ? "bg-blue-500 hover:bg-blue-600" 
                  : "bg-yellow-500 hover:bg-yellow-600"
              } text-white rounded-full transition`}
              title={state.isPaused ? "Reanudar grabación" : "Pausar grabación"}
            >
              {state.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Audio Preview + Actions */}
      {state.audioUrl && !state.isRecording && (
        <div className="border-t pt-3 flex flex-col space-y-3">
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
          <div className="flex gap-2">
            <button
              onClick={discardRecording}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition"
              title="Descartar grabación"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Descartar
            </button>
            <button
              onClick={uploadRecording}
              disabled={state.isUploading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
              title="Enviar grabación"
            >
              <Upload className="w-4 h-4 mr-1" />
              {state.isUploading ? "Subiendo..." : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}