import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, SendIcon, SparklesIcon, LeafIcon } from '../icons';
import { generateQuickReplies, getMentorGreeting, streamMentorChat } from '../../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface StudentMentorProps {
  onBack: () => void;
}

const STUDENT_MENTOR_SYSTEM_INSTRUCTION = `You are Mindy, a deeply empathetic and intelligent academic wellness mentor. 
Context: You are talking to a student. Validate their emotions first. Be concise. Use emojis. 
If they need a grounding exercise, lead them through it step-by-step.`;

const StudentMentor: React.FC<StudentMentorProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState('Connecting...');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      const lastEntry = localStorage.getItem('mindguard_journal_entries');
      const context = lastEntry
        ? 'Student recently journaled about their feelings.'
        : 'Student is starting their wellness journey.';
      const greeting = await getMentorGreeting('student', context);

      const welcomeMsg: Message = { role: 'model', text: greeting };
      setMessages([welcomeMsg]);
      setStatus('Online');
      updateSuggestions([welcomeMsg]);
    };

    initChat();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const updateSuggestions = async (history: Message[]) => {
    const newSuggestions = await generateQuickReplies(history);
    setSuggestions(newSuggestions);
  };

  const handleGrounding = () => {
    handleSendMessage("I'm feeling a bit overwhelmed. Can we do a quick grounding exercise?");
  };

  const handleSendMessage = async (textOverride?: string) => {
    const userMessage = textOverride || inputValue.trim();
    if (!userMessage || isTyping) return;

    const historyBeforeSend = [...messages];
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }, { role: 'model', text: '' }]);
    setInputValue('');
    setSuggestions([]);
    setIsTyping(true);
    setStatus('Thinking...');

    try {
      const modelText = await streamMentorChat(
        STUDENT_MENTOR_SYSTEM_INSTRUCTION,
        historyBeforeSend,
        userMessage,
        (partialText) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'model') return [...prev.slice(0, -1), { ...last, text: partialText }];
            return prev;
          });
        }
      );
      setStatus('Online');
      updateSuggestions([
        ...historyBeforeSend,
        { role: 'user', text: userMessage },
        { role: 'model', text: modelText },
      ]);
    } catch {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const fallback = "I'm here for you, but my connection flickered. Let's try again? 💙";
        if (last?.role === 'model' && last.text === '') {
          return [...prev.slice(0, -1), { role: 'model', text: fallback }];
        }
        return [...prev, { role: 'model', text: fallback }];
      });
      setStatus('Online');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#eefaf7] via-[#f4fbff] to-[#eef2ff] relative overflow-hidden">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white border-b border-[#bde6de]">
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl hover:bg-[#e3f7f3] text-[#4b7476] hover:text-[#0f3d3e] mr-2 transition-colors flex items-center justify-center"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0d9488] via-[#06b6d4] to-[#6366f1] flex items-center justify-center text-white shadow-xs">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0f3d3e] font-serif-elegant leading-none">Mindy</h1>
              <p className="text-xs text-[#0f766e] font-medium mt-1">
                AI Wellness Mentor · {status}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGrounding}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d1fae5] to-[#e0f2fe] text-[#0f3d3e] hover:brightness-95 transition-all border border-[#a7f3d0] text-xs font-semibold whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <LeafIcon className="w-3.5 h-3.5 text-[#059669]" />
          <span>Quick Calm</span>
        </button>
      </header>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar max-w-3xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white rounded-br-xs shadow-xs'
                  : 'bg-white text-[#0f3d3e] rounded-bl-xs border border-[#bde6de]'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && messages[messages.length - 1]?.text === '' && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#cce7e3] px-4 py-3.5 rounded-2xl flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-[#99d8cf] rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-[#2dd4bf] rounded-full animate-bounce [animation-delay:200ms]" />
              <div className="w-1.5 h-1.5 bg-[#0d9488] rounded-full animate-bounce [animation-delay:400ms]" />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pb-2.5">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar py-1">
          {suggestions.map((s, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => handleSendMessage(s)}
              disabled={isTyping}
              className="flex-shrink-0 px-3.5 py-2 bg-white text-[#0f3d3e] text-xs font-semibold rounded-xl border border-[#cce7e3] hover:bg-[#eaf6f4] transition-colors whitespace-nowrap min-h-[38px]"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-[#cce7e3]">
        <div className="max-w-3xl mx-auto flex items-center space-x-2.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Message Mindy..."
            className="flex-grow py-3 px-4 bg-[#f4fbfa] border border-[#cce7e3] rounded-xl focus:outline-none focus:border-[#0d9488] focus:bg-white text-sm text-[#0f3d3e] placeholder-[#7ca1a3] min-h-[44px]"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isTyping}
            aria-label="Send message"
            className="min-w-[44px] min-h-[44px] px-4 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-xl disabled:opacity-40 transition-colors flex items-center justify-center"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentMentor;