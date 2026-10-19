import { useState, useEffect, useRef, useCallback } from 'react';

// Declarations for Web Speech API TypeScript support
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface UseVoiceRecognitionOptions {
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onEnd?: (finalTranscript: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const { lang = 'id-ID', onResult, onEnd, onError } = options;
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage('Browser kamu belum mendukung Web Speech API (Gunakan Chrome/Edge/Safari).');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage(null);
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      let isFinalResult = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        currentTranscript += text;
        if (event.results[i].isFinal) {
          isFinalResult = true;
        }
      }

      setTranscript(currentTranscript);
      if (onResult) {
        onResult(currentTranscript, isFinalResult);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('🎙️ Speech recognition error:', event.error);
      let msg = 'Terjadi kesalahan pada perekam suara.';
      if (event.error === 'not-allowed') {
        msg = 'Izin akses mikrofon ditolak oleh browser.';
      } else if (event.error === 'no-speech') {
        msg = 'Tidak ada suara terdeteksi. Silakan coba lagi.';
      }
      setErrorMessage(msg);
      setIsListening(false);
      if (onError) {
        onError(msg);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (onEnd && recognitionRef.current) {
        onEnd(transcript);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [lang]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      if (!isSupported) {
        alert('Peramban web kamu belum mendukung pengenalan suara.');
      }
      return;
    }
    setTranscript('');
    setErrorMessage(null);
    try {
      recognitionRef.current.start();
    } catch (err: any) {
      // If already started, stop then restart
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 100);
      } catch (e) {
        console.error('Failed to restart speech recognition:', e);
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Failed to stop speech recognition:', e);
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
    resetTranscript
  };
}
