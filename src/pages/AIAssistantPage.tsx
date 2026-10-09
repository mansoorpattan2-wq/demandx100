import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { AI_KNOWLEDGE_BASE } from '../data/aiData';

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'ai' | 'user'; text: string; timestamp: string }>>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am DemandX AI — your grocery & pantry market demand co-pilot for India. How can I help you analyze Sona Masoori rice and staple prices, forecast store inventory, or optimize B2B supplier logistics today?',
      timestamp: '10:42 AM'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedQuestions = [
    "Why is Sona Masoori rice demand increasing?",
    "What should I stock next week?",
    "Which products have the highest demand?",
    "Where should I expand?",
    "What products are likely to become expensive?",
    "How can I reduce inventory waste?"
  ];

  const handleSend = (text?: string) => {
    const query = (text || input).trim();
    if (!query) return;

    const userMsg = {
      id: Math.random().toString(),
      sender: 'user' as const,
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!text) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const normalized = query.toLowerCase();
      let matchedKey = Object.keys(AI_KNOWLEDGE_BASE).find((k) => normalized.includes(k) || k.includes(normalized));
      const answer = matchedKey ? AI_KNOWLEDGE_BASE[matchedKey] : AI_KNOWLEDGE_BASE['default'];

      const aiMsg = {
        id: Math.random().toString(),
        sender: 'ai' as const,
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">DemandX AI</h1>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  GPT-SupplyChain v4.2
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">Your intelligent market decision assistant.</p>
            </div>
          </div>

          <a
            href="/jarvis"
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-900 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 font-bold text-xs shadow-md shadow-cyan-900/20 transition-all cursor-pointer group"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Launch Full-Screen Jarvis 3D Voice Command Centre</span>
            <Sparkles className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </a>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Suggested Prompts & Capabilities */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>Suggested Questions</span>
              </h3>

              <div className="space-y-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-xs font-medium text-slate-800 border border-slate-200/80 hover:border-emerald-300 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Sparkles className="w-5 h-5" />
                <h4 className="font-bold text-sm text-white">AI Assistant Capabilities</h4>
              </div>
              <ul className="text-xs space-y-2 text-emerald-100">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Real-time price anomaly detection</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>South India regional harvest correlation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Waste minimization stock formula</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Chat Main Box */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col justify-between min-h-[580px]">
            
            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[460px]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start space-x-3 ${m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      m.sender === 'ai' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {m.sender === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[82%] ${
                      m.sender === 'ai'
                        ? 'bg-slate-100/90 text-slate-900 rounded-tl-xs border border-slate-200/80 shadow-2xs'
                        : 'bg-emerald-600 text-white rounded-tr-xs shadow-md'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                    <span
                      className={`text-[10px] mt-1.5 block text-right font-medium ${
                        m.sender === 'ai' ? 'text-slate-400' : 'text-emerald-200'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 w-max animate-pulse">
                  <Bot className="w-4 h-4 text-emerald-600" />
                  <span>DemandX AI is analyzing market indicators...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder="Ask DemandX AI about demand trends, stock targets, or prices..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
};
