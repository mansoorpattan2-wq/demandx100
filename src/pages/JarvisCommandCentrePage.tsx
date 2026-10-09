import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  FileText,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Activity,
  Package,
  Calendar,
} from 'lucide-react';
import { Jarvis3DOrb, type JarvisVisualState } from '../components/Jarvis3DOrb';
import {
  sendJarvisMessage,
  confirmJarvisReorderDraft,
  cancelJarvisReorderDraft,
  cancelJarvisOrder,
  API_BASE_URL,
  type JarvisChatResponse,
  type RAGCitation,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

export type JarvisLanguage = 'en' | 'te' | 'hi';

export interface CommandMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  timestamp: string;
  language?: JarvisLanguage;
  toolsExecuted?: string[];
  forecastCard?: JarvisChatResponse['forecast_card'];
  stockRiskCard?: JarvisChatResponse['stock_risk_card'];
  reorderDraft?: JarvisChatResponse['reorder_draft'];
  batchExpiryCard?: JarvisChatResponse['batch_expiry_card'];
  orderStatusCard?: JarvisChatResponse['order_status_card'];
  actionConfirmation?: JarvisChatResponse['action_confirmation'];
  citations?: RAGCitation[];
  isConfirmedPO?: boolean;
  confirmedPONumber?: string;
  isCancelled?: boolean;
}

const STARTER_PROMPTS: Record<JarvisLanguage, string[]> = {
  en: [
    'What products are running low on stock?',
    "Forecast tomorrow's demand for Sona Masoori Rice",
    'Which grocery batches are near expiry?',
    'What is the current status of order PO-9402?',
    'Explain the DemandX ML forecasting architecture',
  ],
  te: [
    'నా స్టోర్‌లో ఏ వస్తువుల స్టాక్ తక్కువగా ఉంది?',
    'సోనా మసూరి బియ్యం రేపు డిమాండ్ ఎంత ఉంటుంది?',
    'ఏ కిరాణా బ్యాచ్‌ల గడువు త్వరలో ముగియనుంది?',
    'ఆర్డర్ PO-9402 స్థితి ఏమిటి?',
    'సప్లయర్ రిటర్న్ పాలసీ వివరించండి',
  ],
  hi: [
    'दुकान में किन उत्पादों का स्टॉक कम है?',
    'सोना मसूरी चावल की कल की मांग क्या होगी?',
    'किन ग्रोसरी बैचों की एक्सपायरी पास है?',
    'ऑर्डर PO-9402 का वर्तमान स्टेटस क्या है?',
    'DemandX सिस्टम आर्किटेक्चर समझाएं',
  ],
};

export const JarvisCommandCentrePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // Persistent Language Preference
  const [selectedLang, setSelectedLang] = useState<JarvisLanguage>(() => {
    try {
      const saved = localStorage.getItem('demandx_jarvis_lang') as JarvisLanguage;
      if (saved && ['en', 'te', 'hi'].includes(saved)) return saved;
    } catch (_) {}
    return 'en';
  });

  const [assistantState, setAssistantState] = useState<JarvisVisualState>('IDLE');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [liveAudioLevel, setLiveAudioLevel] = useState<number>(0);
  const [transcriptPreview, setTranscriptPreview] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [messages, setMessages] = useState<CommandMessage[]>([]);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Audio & Speech references
  const sessionIdRef = useRef<string>(`DX-CMD-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioAnimRef = useRef<number | null>(null);

  // Check reduced motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Voices caching
  const loadVoices = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
      }
    }
  }, []);

  useEffect(() => {
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [loadVoices]);

  // Scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assistantState]);

  // Clean up all audio and media resources on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      if (audioAnimRef.current) {
        cancelAnimationFrame(audioAnimRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Speech match helper
  const findMatchingVoice = useCallback(
    (langCode: JarvisLanguage): SpeechSynthesisVoice | null => {
      if (!availableVoices.length) return null;
      if (langCode === 'te') {
        return (
          availableVoices.find(
            (v) => v.lang.toLowerCase().startsWith('te') || v.name.toLowerCase().includes('telugu')
          ) || null
        );
      }
      if (langCode === 'hi') {
        return (
          availableVoices.find(
            (v) => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi')
          ) || null
        );
      }
      return (
        availableVoices.find(
          (v) => v.lang.toLowerCase() === 'en-in' || v.name.toLowerCase().includes('india')
        ) ||
        availableVoices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
        null
      );
    },
    [availableVoices]
  );

  // Spoken response execution
  const speakText = useCallback(
    (text: string, langCode: JarvisLanguage) => {
      if (!('speechSynthesis' in window) || !voiceEnabled) {
        setAssistantState('IDLE');
        return;
      }

      window.speechSynthesis.cancel();
      setAssistantState('SPEAKING');

      // Clean speech of symbols & markdown
      const cleanSpeech = text
        .replace(/[*#`_~]/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/•/g, ', ')
        .slice(0, 320); // concise spoken summary

      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      const voice = findMatchingVoice(langCode);

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        const fallbackLocale = langCode === 'te' ? 'te-IN' : langCode === 'hi' ? 'hi-IN' : 'en-IN';
        utterance.lang = fallbackLocale;
      }

      utterance.rate = 0.96;
      utterance.pitch = 1.0;

      // Simulate output audio amplitude during speaking
      let speechTimer: any;
      let tick = 0;
      speechTimer = setInterval(() => {
        tick += 0.2;
        setLiveAudioLevel(0.35 + Math.sin(tick) * 0.25);
      }, 80);

      utterance.onend = () => {
        clearInterval(speechTimer);
        setLiveAudioLevel(0);
        setAssistantState('IDLE');
      };

      utterance.onerror = () => {
        clearInterval(speechTimer);
        setLiveAudioLevel(0);
        setAssistantState('IDLE');
      };

      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled, findMatchingVoice]
  );

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setLiveAudioLevel(0);
    setAssistantState('IDLE');
  };

  // Initial greeting
  useEffect(() => {
    const greetings: Record<JarvisLanguage, string> = {
      en: `DemandX JARVIS Voice Command Centre is online. I'm actively monitoring real-time Kirana inventory, live XGBoost demand forecasts, and authorized supplier logistics. How can I assist you?`,
      te: `DemandX JARVIS కమాండ్ సెంటర్ ఆన్‌లైన్‌లో ఉంది. నేను మీ స్టోర్ ఇన్వెంటరీ, XGBoost డిమాండ్ అంచనాలు మరియు సప్లయర్ వివరాలను పర్యవేక్షిస్తున్నాను. మీకు ఏ సహాయం కావాలి?`,
      hi: `DemandX JARVIS वॉइस कमांड सेंटर ऑनलाइन है। मैं आपकी दुकान की इन्वेंट्री, लाइव मांग पूर्वानुमान और सप्लायर लॉजिस्टिक्स की निगरानी कर रहा हूं। मैं आपकी क्या मदद कर सकता हूँ?`,
    };

    const initialGreet: CommandMessage = {
      id: 'cmd-greet',
      sender: 'jarvis',
      text: greetings[selectedLang],
      language: selectedLang,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([initialGreet]);
    if (voiceEnabled) {
      speakText(greetings[selectedLang], selectedLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Web Audio Analyser setup for actual microphone amplitude
  const startAudioMonitoring = async (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAmplitude = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume amplitude
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1.0, avg / 128); // 0.0 to 1.0
        setLiveAudioLevel(normalized);

        audioAnimRef.current = requestAnimationFrame(updateAmplitude);
      };

      updateAmplitude();
    } catch (err) {
      console.warn('Audio analyser initialization skipped:', err);
    }
  };

  const stopAudioMonitoring = () => {
    if (audioAnimRef.current) {
      cancelAnimationFrame(audioAnimRef.current);
      audioAnimRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setLiveAudioLevel(0);
  };

  // Language switch
  const handleLanguageChange = (lang: JarvisLanguage) => {
    setSelectedLang(lang);
    try {
      localStorage.setItem('demandx_jarvis_lang', lang);
    } catch (_) {}
    showToast('Language Updated', `Command Centre set to ${lang === 'te' ? 'తెలుగు' : lang === 'hi' ? 'हिन्दी' : 'English'}`, 'info');
  };

  // Main message processor
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || textInput).trim();
    if (!query) return;

    // Interrupt any active voice turn
    stopSpeaking();
    setTextInput('');
    setTranscriptPreview('');

    const userMsg: CommandMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setAssistantState('PROCESSING');

    try {
      const response = await sendJarvisMessage({
        query,
        session_id: sessionIdRef.current,
        role: 'retailer',
        store_id: 'GUNTUR_STORE_01',
        preferred_lang: selectedLang,
        user_name: currentUser?.displayName || 'Store Owner',
      });

      // Update language if the backend auto-switched or user requested in prompt
      if (response.language && ['en', 'te', 'hi'].includes(response.language)) {
        if (response.language !== selectedLang) {
          setSelectedLang(response.language as JarvisLanguage);
          try {
            localStorage.setItem('demandx_jarvis_lang', response.language);
          } catch (_) {}
        }
      }


      const jarvisMsg: CommandMessage = {
        id: `ai-${Date.now()}`,
        sender: 'jarvis',
        text: response.reply,
        language: (response.language as JarvisLanguage) || selectedLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolsExecuted: response.tools_executed,
        forecastCard: response.forecast_card,
        stockRiskCard: response.stock_risk_card,
        reorderDraft: response.reorder_draft,
        batchExpiryCard: response.batch_expiry_card,
        orderStatusCard: response.order_status_card,
        actionConfirmation: response.action_confirmation,
        citations: response.citations,
      };

      setMessages((prev) => [...prev, jarvisMsg]);

      // Voice response
      if (voiceEnabled) {
        speakText(response.reply, (response.language as JarvisLanguage) || selectedLang);
      } else {
        setAssistantState('IDLE');
      }
    } catch (err: any) {
      console.error('Command processing error:', err);
      setAssistantState('ERROR');
      const errorMsg: CommandMessage = {
        id: `err-${Date.now()}`,
        sender: 'jarvis',
        text: `Telemetry Notice: Failed to communicate with FastAPI backend (${err.message}). Endpoint: ${API_BASE_URL}. Please verify service availability.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  // Speech Recognition Handling
  const startListening = async () => {
    stopSpeaking();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast(
        'Speech Recognition Unavailable',
        'Your browser does not support the Web Speech API. You can type queries anytime.',
        'warning'
      );
      return;
    }

    try {
      // 1. Request actual microphone stream for live Web Audio Analyser
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      await startAudioMonitoring(stream);

      // 2. Start speech recognizer
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      const localeMap: Record<JarvisLanguage, string> = {
        en: 'en-IN',
        te: 'te-IN',
        hi: 'hi-IN',
      };
      recognition.lang = localeMap[selectedLang] || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setAssistantState('LISTENING');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const text = final || interim;
        setTranscriptPreview(text);

        if (final) {
          stopListening();
          handleSendMessage(final);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition warning:', e.error);
        stopListening();
        setAssistantState('IDLE');
        if (e.error === 'not-allowed') {
          showToast(
            'Microphone Permission Denied',
            'Please allow microphone permissions in your browser to talk with JARVIS.',
            'warning'
          );
        }
      };

      recognition.onend = () => {
        stopListening();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Microphone stream error:', err);
      stopListening();
      showToast('Microphone Unavailable', 'Could not open microphone stream. Please check permissions.', 'warning');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    stopAudioMonitoring();
    setIsListening(false);
    setAssistantState((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
  };

  // Confirmation actions
  const handleConfirmOrder = async (draftId: string) => {
    try {
      const res = await confirmJarvisReorderDraft(draftId, 'retailer', 'GUNTUR_STORE_01');
      showToast('Purchase Order Submitted', `PO #${res.order?.order_id || 'PO-SUCCESS'} committed successfully!`, 'success');

      const ackMsg: CommandMessage = {
        id: `ack-${Date.now()}`,
        sender: 'jarvis',
        text: `Confirmed! Purchase Order ${res.order?.order_id || draftId} has been formally submitted to the supplier Mandi hub. Total: ₹${res.order?.total_inr?.toLocaleString('en-IN') || 'Verified'}.`,
        language: selectedLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isConfirmedPO: true,
        confirmedPONumber: res.order?.order_id,
      };
      setMessages((prev) => [...prev, ackMsg]);
      if (voiceEnabled) {
        speakText(`Order confirmed. Purchase order ${res.order?.order_id} has been submitted.`, selectedLang);
      }
    } catch (err: any) {
      showToast('Confirmation Failed', err.message, 'warning');
    }
  };

  const handleCancelDraft = async (draftId: string) => {
    try {
      await cancelJarvisReorderDraft(draftId, 'retailer', 'GUNTUR_STORE_01');
      showToast('Draft Cancelled', 'Reorder draft has been discarded.', 'info');

      const cancelMsg: CommandMessage = {
        id: `cnc-${Date.now()}`,
        sender: 'jarvis',
        text: `Reorder draft ${draftId} has been successfully cancelled. No purchase order was created.`,
        language: selectedLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCancelled: true,
      };
      setMessages((prev) => [...prev, cancelMsg]);
    } catch (err: any) {
      showToast('Cancellation Failed', err.message, 'warning');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelJarvisOrder(orderId, 'retailer', 'GUNTUR_STORE_01');
      showToast('Order Cancelled', `Purchase order ${orderId} has been cancelled.`, 'info');

      const cancelMsg: CommandMessage = {
        id: `cnc-${Date.now()}`,
        sender: 'jarvis',
        text: `Order ${orderId} has been formally cancelled in the system audit registry.`,
        language: selectedLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCancelled: true,
      };
      setMessages((prev) => [...prev, cancelMsg]);
    } catch (err: any) {
      showToast('Cancellation Failed', err.message, 'warning');
    }
  };


  return (
    <div className="fixed inset-0 z-50 bg-[#020617] text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Background Cyber Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-20 left-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-10 right-10 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />
      </div>

      {/* TOP NAVIGATION / CONTROL BAR */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-cyan-950/60 bg-[#030712]/80 backdrop-blur-md">
        {/* Left: Back / Title */}
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Exit Jarvis Command Centre"
            className="p-2 rounded-xl bg-slate-900/90 border border-cyan-900/40 text-cyan-400 hover:text-white hover:bg-cyan-950/60 transition-all cursor-pointer flex items-center space-x-2 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-semibold hidden sm:inline">Exit Command Centre</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-black tracking-wider text-white">JARVIS</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 tracking-wider">
                  3D CORE 2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Full-Screen Multilingual Demand Intelligence Command</p>
            </div>
          </div>
        </div>

        {/* Center: Real Interaction State Pill */}
        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-900/40 shadow-inner">
          <span
            className={`w-2 h-2 rounded-full ${
              assistantState === 'LISTENING'
                ? 'bg-cyan-400 animate-ping'
                : assistantState === 'SPEAKING'
                ? 'bg-emerald-400 animate-pulse'
                : assistantState === 'PROCESSING'
                ? 'bg-purple-400 animate-spin'
                : assistantState === 'ERROR'
                ? 'bg-rose-500'
                : 'bg-cyan-600'
            }`}
          />
          <span className="text-[11px] font-bold tracking-wider text-cyan-300 uppercase">
            {assistantState}
          </span>
          {isListening && liveAudioLevel > 0 && (
            <span className="text-[10px] text-cyan-400/80 font-mono">
              {(liveAudioLevel * 100).toFixed(0)}%
            </span>
          )}
        </div>

        {/* Right: Controls (Language, Mute, Close) */}
        <div className="flex items-center space-x-2">
          {/* Multilingual Selector */}
          <div className="flex items-center bg-slate-900 border border-cyan-900/50 rounded-xl p-0.5 text-xs font-semibold">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedLang === 'en' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageChange('te')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedLang === 'te' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              తెలుగు
            </button>
            <button
              onClick={() => handleLanguageChange('hi')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedLang === 'hi' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Voice Mute Toggle */}
          <button
            onClick={() => {
              if (voiceEnabled) stopSpeaking();
              setVoiceEnabled(!voiceEnabled);
            }}
            title={voiceEnabled ? 'Mute Speech Output' : 'Unmute Speech Output'}
            className="p-2 rounded-xl bg-slate-900 border border-cyan-900/40 text-slate-300 hover:text-cyan-400 transition-all cursor-pointer"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Close */}
          <button
            onClick={() => navigate(-1)}
            aria-label="Close"
            className="p-2 rounded-xl bg-slate-900 border border-cyan-900/40 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT: 3D Holographic Orb + Contextual Cards */}
      <main className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* CENTER / TOP: 3D Holographic Canvas Viewport */}
        <div className="relative flex-1 flex flex-col items-center justify-center min-h-[280px] lg:min-h-auto">
          {/* React Three Fiber 3D Orb Scene */}
          <div className="w-full h-full max-h-[580px] flex items-center justify-center">
            <Jarvis3DOrb
              assistantState={assistantState}
              audioLevel={liveAudioLevel}
              reducedMotion={reducedMotion}
            />
          </div>

          {/* Interactive Live Speech Transcript Overlay */}
          {(isListening || transcriptPreview) && (
            <div className="absolute bottom-6 px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-cyan-500/50 backdrop-blur-lg shadow-2xl shadow-cyan-500/20 max-w-lg text-center animate-fade-in pointer-events-auto">
              <div className="flex items-center justify-center space-x-2 text-cyan-400 text-xs font-mono mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>LISTENING & TRANSCRIBING...</span>
              </div>
              <p className="text-sm sm:text-base text-white font-medium">
                {transcriptPreview || 'Listening for speech in English, Telugu, or Hindi...'}
              </p>
            </div>
          )}

          {/* Quick Starter Prompts Chips */}
          {!isListening && messages.length <= 2 && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center flex-wrap gap-2 pointer-events-auto">
              {STARTER_PROMPTS[selectedLang].slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-cyan-950 border border-cyan-900/40 hover:border-cyan-500/60 text-xs text-cyan-200 transition-all cursor-pointer backdrop-blur-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SIDE / BOTTOM: Conversation Transcript & Contextual Answer Cards HUD */}
        <aside className="w-full lg:w-[460px] xl:w-[500px] border-t lg:border-t-0 lg:border-l border-cyan-950/60 bg-[#030712]/90 backdrop-blur-xl flex flex-col h-[340px] lg:h-auto z-20">
          {/* Panel Header */}
          <div className="px-5 py-3 border-b border-cyan-950/40 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Contextual Intelligence Feed
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Store: GUNTUR_STORE_01</span>
          </div>

          {/* Scrollable Conversation & Cards Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-[90%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none'
                      : 'bg-slate-900/90 text-slate-200 border border-cyan-900/40 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>

                {/* CONTEXTUAL ANSWER CARDS */}
                {/* 1. Demand Forecast Card */}
                {msg.forecastCard && (
                  <div className="w-full mt-2.5 p-3.5 rounded-xl bg-slate-900 border border-cyan-800/60 shadow-lg text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
                      <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                        <TrendingUp className="w-4 h-4" />
                        <span>XGBoost Demand Forecast</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                        R² = 0.9626
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-400">Product:</span>
                        <div className="font-semibold text-white">{msg.forecastCard.product_name}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Expected Demand:</span>
                        <div className="font-bold text-cyan-400 text-sm">
                          {msg.forecastCard.predicted_daily_demand} units/day
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Demand Level:</span>
                        <div className="font-semibold text-emerald-400">{msg.forecastCard.demand_level}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Safety Buffer:</span>
                        <div className="font-semibold text-white">{msg.forecastCard.recommended_safety_stock} units</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Stockout Risk Card */}
                {msg.stockRiskCard && (
                  <div className="w-full mt-2.5 p-3.5 rounded-xl bg-slate-900 border border-amber-900/60 shadow-lg text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-amber-900/40 pb-2 text-amber-400 font-bold">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Critical Replenishment Alert</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300">
                        {msg.stockRiskCard.critical_count} SKUs at Risk
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {msg.stockRiskCard.risks?.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-950/60 text-slate-300">
                          <div>
                            <div className="font-semibold text-white">{r.product_name}</div>
                            <div className="text-[10px] text-slate-400">Supply: {r.days_of_supply} days left</div>
                          </div>
                          <span className="text-[10px] font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-950/60">
                            Risk {r.risk_score}/100
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Batch Expiry Card */}
                {msg.batchExpiryCard && (
                  <div className="w-full mt-2.5 p-3.5 rounded-xl bg-slate-900 border border-rose-900/60 shadow-lg text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-rose-900/40 pb-2 text-rose-400 font-bold">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Batch Expiry & Shelf-Life Watch</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300">
                        {msg.batchExpiryCard.critical_count} Expiring
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {msg.batchExpiryCard.batches?.slice(0, 3).map((b, i) => (
                        <div key={i} className="p-2 rounded bg-slate-950/60 space-y-1 text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{b.product_name}</span>
                            <span className="text-[10px] text-rose-400 font-mono font-bold">{b.days_to_expiry} days left</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center justify-between">
                            <span>Batch: {b.batch_number}</span>
                            <span>Action: {b.recommended_action}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Purchase Order Status Card */}
                {msg.orderStatusCard && (
                  <div className="w-full mt-2.5 p-3.5 rounded-xl bg-slate-900 border border-blue-900/60 shadow-lg text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-blue-900/40 pb-2 text-blue-400 font-bold">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4" />
                        <span>Order #{msg.orderStatusCard.order_id}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 uppercase">
                        {msg.orderStatusCard.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-400">Total Value:</span>
                        <div className="font-semibold text-white">₹{msg.orderStatusCard.total_inr?.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Supplier:</span>
                        <div className="font-semibold text-white">{msg.orderStatusCard.supplier_name || 'Guntur Mandi Hub'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Reorder Draft Action Card (SAFE TWO-STEP CONFIRMATION) */}
                {msg.reorderDraft && !msg.isConfirmedPO && !msg.isCancelled && (
                  <div className="w-full mt-2.5 p-4 rounded-xl bg-slate-900 border border-cyan-500/70 shadow-xl text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2 text-cyan-400 font-bold">
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="w-4 h-4" />
                        <span>Uncommitted Reorder Draft</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">
                        {msg.reorderDraft.draft_id}
                      </span>
                    </div>
                    <div className="space-y-1 text-slate-300">
                      <div><strong className="text-white">Product:</strong> {msg.reorderDraft.product_name}</div>
                      <div><strong className="text-white">Quantity:</strong> {msg.reorderDraft.quantity} {msg.reorderDraft.unit}</div>
                      <div><strong className="text-white">Wholesale Rate:</strong> ₹{msg.reorderDraft.unit_price} / {msg.reorderDraft.unit}</div>
                      <div><strong className="text-white">Estimated Cost:</strong> ₹{msg.reorderDraft.total_estimated_inr?.toLocaleString('en-IN')}</div>
                      <div><strong className="text-white">Supplier:</strong> {msg.reorderDraft.supplier_name}</div>
                    </div>
                    <div className="p-2 rounded bg-amber-950/40 border border-amber-900/60 text-[10px] text-amber-300 flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>Safety Guardrail: Explicit user confirmation required before purchase order transmission.</span>
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => handleConfirmOrder(msg.reorderDraft!.draft_id)}
                        className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition-all cursor-pointer shadow-md"
                      >
                        Confirm Purchase Order
                      </button>
                      <button
                        onClick={() => handleCancelDraft(msg.reorderDraft!.draft_id)}
                        className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. Cancel Action Confirmation Card */}
                {msg.actionConfirmation && !msg.isCancelled && (
                  <div className="w-full mt-2.5 p-4 rounded-xl bg-rose-950/60 border border-rose-800 shadow-xl text-xs space-y-3">
                    <div className="flex items-center space-x-2 text-rose-300 font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>Confirm Cancellation</span>
                    </div>
                    <p className="text-slate-300">
                      Are you sure you want to cancel order <strong className="text-white">{msg.actionConfirmation.target_id}</strong>?
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCancelOrder(msg.actionConfirmation!.target_id)}
                        className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all cursor-pointer shadow-md"
                      >
                        Confirm Cancellation
                      </button>
                      <button
                        onClick={() => {
                          setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isCancelled: true } : m));
                        }}
                        className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                      >
                        Keep Order
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. Verified RAG Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="w-full mt-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-xs">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Verified Knowledge Grounding</span>
                    </div>
                    {msg.citations.map((c, i) => (
                      <div key={i} className="pl-2 border-l border-cyan-800">
                        <span className="text-slate-300 font-medium">{c.title}</span> — <em>{c.source}</em> (Relevance: {(c.relevance_score * 100).toFixed(0)}%)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR (VOICE + TEXT FALLBACK) */}
          <div className="p-3.5 border-t border-cyan-950/60 bg-[#030712] space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              {/* Central Mic Button */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
                className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-lg ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-600/50'
                    : 'bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-cyan-500/25'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input Fallback */}
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  selectedLang === 'te'
                    ? 'తెలుగు లేదా ఇంగ్లీష్‌లో ప్రశ్న టైప్ చేయండి...'
                    : selectedLang === 'hi'
                    ? 'हिन्दी या अंग्रेज़ी में प्रश्न टाइप करें...'
                    : 'Speak or type grocery demand query...'
                }
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-950 focus:border-cyan-500/80 text-white placeholder-slate-500 text-xs sm:text-sm outline-none transition-all"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!textInput.trim()}
                aria-label="Send message"
                className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold transition-all cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Quick status footer */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>Voice commands: English (en-IN), Telugu (te-IN), Hindi (hi-IN)</span>
              {assistantState === 'SPEAKING' && (
                <button onClick={stopSpeaking} className="text-cyan-400 hover:underline cursor-pointer">
                  Stop Spoken Voice
                </button>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};
