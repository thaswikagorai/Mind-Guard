import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, SendIcon, SparklesIcon } from '../icons';
import { generateQuickReplies, getMentorGreeting, streamMentorChat } from '../../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ParentMentorProps {
  onBack: () => void;
  studentData: any;
}

const ParentMentor: React.FC<ParentMentorProps> = ({ onBack, studentData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState('Consulting...');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      const context = `Parent is reviewing child stress trends. Stress has ${
        studentData.stressReport.slice(-1)[0].stressLevel > 50 ? 'increased' : 'stabilized'
      } recently.`;
      const greeting = await getMentorGreeting('parent', context);

      const welcomeMsg: Message = { role: 'model', text: greeting };
      setMessages([welcomeMsg]);
      setStatus('Online');
      updateSuggestions([welcomeMsg]);
    };

    initChat();
  }, [studentData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const updateSuggestions = async (history: Message[]) => {
    const newSuggestions = await generateQuickReplies(history);
    setSuggestions(newSuggestions);
  };

  const handleSendMessage = async (textOverride?: string) => {
    const userMessage = textOverride || inputValue.trim();
    if (!userMessage || isTyping) return;

    const historyBeforeSend = [...messages];
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }, { role: 'model', text: '' }]);
    setInputValue('');
    setSuggestions([]);
    setIsTyping(true);
    setStatus('Researching...');

    const systemInstruction = `You are Dr. Aris, a child development specialist. 
Use this child data for context: ${JSON.stringify(studentData.stressReport)}. 
Tone: Reassuring, practical, expert. Focus on communication scripts for parents.`;

    try {
      const modelText = await streamMentorChat(
        systemInstruction,
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
        const fallback = "I'm having a brief issue with the data stream. Please try again soon.";
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
      <header className="flex items-center px-4 sm:px-6 py-3.5 bg-white border-b border-[#bde6de]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl hover:bg-[#e3f7f3] text-[#4b7476] hover:text-[#0f3d3e] mr-2 transition-colors flex items-center justify-center"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4f46e5] via-[#0284c7] to-[#14b8a6] flex items-center justify-center text-white shadow-xs">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0f3d3e] font-serif-elegant leading-none">
              Dr. Aris
            </h1>
            <p className="text-xs text-[#4f46e5] font-medium mt-1">
              Family Advisor · {status}
            </p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar max-w-3xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-[#4f46e5] to-[#0284c7] text-white rounded-br-xs shadow-xs'
                  : 'bg-white text-[#0f3d3e] rounded-bl-xs border border-[#bde6de]'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && messages[messages.length - 1]?.text === '' && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#cce7e3] px-4 py-3 rounded-2xl flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-[#99d8cf] rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-[#2dd4bf] rounded-full animate-bounce [animation-delay:200ms]" />
              <div className="w-1.5 h-1.5 bg-[#4f5d95] rounded-full animate-bounce [animation-delay:400ms]" />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pb-2.5">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar py-1">
          {suggestions.map((s, i) => (
            <button
              type="button"
              key={i}
              onClick={() => handleSendMessage(s)}
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
            placeholder="Consult with Dr. Aris..."
            className="flex-grow py-3 px-4 bg-[#f4fbfa] border border-[#cce7e3] rounded-xl focus:outline-none focus:border-[#4f5d95] focus:bg-white text-sm text-[#0f3d3e] placeholder-[#7ca1a3] min-h-[44px]"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isTyping}
            aria-label="Send message"
            className="min-w-[44px] min-h-[44px] px-4 bg-gradient-to-r from-[#4f46e5] to-[#0284c7] hover:brightness-105 text-white rounded-xl disabled:opacity-40 transition-all flex items-center justify-center"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentMentor;