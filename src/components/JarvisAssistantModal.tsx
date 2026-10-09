import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShoppingBag,
  TrendingUp,
  Cpu,
  ChevronDown,
  ChevronUp,
  Play,
  Languages,
} from 'lucide-react';
import {
  sendJarvisMessage,
  confirmJarvisReorderDraft,
  type JarvisChatResponse,
  type RAGCitation,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

export type JarvisLanguage = 'auto' | 'en' | 'te' | 'hi';

export type AssistantState =
  | 'IDLE'
  | 'GREETING'
  | 'LISTENING'
  | 'PROCESSING'
  | 'RESPONDING'
  | 'SPEAKING';

export interface ChatItem {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  timestamp: string;
  language?: 'en' | 'te' | 'hi';
  toolsExecuted?: string[];
  forecastCard?: JarvisChatResponse['forecast_card'];
  stockRiskCard?: JarvisChatResponse['stock_risk_card'];
  reorderDraft?: JarvisChatResponse['reorder_draft'];
  citations?: RAGCitation[];
  isConfirmedPO?: boolean;
  confirmedPONumber?: string;
}

interface JarvisAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeLocation?: string;
  userRole?: string;
}

const GREETINGS: Record<string, (name?: string | null) => string> = {
  en: (name) =>
    `Good evening${name ? ', ' + name : ''}! Welcome to DemandX AI. I'm ready to help you monitor inventory, understand demand forecasts, and prepare smarter replenishment decisions. What would you like to know?`,
  te: (name) =>
    `శుభ సాయంత్రం${name ? ', ' + name : ''}! DemandX AI కి స్వాగతం. మీ స్టోర్ ఇన్వెంటరీ పర్యవేక్షణ, XGBoost డిమాండ్ అంచనాలు మరియు రీఆర్డర్ నిర్ణయాలలో మీకు సహాయం చేయడానికి నేను సిద్ధంగా ఉన్నాను. మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?`,
  hi: (name) =>
    `शुभ संध्या${name ? ', ' + name : ''}! DemandX AI में आपका स्वागत है। मैं आपकी दुकान की इन्वेंट्री, लाइव मांग पूर्वानुमान और बेहतर रीऑर्डर निर्णय लेने में मदद करने के लिए तैयार हूं। आप क्या जानना चाहेंगे?`,
  auto: (name) =>
    `Good evening${name ? ', ' + name : ''}! Welcome to DemandX AI. I support English, తెలుగు, and हिन्दी. How can I help you today?`,
};

const STARTER_PROMPTS: Record<JarvisLanguage, string[]> = {
  auto: [
    'నా దగ్గర ఏ వస్తువుల స్టాక్ తక్కువగా ఉంది?',
    'मेरे पास किन उत्पादों का स्टॉक कम है?',
    "Forecast tomorrow's demand",
    'What products are running low?',
    'Explain supplier return policy',
  ],
  en: [
    'What products are running low?',
    "Forecast tomorrow's demand",
    'Explain my highest stockout risks',
    'Prepare a reorder draft for Sona Masoori rice',
    'Explain our supplier return policy',
  ],
  te: [
    'నా దగ్గర ఏ వస్తువుల స్టాక్ తక్కువగా ఉంది?',
    'Rice stock entha undi?',
    'సోనా మసూరి బియ్యం రేపు డిమాండ్ ఎంత ఉంటుంది?',
    'నేను ఎంత స్టాక్ మళ్లీ ఆర్డర్ చేయాలి?',
    'సప్లయర్ రిటర్న్ పాలసీ ఏమిటి?',
  ],
  hi: [
    'मेरे पास किन उत्पादों का स्टॉक कम है?',
    'सोना मसूरी चावल की कल की मांग क्या होगी?',
    'मुझे कितना स्टॉक दोबारा ऑर्डर करना चाहिए?',
    'किन उत्पादों के स्टॉक खत्म होने का खतरा ज्यादा है?',
    'सप्लायर रिटर्न पॉलिसी समझाएं',
  ],
};

export const JarvisAssistantModal: React.FC<JarvisAssistantModalProps> = ({
  isOpen,
  onClose,
  storeLocation = 'My Store - Guntur, AP',
  userRole = 'retailer',
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Persistent language mode stored in localStorage
  const [selectedLang, setSelectedLang] = useState<JarvisLanguage>(() => {
    try {
      const saved = localStorage.getItem('demandx_jarvis_lang') as JarvisLanguage;
      if (saved && ['auto', 'en', 'te', 'hi'].includes(saved)) return saved;
    } catch (_) {}
    return 'auto';
  });

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [assistantState, setAssistantState] = useState<AssistantState>('IDLE');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceStatusNotice, setVoiceStatusNotice] = useState<string | null>(null);

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState('');
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});

  const sessionIdRef = useRef<string>('DX-SESSION-DEFAULT');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const headingId = useId();

  // Scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, assistantState]);

  // Load and cache browser speech synthesis voices
  const refreshVoices = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        setAvailableVoices(v);
      }
    }
  }, []);

  useEffect(() => {
    refreshVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = refreshVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [refreshVoices]);

  // Persistent language switch handler
  const handleLanguageChange = (newLang: JarvisLanguage) => {
    setSelectedLang(newLang);
    try {
      localStorage.setItem('demandx_jarvis_lang', newLang);
    } catch (_) {}
    showToast(
      'Language Preference Updated',
      `JARVIS language mode set to ${newLang.toUpperCase()}`,
      'info'
    );
  };

  // Find optimal voice for target language
  const findMatchingVoice = useCallback(
    (targetLang: 'en' | 'te' | 'hi'): SpeechSynthesisVoice | null => {
      if (!availableVoices.length) return null;

      if (targetLang === 'te') {
        const teVoice = availableVoices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('te') ||
            v.name.toLowerCase().includes('telugu')
        );
        if (teVoice) return teVoice;
      }

      if (targetLang === 'hi') {
        const hiVoice = availableVoices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('hi') ||
            v.name.toLowerCase().includes('hindi')
        );
        if (hiVoice) return hiVoice;
      }

      const enInVoice = availableVoices.find(
        (v) =>
          v.lang.toLowerCase() === 'en-in' ||
          v.name.toLowerCase().includes('india')
      );
      if (enInVoice) return enInVoice;

      const enVoice = availableVoices.find((v) =>
        v.lang.toLowerCase().startsWith('en')
      );
      return enVoice || availableVoices[0] || null;
    },
    [availableVoices]
  );

  // Speech Synthesis Helper
  const speakText = useCallback(
    (text: string, langCode: 'en' | 'te' | 'hi') => {
      if (!('speechSynthesis' in window) || !voiceEnabled) {
        setAssistantState('IDLE');
        return;
      }

      window.speechSynthesis.cancel();
      setAssistantState('SPEAKING');

      const cleanSpeech = text
        .replace(/[*#`_~]/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/•/g, ', ');

      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      const voice = findMatchingVoice(langCode);

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
        setVoiceStatusNotice(null);
      } else {
        const localeMap = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN' };
        utterance.lang = localeMap[langCode] || 'en-IN';

        if (langCode === 'te') {
          setVoiceStatusNotice('Note: Browser Telugu voice is not installed locally in your OS. Full text displayed above.');
        } else if (langCode === 'hi') {
          setVoiceStatusNotice('Note: Browser Hindi voice not detected locally. Text transcript displayed above.');
        } else {
          setVoiceStatusNotice(null);
        }
      }

      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        setAssistantState('IDLE');
      };
      utterance.onerror = () => {
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
    setAssistantState('IDLE');
  };

  // Initial greeting upon opening
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setAssistantState('GREETING');
      const effectiveLang = selectedLang === 'auto' ? 'en' : selectedLang;
      const greetText = GREETINGS[selectedLang](currentUser?.displayName);
      const greetingItem: ChatItem = {
        id: 'greet-01',
        sender: 'jarvis',
        text: greetText,
        language: effectiveLang as 'en' | 'te' | 'hi',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([greetingItem]);

      if (voiceEnabled) {
        speakText(greetText, effectiveLang as 'en' | 'te' | 'hi');
      } else {
        setTimeout(() => setAssistantState('IDLE'), 1200);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Message Sender
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    stopSpeaking();
    setInputQuery('');
    setVoiceStatusNotice(null);

    const userItem: ChatItem = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userItem]);
    setAssistantState('PROCESSING');

    try {
      const response = await sendJarvisMessage({
        query,
        session_id: sessionIdRef.current,
        role: userRole,
        store_id: 'GUNTUR_STORE_01',
        preferred_lang: selectedLang,
        user_name: currentUser?.displayName || 'Partner Retailer',
      });

      const jarvisItem: ChatItem = {
        id: `ai-${Date.now()}`,
        sender: 'jarvis',
        text: response.reply,
        language: response.language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolsExecuted: response.tools_executed,
        forecastCard: response.forecast_card,
        stockRiskCard: response.stock_risk_card,
        reorderDraft: response.reorder_draft,
        citations: response.citations,
      };

      setMessages((prev) => [...prev, jarvisItem]);

      if (voiceEnabled) {
        speakText(response.reply, response.language || 'en');
      } else {
        setAssistantState('IDLE');
      }
    } catch (err: any) {
      console.error('JARVIS chat error:', err);
      const fallbackItem: ChatItem = {
        id: `err-${Date.now()}`,
        sender: 'jarvis',
        text: `Diagnostic Telemetry Notice: Unable to reach backend cluster. Please verify FastAPI service is running on port 8001 (${err.message}).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackItem]);
      setAssistantState('IDLE');
    }
  };

  // Web Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      const langMap: Record<JarvisLanguage, string> = {
        auto: 'te-IN',
        te: 'te-IN',
        hi: 'hi-IN',
        en: 'en-IN',
      };
      recognition.lang = langMap[selectedLang] || 'en-IN';

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
        const currentText = final || interim;
        setTranscriptPreview(currentText);
        setInputQuery(currentText);

        if (final) {
          handleSendMessage(final);
          setTranscriptPreview('');
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition event:', e.error);
        setIsListening(false);
        setAssistantState('IDLE');
        if (e.error === 'not-allowed') {
          showToast(
            'Microphone Permission Needed',
            'Please allow microphone access in your browser to speak with JARVIS.',
            'warning'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setAssistantState((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showToast(
        'Speech Recognition Unavailable',
        'Your browser does not support Web Speech API. You can type queries in Telugu, Hindi, or English anytime.',
        'info'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setAssistantState('IDLE');
    } else {
      stopSpeaking();
      try {
        const langMap: Record<JarvisLanguage, string> = {
          auto: 'te-IN',
          te: 'te-IN',
          hi: 'hi-IN',
          en: 'en-IN',
        };
        recognitionRef.current.lang = langMap[selectedLang] || 'en-IN';
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start exception:', err);
      }
    }
  };

  // Holographic Canvas Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let waveOffset = 0;

    const render = () => {
      const width = (canvas.width = canvas.offsetWidth);
      const height = (canvas.height = canvas.offsetHeight);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Orbital concentric holographic rings
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        const radius = 38 + r * 16;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle * (r % 2 === 0 ? 1 : -1) * (0.8 + r * 0.4));

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 1.6);
        ctx.strokeStyle =
          assistantState === 'SPEAKING'
            ? 'rgba(6, 182, 212, 0.75)'
            : assistantState === 'LISTENING'
            ? 'rgba(14, 165, 233, 0.85)'
            : assistantState === 'PROCESSING'
            ? 'rgba(168, 85, 247, 0.8)'
            : 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(radius, 0, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#00F0FF';
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      // 2. Central Quantum Core Glow
      ctx.save();
      const glowGrad = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, 32);
      if (assistantState === 'SPEAKING') {
        glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.9)');
        glowGrad.addColorStop(0.6, 'rgba(14, 165, 233, 0.4)');
        glowGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      } else if (assistantState === 'LISTENING') {
        glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
        glowGrad.addColorStop(0.6, 'rgba(6, 182, 212, 0.5)');
        glowGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
      } else if (assistantState === 'PROCESSING') {
        glowGrad.addColorStop(0, 'rgba(168, 85, 247, 0.95)');
        glowGrad.addColorStop(0.6, 'rgba(139, 92, 246, 0.45)');
        glowGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      } else {
        glowGrad.addColorStop(0, 'rgba(34, 211, 238, 0.7)');
        glowGrad.addColorStop(0.6, 'rgba(14, 165, 233, 0.25)');
        glowGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      }

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Reactive Soundwave Visualizer Bars
      if (assistantState === 'SPEAKING' || assistantState === 'LISTENING') {
        ctx.save();
        const barCount = 28;
        const barWidth = 3;
        const spacing = 4;
        const totalW = barCount * (barWidth + spacing);
        const startX = centerX - totalW / 2;
        const baseY = height - 12;

        for (let b = 0; b < barCount; b++) {
          const freq = Math.sin(waveOffset + b * 0.4) * Math.cos(waveOffset * 0.8 + b * 0.2);
          const barHeight = Math.max(3, Math.abs(freq) * (assistantState === 'SPEAKING' ? 18 : 14));
          const x = startX + b * (barWidth + spacing);

          ctx.fillStyle = assistantState === 'SPEAKING' ? '#06B6D4' : '#38BDF8';
          ctx.shadowColor = '#00F0FF';
          ctx.shadowBlur = 4;
          ctx.fillRect(x, baseY - barHeight, barWidth, barHeight);
        }
        ctx.restore();
      }

      angle += 0.02;
      waveOffset += 0.15;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [assistantState]);

  // Reorder Draft Confirmation
  const handleConfirmReorder = async (msgId: string, draftId: string) => {
    try {
      const result = await confirmJarvisReorderDraft(draftId, userRole, 'GUNTUR_STORE_01');
      showToast('Order Confirmed', `Purchase order ${result.order?.order_id} transmitted to supplier!`, 'success');

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === msgId) {
            return {
              ...msg,
              isConfirmedPO: true,
              confirmedPONumber: result.order?.order_id,
            };
          }
          return msg;
        })
      );
    } catch (err: any) {
      showToast('Confirmation Failed', err.message || 'Could not commit reorder.', 'warning');
    }
  };

  const handleCancelReorder = (msgId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId) {
          return { ...msg, reorderDraft: undefined };
        }
        return msg;
      })
    );
    showToast('Draft Cancelled', 'Reorder draft discarded.', 'info');
  };

  const handleClearHistory = () => {
    stopSpeaking();
    setMessages([]);
    setVoiceStatusNotice(null);
    sessionIdRef.current = `DX-SESSION-${Date.now()}`;
    const greetText = GREETINGS[selectedLang](currentUser?.displayName);
    const effectiveLang = selectedLang === 'auto' ? 'en' : selectedLang;
    setMessages([
      {
        id: 'greet-reset',
        sender: 'jarvis',
        text: greetText,
        language: effectiveLang as 'en' | 'te' | 'hi',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    showToast('Session Reset', 'Conversation and session telemetry cleared.', 'info');
  };

  const toggleCitation = (chunkId: string) => {
    setExpandedCitations((prev) => ({ ...prev, [chunkId]: !prev[chunkId] }));
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div
        className={`relative flex flex-col w-full bg-slate-950 border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.18)] overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'h-[98vh] max-w-[98vw]'
            : 'h-[92vh] max-h-[820px] max-w-5xl'
        }`}
      >
        {/* Subtle Ambient Futuristic Backdrop Grid & Flare */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-cyan-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

        {/* ================================================================= */}
        {/* MODAL HEADER                                                      */}
        {/* ================================================================= */}
        <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-cyan-900/40 bg-slate-950/90 backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-cyan-950/70 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id={headingId} className="text-base sm:text-lg font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                  <span>DemandX</span>
                  <span className="text-cyan-400 font-extrabold">JARVIS</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono">
                    v2.0 MULTILINGUAL
                  </span>
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center space-x-2">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  XGBoost R²=0.9626
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-300 font-medium">{storeLocation}</span>
              </p>
            </div>
          </div>

          {/* Header Controls: Language Selector, Audio, Sizing, Close */}
          <div className="flex items-center space-x-2">
            {/* 4-Way Language Selector with Visual Indicator */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-cyan-500/30">
              <div className="flex items-center px-1.5 py-0.5 mr-1 border-r border-slate-800 text-slate-500">
                <Languages className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              {(['auto', 'en', 'te', 'hi'] as JarvisLanguage[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedLang === lang
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  {lang === 'auto' ? 'Auto' : lang === 'en' ? 'EN' : lang === 'te' ? 'తెలుగు' : 'हिन्दी'}
                </button>
              ))}
            </div>

            {/* Voice Output Toggle */}
            <button
              type="button"
              onClick={() => {
                if (voiceEnabled) stopSpeaking();
                setVoiceEnabled(!voiceEnabled);
              }}
              title={voiceEnabled ? 'Mute Voice Output' : 'Enable Voice Output'}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                voiceEnabled
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60'
                  : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Clear History */}
            <button
              type="button"
              onClick={handleClearHistory}
              title="Reset Session Telemetry"
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Sizing toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Spacious Mode' : 'Full Screen'}
              className="hidden sm:flex p-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              title="Close JARVIS"
              className="p-2 rounded-xl bg-slate-900/80 border border-red-500/30 hover:bg-red-950/50 text-slate-400 hover:text-red-300 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ================================================================= */}
        {/* BODY AREA (Visualizer Top Banner + Chat Scroll Stream)            */}
        {/* ================================================================= */}
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          {/* Holographic AI Core Canvas Banner */}
          <div className="relative h-24 sm:h-28 w-full border-b border-cyan-950/60 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 flex items-center justify-center shrink-0">
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* State Overlay Tag */}
            <div className="absolute bottom-2 left-4 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-cyan-500/30 text-[10px] font-mono tracking-wider uppercase text-cyan-300 flex items-center gap-1.5 shadow-sm">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  assistantState === 'SPEAKING'
                    ? 'bg-cyan-400 animate-pulse'
                    : assistantState === 'LISTENING'
                    ? 'bg-blue-400 animate-ping'
                    : assistantState === 'PROCESSING'
                    ? 'bg-purple-400 animate-spin'
                    : 'bg-emerald-400'
                }`}
              />
              <span>
                {assistantState === 'LISTENING'
                  ? `LISTENING (${selectedLang.toUpperCase()})`
                  : assistantState}
              </span>
            </div>

            {assistantState === 'SPEAKING' && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="absolute bottom-2 right-4 text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-950/60 border border-red-500/40 px-2.5 py-0.5 rounded-full cursor-pointer transition-all"
              >
                ■ Interrupt Voice
              </button>
            )}
          </div>

          {/* Voice Notification Banner if local TTS voice missing */}
          {voiceStatusNotice && (
            <div className="px-4 py-1.5 bg-amber-950/40 border-b border-amber-500/30 text-[11px] text-amber-300 flex items-center justify-between shrink-0">
              <span>{voiceStatusNotice}</span>
              <button
                type="button"
                onClick={() => setVoiceStatusNotice(null)}
                className="text-amber-400 hover:text-amber-200 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 font-sans scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-slate-950">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Avatar & Sender Info */}
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 px-1">
                  {item.sender === 'jarvis' ? (
                    <>
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-bold text-cyan-300">DemandX Core</span>
                      {item.language && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {item.language.toUpperCase()}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="font-bold text-slate-300">You ({userRole})</span>
                  )}
                  <span>•</span>
                  <span>{item.timestamp}</span>
                </div>

                {/* Bubble Container */}
                <div
                  className={`max-w-[92%] sm:max-w-[80%] rounded-2xl p-4 transition-all shadow-md ${
                    item.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-xs font-medium'
                      : 'bg-slate-900/90 border border-cyan-500/25 text-slate-200 rounded-bl-xs shadow-[0_0_20px_rgba(6,182,212,0.06)]'
                  }`}
                >
                  {/* Tool execution badge tags */}
                  {item.toolsExecuted && item.toolsExecuted.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {item.toolsExecuted.map((tool, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 flex items-center gap-1"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{tool}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message body text */}
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">{item.text}</p>

                  {/* Playback Voice Action for JARVIS replies */}
                  {item.sender === 'jarvis' && voiceEnabled && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => speakText(item.text, item.language || 'en')}
                        className="flex items-center space-x-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Replay Voice</span>
                      </button>
                    </div>
                  )}

                  {/* ======================================================= */}
                  {/* RICH ACTION CARDS: FORECAST, RISKS, REORDER, RAG        */}
                  {/* ======================================================= */}

                  {/* 1. Demand Forecast Card */}
                  {item.forecastCard && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
                      <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            XGBoost Demand Forecast Card
                          </h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
                          {item.forecastCard.demand_level} DEMAND
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Projected Daily</span>
                          <span className="text-base font-black text-cyan-300">
                            {item.forecastCard.predicted_daily_demand}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Safety Target</span>
                          <span className="text-base font-black text-emerald-400">
                            {item.forecastCard.recommended_safety_stock}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Current Stock</span>
                          <span className="text-base font-black text-slate-200">
                            {item.forecastCard.current_opening_stock}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Suggested Order</span>
                          <span className="text-base font-black text-amber-300">
                            {item.forecastCard.suggested_reorder_qty}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Stockout Risk Card */}
                  {item.stockRiskCard && item.stockRiskCard.risks.length > 0 && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-red-500/30 space-y-2">
                      <div className="flex items-center justify-between border-b border-red-950 pb-2">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Stockout Risk Intelligence
                          </h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/50 font-bold">
                          {item.stockRiskCard.critical_count} Critical SKUs
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {item.stockRiskCard.risks.map((r, rIdx) => (
                          <div
                            key={rIdx}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 text-xs border border-slate-800"
                          >
                            <div>
                              <span className="font-bold text-slate-200">{r.product_name}</span>
                              <span className="text-[10px] text-slate-400 block">
                                Supply: {r.days_of_supply} days (Lead time: {r.lead_time_days}d)
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/60 text-red-300 border border-red-600/50">
                                Score: {r.risk_score}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Reorder Draft Card */}
                  {item.reorderDraft && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/40 space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                        <div className="flex items-center space-x-2">
                          <ShoppingBag className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Reorder Purchase Order Draft
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/50">
                          {item.reorderDraft.draft_id}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Product:</span>
                          <span className="font-bold text-white">{item.reorderDraft.product_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Order Quantity:</span>
                          <span className="font-bold text-amber-300">
                            {item.reorderDraft.quantity} {item.reorderDraft.unit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Supplier:</span>
                          <span className="font-medium text-slate-200">{item.reorderDraft.supplier_name}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-800 pt-1">
                          <span className="text-slate-400">Total Estimated:</span>
                          <span className="font-black text-emerald-400 text-sm">
                            ₹{item.reorderDraft.total_estimated_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Confirmation or Confirmed Status */}
                      {item.isConfirmedPO ? (
                        <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Submitted! PO Reference: {item.confirmedPONumber}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleConfirmReorder(item.id, item.reorderDraft!.draft_id)}
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Confirm Purchase Order</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelReorder(item.id)}
                            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. RAG Source Citations */}
                  {item.citations && item.citations.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-cyan-900/30 pt-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>Verified Knowledge Grounding</span>
                      </span>

                      {item.citations.map((c, cIdx) => {
                        const isExpanded = expandedCitations[`${item.id}-${cIdx}`];
                        return (
                          <div
                            key={cIdx}
                            className="p-2 rounded-lg bg-slate-950/70 border border-cyan-500/20 text-xs"
                          >
                            <button
                              type="button"
                              onClick={() => toggleCitation(`${item.id}-${cIdx}`)}
                              className="w-full flex items-center justify-between text-left text-cyan-300 hover:text-cyan-200 font-medium cursor-pointer"
                            >
                              <span>{c.citation}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 shrink-0 ml-1" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 shrink-0 ml-1" />
                              )}
                            </button>
                            {isExpanded && (
                              <p className="mt-1.5 text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800 italic">
                                "{c.excerpt}"
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Processing Telemetry Banner */}
            {assistantState === 'PROCESSING' && (
              <div className="flex items-center space-x-2 text-xs text-cyan-400 animate-pulse px-2 py-1">
                <Cpu className="w-4 h-4 animate-spin text-purple-400" />
                <span className="font-mono">JARVIS is evaluating scenario features & executing tools...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Transcript live preview during speech input */}
          {transcriptPreview && (
            <div className="px-5 py-1.5 bg-cyan-950/60 border-t border-cyan-500/30 text-xs text-cyan-300 flex items-center space-x-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Transcribing: "{transcriptPreview}"</span>
            </div>
          )}

          {/* Starter Prompt Chips */}
          <div className="px-4 py-2 border-t border-slate-900 bg-slate-950/90 flex items-center space-x-2 overflow-x-auto scrollbar-none shrink-0">
            {STARTER_PROMPTS[selectedLang].map((prompt, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-cyan-200 bg-slate-900/90 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 whitespace-nowrap transition-all cursor-pointer shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* =============================================================== */}
          {/* INPUT BAR                                                       */}
          {/* =============================================================== */}
          <footer className="p-3 sm:p-4 border-t border-cyan-900/40 bg-slate-950/95 backdrop-blur-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              {/* Mic Control Button */}
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? 'Stop Listening' : 'Speak with JARVIS'}
                className={`p-3 rounded-2xl transition-all cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 font-bold" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  selectedLang === 'te'
                    ? "వాయిస్ లేదా టెక్స్ట్ ద్వారా అడగండి (ఉదా: 'నా దగ్గర ఏ వస్తువుల స్టాక్ తక్కువగా ఉంది?')..."
                    : selectedLang === 'hi'
                    ? "आवाज या टाइप करके पूछें (उदा: 'मेरे पास किन उत्पादों का स्टॉक कम है?')..."
                    : selectedLang === 'auto'
                    ? "Ask in English, తెలుగు, or हिन्दी (e.g. 'Rice stock entha undi?' or 'चावल की मांग')..."
                    : "Ask JARVIS via voice or text (e.g. 'Forecast tomorrow demand for Sona Masoori rice')..."
                }
                className="flex-1 bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputQuery.trim() || assistantState === 'PROCESSING'}
                className="p-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </footer>
        </div>
      </div>
    </div>
  );
};
