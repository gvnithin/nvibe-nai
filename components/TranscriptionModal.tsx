
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveSession } from '@google/genai';
import { startTranscriptionSession } from '../services/geminiService';
import { createBlob } from '../utils/audioUtils';
import { SpeechToTextIcon } from './Icons';

interface TranscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TranscriptionModal: React.FC<TranscriptionModalProps> = ({ isOpen, onClose }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecording = useCallback(() => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
    }
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Cleanup on component unmount or modal close
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
    }
    return () => {
      stopRecording();
    };
  }, [isOpen, stopRecording]);


  const startRecording = async () => {
    setError(null);
    setTranscribedText('');
    setIsRecording(true);

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
      
      const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      sessionPromiseRef.current = startTranscriptionSession(
        (text) => setTranscribedText(prev => prev + text),
        (err) => setError(err.message)
      );

      scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        sessionPromiseRef.current?.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      };
      
      mediaStreamSourceRef.current.connect(scriptProcessor);
      scriptProcessor.connect(audioContextRef.current.destination);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not start recording. Please ensure you have given microphone permissions.');
      stopRecording();
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };


  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="transcription-modal-title"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-gray-700 flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="transcription-modal-title" className="text-xl font-bold mb-4 text-gray-100">Live Transcription</h2>
        
        <div className="flex-grow overflow-y-auto pr-4 -mr-4 text-gray-300 bg-gray-900/50 p-4 rounded-md min-h-[200px]">
          {transcribedText || <p className="text-gray-500">Your transcribed text will appear here...</p>}
        </div>
        
        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}

        <div className="flex justify-center gap-3 mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={handleToggleRecording}
            className={`px-6 py-3 rounded-full text-white font-bold flex items-center gap-3 transition-colors ${
              isRecording 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <SpeechToTextIcon className="w-6 h-6" />
            <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
