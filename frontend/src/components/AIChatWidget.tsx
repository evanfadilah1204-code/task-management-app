import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useVoiceRecognition } from '../utils/useVoiceRecognition';
import { API_BASE_URL } from '../config/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actionExecuted?: boolean;
}

interface AIChatWidgetProps {
  onDataChanged?: () => void;
}

export default function AIChatWidget({ onDataChanged }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Halo! 👋 Saya **FeloAssistant AI**. Saya bisa membaca data 4 pilar produktivitas kamu dan otomatis mencatat tugas, jadwal, atau pengeluaran baru. Kamu juga bisa tekan ikon mikrofon 🎙️ untuk perintah suara!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Hook Voice Recognition
  const {
    isListening,
    transcript,
    isSupported,
    errorMessage,
    startListening,
    stopListening
  } = useVoiceRecognition({
    lang: 'id-ID',
    onResult: (text) => {
      setInputPrompt(text);
    }
  });

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || loading) return;

    if (isListening) {
      stopListening();
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputPrompt('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/api/ai/chat`,
        { prompt: textToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiReply = res.data.reply || 'Maaf, tidak ada tanggapan.';
      const actionExecuted = res.data.actionExecuted;

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionExecuted
      };

      setMessages(prev => [...prev, aiMsg]);

      if (actionExecuted && onDataChanged) {
        onDataChanged();
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️ Maaf, gagal tersambung ke AI Server: ${err.response?.data?.message || err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const quickPrompts = [
    '📊 Rekap produktivitas saya hari ini',
    '💰 Catat pengeluaran beli makan 25000',
    '📅 Buat timeblock belajar coding 19:00 sampai 21:00',
    '📝 Tambahkan tugas Kuis Pemrograman besok'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105 active:scale-95 border border-purple-400/30"
        >
          <div className="relative">
            <span className="text-xl">🤖</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <span className="font-semibold text-sm tracking-wide text-white drop-shadow">Felo AI Assistant</span>
        </button>
      )}

      {/* Expanded Chat Drawer Container */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[580px] bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-950/50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-purple-950/80 to-slate-900 border-b border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-purple-500/30 border border-purple-400/30">
                ✨
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base leading-tight flex items-center gap-2">
                  Felo AI Assistant
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-400/30 font-medium">Voice AI</span>
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Terhubung ke Database 4 Pilar
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
              title="Tutup Chat"
            >
              ✕
            </button>
          </div>

          {/* Messages Stream Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar bg-slate-950/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-md shadow-purple-900/20'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {/* Loading Thinking Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-3 bg-slate-800/50 rounded-2xl w-max border border-slate-700/50">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                </div>
                <span>Felo AI sedang menganalisis data...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Audio Wave Indicator Banner saat recording */}
          {isListening && (
            <div className="px-4 py-2 bg-red-950/60 border-t border-red-500/30 flex items-center justify-between text-xs text-red-200">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="font-medium">Mendengarkan suara kamu... (Bahasa Indonesia)</span>
              </div>
              <div className="flex items-center h-4">
                <span className="soundwave-bar"></span>
                <span className="soundwave-bar"></span>
                <span className="soundwave-bar"></span>
                <span className="soundwave-bar"></span>
                <span className="soundwave-bar"></span>
              </div>
            </div>
          )}

          {/* Display Error Message jika ada */}
          {errorMessage && (
            <div className="px-3 py-1.5 bg-amber-950/60 border-t border-amber-500/30 text-[11px] text-amber-300">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Quick Prompts Container */}
          <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(promptText)}
                disabled={loading}
                className="whitespace-nowrap text-xs bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/50 px-3 py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-50"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-slate-900 border-t border-purple-500/20 flex items-center gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              placeholder={isListening ? "Bicara sekarang..." : "Tanya AI atau ketik/suara..."}
              className="flex-1 bg-slate-950 text-slate-100 placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500 transition-colors"
            />
            
            {/* Tombol Mikrofon Voice Command */}
            <button
              type="button"
              onClick={toggleMic}
              disabled={loading || !isSupported}
              title={isListening ? "Hentikan Perekaman" : "Mulai Perintah Suara (Mic)"}
              className={`p-2.5 rounded-xl transition-all font-medium text-sm flex items-center justify-center border ${
                isListening
                  ? 'mic-active-pulse border-red-500 shadow-lg shadow-red-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              🎙️
            </button>

            {/* Tombol Kirim */}
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputPrompt.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-600/30 flex items-center justify-center"
            >
              🚀
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

