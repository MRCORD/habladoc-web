// src/components/session/audio-recorder.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Pause, Play, Upload, Trash2 } from "lucide-react";
import RecordRTC from "recordrtc";
import { recordingsStorage } from "@/lib/recordings";
import api from "@/lib/api";

interface AudioRecorderProps {
  sessionId: string;
  doctorId: string;
  onRecordingComplete: () => void;
}

/**
 * A floating audio recorder (like WhatsApp) in Spanish:
 *   - Not pinned full-width, but centered with some margin.
 *   - Start/Stop/Resume/Pause, plus Discard or Send (upload).
 */
const AudioRecorder = ({
  sessionId,
  doctorId,
  onRecordingComplete,
}: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordRtcRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (typeof window !== "undefined" && audioUrl) {
      window.URL.revokeObjectURL(audioUrl);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const startRecording = async () => {
    try {
      cleanup();
      setAudioUrl(null);
      setDuration(0);
      setIsPaused(false);
      setError(null);

      // Acceder al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Configurar RecordRTC con MediaStreamRecorder (audio/webm, audio/mp4, etc.)
      recordRtcRef.current = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/mp4", // Prueba "audio/mp4" o "audio/mpeg" en Safari
        recorderType: RecordRTC.MediaStreamRecorder,
        timeSlice: 1000,
        desiredSampRate: 16000,
        numberOfAudioChannels: 1,
      });

      recordRtcRef.current.startRecording();
      setIsRecording(true);

      // Iniciar temporizador
      startTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      console.error("startRecording error:", err);
      setError("No se pudo acceder al micrófono");
    }
  };

  const pauseRecording = () => {
    if (!isRecording || !recordRtcRef.current) return;
    recordRtcRef.current.pauseRecording();
    setIsPaused(true);

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const resumeRecording = () => {
    if (!isRecording || !isPaused || !recordRtcRef.current) return;
    recordRtcRef.current.resumeRecording();
    setIsPaused(false);

    const pausedTime = Date.now() - (startTimeRef.current + duration * 1000);
    startTimeRef.current = Date.now() - duration * 1000 + pausedTime;

    durationIntervalRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const stopRecording = () => {
    if (!isRecording || !recordRtcRef.current) return;
    setIsRecording(false);
    setIsPaused(false);

    recordRtcRef.current.stopRecording(() => {
      const blob = recordRtcRef.current?.getBlob();
      if (blob && typeof window !== "undefined") {
        const url = window.URL.createObjectURL(blob);
        setAudioUrl(url);
      }
      recordRtcRef.current = null;
    });

    cleanup();
  };

  const discardRecording = () => {
    cleanup();
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setAudioUrl(null);
    setError(null);
    recordRtcRef.current = null;
  };

  const uploadRecording = async () => {
    if (!audioUrl || isUploading) return;
    setIsUploading(true);
    setError(null);

    let uploadedFilePath = '';

    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();

      // Step 1: Upload the file to storage
      const uploadResult = await recordingsStorage.upload(blob, doctorId, sessionId);
      if (uploadResult.error) {
        throw uploadResult.error;
      }

      uploadedFilePath = uploadResult.path;

      console.log('File uploaded successfully, creating recording record:', {
        path: uploadedFilePath,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
        duration
      });

      // Step 2: Create the recording record in database
      const recordingData = {
        session_id: sessionId,
        duration,
        file_path: uploadedFilePath,
        file_size: uploadResult.size,
        mime_type: uploadResult.mimeType || 'audio/mp4',
        status: "pending",
        metadata: {
          sample_rate: 16000,
          channels: 1,
          duration_seconds: duration,
          original_name: `recording-${new Date().toISOString()}.mp4`
        }
      };

      const recordingResponse = await api.post("/api/v1/recordings", recordingData);

      if (!recordingResponse.data.success) {
        throw new Error(recordingResponse.data.message || "Failed to save recording");
      }

      console.log('Recording created successfully:', recordingResponse.data);

      // Clear the UI and notify parent
      setAudioUrl(null);
      setDuration(0);
      onRecordingComplete();

    } catch (err) {
      console.error('Upload process error:', err);
      
      // If we uploaded the file but failed to create the record, clean up the file
      if (uploadedFilePath) {
        console.log('Cleaning up uploaded file after error:', uploadedFilePath);
        try {
          await recordingsStorage.delete(uploadedFilePath);
        } catch (deleteErr) {
          console.error('Failed to clean up file:', deleteErr);
        }
      }

      setError(err instanceof Error ? err.message : 'Error al subir la grabación');
    } finally {
      setIsUploading(false);
    }
  };

  const renderTimer = () => {
    const mm = Math.floor(duration / 60);
    const ss = (duration % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    // Centered, floating container near bottom (not pinned full width).
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-11/12 sm:w-[26rem] bg-white border p-4 shadow-lg rounded-xl z-50">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-3">
          {error}
        </div>
      )}

      {/* Timer + Buttons */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {isRecording && (
            <span className="text-red-500 text-sm animate-pulse">● REC</span>
          )}
          <span className="text-lg font-mono text-gray-700">{renderTimer()}</span>
        </div>

        <div className="flex gap-2">
          {/* Iniciar */}
          {!isRecording && !audioUrl && (
            <button
              onClick={startRecording}
              className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
              title="Iniciar grabación"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          {/* Detener */}
          {isRecording && (
            <button
              onClick={stopRecording}
              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
              title="Detener grabación"
            >
              <Square className="w-5 h-5" />
            </button>
          )}

          {/* Pausar/Reanudar */}
          {isRecording && !isPaused && (
            <button
              onClick={pauseRecording}
              className="p-3 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition"
              title="Pausar grabación"
            >
              <Pause className="w-5 h-5" />
            </button>
          )}
          {isRecording && isPaused && (
            <button
              onClick={resumeRecording}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
              title="Reanudar grabación"
            >
              <Play className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* If we have a final audio, show playback + discard + send */}
      {audioUrl && !isRecording && (
        <div className="border-t pt-3 flex flex-col space-y-3">
          <audio
            src={audioUrl}
            controls
            className="w-full"
            onError={(e) => {
              console.error("Audio playback error:", e);
              setError("Error al reproducir la grabación");
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
              disabled={isUploading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition"
              title="Enviar grabación"
            >
              <Upload className="w-4 h-4 mr-1" />
              {isUploading ? "Subiendo..." : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;