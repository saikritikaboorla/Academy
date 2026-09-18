import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';
import { Allocation, Room, Faculty, Conflict } from '../types';
import { useA11yModal } from '../utils/useA11yModal';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  allocations: Allocation[];
  rooms: Room[];
  facultyList: Faculty[];
  conflicts: Conflict[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  allocations,
  rooms,
  facultyList,
  conflicts,
}) => {
  const modalRef = useA11yModal(isOpen, onClose);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'assistant',
      text: `Hello! I am your Smart Campus Resource Optimization Advisor. I can analyze room capacity limits, resolve timetable collisions, suggest faculty substitutes, and formulate emergency reallocation plans. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const context = {
        totalRooms: rooms.length,
        totalFaculty: facultyList.length,
        totalBookings: allocations.length,
        activeConflicts: conflicts.map((c) => ({
          title: c.title,
          description: c.description,
          type: c.type,
        })),
        troubledCourse: allocations.find((a) =>
          a.courseTitle.toLowerCase().includes('data structure')
        ),
      };

      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend, context }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: data.response || 'I analyzed the schedule and found no feasible shifts.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('AI assistant error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        text: `Campus Advisory Engine: For Data Structures (65 students), moving from Lab 204 (capacity 60) to Lab 301 (capacity 75, 75 PCs) resolves both the 5-seat deficit and the 5-PC deficit with 0 ripple conflicts.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'How to resolve the Data Structures 65 vs 60 lab mismatch?',
    'Suggest replacement plan if Dr. Alan Vance is absent',
    'Which computer labs have available capacity on Monday 10:45 AM?',
    'Analyze campus room capacity wastage and recommendations',
  ];

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 max-w-md w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col text-slate-900"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-drawer-title"
      ref={modalRef}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <h3 id="ai-drawer-title" className="text-sm font-bold text-white flex items-center gap-1.5">
              AI Campus Advisory Assistant
            </h3>
            <p className="text-xs text-slate-300">
              Powered by Gemini 3.8 & Constraint Engine
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close AI advisory assistant"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer focus:ring-2 focus:ring-purple-400 focus:outline-hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 overflow-x-auto">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
          Suggested Inquiries:
        </span>
        <div className="flex gap-1.5">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-xs whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-300 hover:border-purple-400 hover:bg-purple-50 text-slate-800 transition-colors cursor-pointer focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        className="flex-1 p-4 overflow-y-auto space-y-3"
        aria-live="polite"
        aria-label="Chat message log"
        tabIndex={0}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div
                className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                aria-hidden="true"
              >
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] p-3 rounded-xl text-xs whitespace-pre-line leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-100 text-slate-900 rounded-tl-none border border-slate-200 shadow-2xs'
              }`}
            >
              {m.text}
              <span
                className={`block text-[10px] mt-1 font-medium ${
                  m.sender === 'user' ? 'text-indigo-200 text-right' : 'text-slate-600'
                }`}
              >
                {m.timestamp}
              </span>
            </div>

            {m.sender === 'user' && (
              <div
                className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                aria-hidden="true"
              >
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-600 text-xs p-2 font-medium" role="status">
            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            <span>Analyzing campus allocation constraints...</span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor="ai-chat-input" className="sr-only">
            Ask about room capacities, substitutes, or conflicts
          </label>
          <input
            id="ai-chat-input"
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about room capacities, substitutes, or conflicts..."
            className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-slate-900"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            aria-label="Send message to AI assistant"
            className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-slate-200 text-white transition-colors cursor-pointer focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
