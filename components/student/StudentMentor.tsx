import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, SendIcon, SparklesIcon, LeafIcon, RefreshIcon } from '../icons';
import { generateQuickReplies, getMentorGreeting, streamMentorChat } from '../../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  retryPrompt?: string;
}

interface StudentMentorProps {
  onBack: () => void;
}

const formatMentorText = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

const StudentMentor: React.FC<StudentMentorProps> = ({ onBack }) => {
  const initialStudentName = localStorage.getItem('mindguard_user_name') || '';
  const initialGreeting = initialStudentName
    ? `Hi ${initialStudentName}! I'm Mindy. How are you feeling today?`
    : "Hi there! I'm Mindy. How can I help you feel your best today?";

  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: initialGreeting },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([
    "I'm feeling stressed",
    'Give me a study tip',
    'Help me unwind',
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState('Online');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  useEffect(() => {
    let active = true;

    const initChat = async () => {
      const studentName = localStorage.getItem('mindguard_user_name') || '';
      const lastEntry = localStorage.getItem('mindguard_journal_entries');
      const latestStress = localStorage.getItem('mindguard_latest_stress_score');

      const contextParts: string[] = [];
      if (lastEntry) contextParts.push('Student recently wrote in their journal.');
      if (latestStress) contextParts.push(`Latest stress check-in score is ${latestStress}/100.`);
      if (contextParts.length === 0) contextParts.push('Student is opening a wellness check-in chat.');

      const greeting = await getMentorGreeting('student', contextParts.join(' '), studentName);
      if (!active) return;

      const welcomeMsg: Message = { role: 'model', text: greeting };
      setMessages((prev) => {
        if (prev.some((m) => m.role === 'user')) return prev;
        return [welcomeMsg];
      });
      setStatus('Online');
      updateSuggestions([welcomeMsg]);
    };

    initChat();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const updateSuggestions = async (history: Message[]) => {
    const cleanHistory = history.filter((m) => !m.isError && m.text.trim().length > 0);
    const newSuggestions = await generateQuickReplies(cleanHistory);
    setSuggestions(newSuggestions);
  };

  const handleGrounding = () => {
    handleSendMessage("I'm feeling a bit overwhelmed. Can we do a quick grounding exercise?");
  };

  const handleSendMessage = async (textOverride?: string, isRetry = false) => {
    const userMessage = (textOverride ?? inputValue).trim();
    if (!userMessage || isTyping || isSendingRef.current) return;
    isSendingRef.current = true;

    const cleanHistory = messages.filter((m) => !m.isError && m.text.trim().length > 0);

    // If retrying a failed turn, remove the trailing error bubble and avoid duplicating the user message
    const baseMessages = isRetry
      ? messages.filter((m, idx) => !(idx === messages.length - 1 && m.isError))
      : [...messages, { role: 'user' as const, text: userMessage }];

    const historyForModel = isRetry
      ? cleanHistory.slice(0, cleanHistory[cleanHistory.length - 1]?.role === 'user' ? -1 : cleanHistory.length)
      : cleanHistory;

    setMessages([...baseMessages, { role: 'model', text: '' }]);
    if (!textOverride) setInputValue('');
    setSuggestions([]);
    setIsTyping(true);
    setStatus('Thinking...');

    const studentName = localStorage.getItem('mindguard_user_name') || '';
    const latestStress = localStorage.getItem('mindguard_latest_stress_score');
    const systemInstruction = `You are Mindy, a deeply empathetic and intelligent academic wellness mentor talking to a student${
      studentName ? ` named ${studentName}` : ''
    }.${
      latestStress ? ` Their latest wellness check-in score was ${latestStress}/100.` : ''
    } Validate their emotions first, keep responses concise and easy to read with line breaks when helpful, and use warm emojis sparingly. If they ask for a grounding exercise, guide them clearly step-by-step.`;

    try {
      const modelText = await streamMentorChat(
        systemInstruction,
        historyForModel,
        userMessage,
        (partialText) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'model') {
              return [...prev.slice(0, -1), { ...last, text: partialText, isError: false }];
            }
            return prev;
          });
        }
      );
      setStatus('Online');
      updateSuggestions([
        ...historyForModel,
        { role: 'user', text: userMessage },
        { role: 'model', text: modelText },
      ]);
    } catch (err) {
      const errMessage =
        err instanceof Error && err.message.trim()
          ? err.message.trim()
          : "I'm here for you, but my connection flickered. Let's try again?";

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const errorBubble: Message = {
          role: 'model',
          text: errMessage,
          isError: true,
          retryPrompt: userMessage,
        };
        if (last?.role === 'model' && last.text === '') {
          return [...prev.slice(0, -1), errorBubble];
        }
        return [...prev, errorBubble];
      });
      setStatus('Online');
    } finally {
      isSendingRef.current = false;
      setIsTyping(false);
    }
  };

  const showTypingIndicator =
    isTyping && messages.length > 0 && messages[messages.length - 1]?.role === 'model' && messages[messages.length - 1]?.text === '';

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
          disabled={isTyping}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d1fae5] to-[#e0f2fe] text-[#0f3d3e] hover:brightness-95 disabled:opacity-50 transition-all border border-[#a7f3d0] text-xs font-semibold whitespace-nowrap shrink-0 min-h-[44px]"
        >
          <LeafIcon className="w-3.5 h-3.5 text-[#059669]" />
          <span>Quick Calm</span>
        </button>
      </header>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar max-w-3xl mx-auto w-full">
        {messages.map((msg, i) => {
          if (msg.role === 'model' && msg.text === '' && isTyping && i === messages.length - 1) {
            return null;
          }
          return (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white rounded-br-xs shadow-xs'
                    : msg.isError
                      ? 'bg-[#fff7ed] text-[#9a3412] rounded-bl-xs border border-[#fed7aa]'
                      : 'bg-white text-[#0f3d3e] rounded-bl-xs border border-[#bde6de]'
                }`}
              >
                <div>{formatMentorText(msg.text)}</div>
                {msg.isError && msg.retryPrompt && (
                  <button
                    type="button"
                    onClick={() => handleSendMessage(msg.retryPrompt, true)}
                    disabled={isTyping}
                    className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white text-[#0f3d3e] border border-[#fed7aa] hover:bg-[#ffedd5] text-xs font-semibold transition-colors min-h-[36px]"
                  >
                    <RefreshIcon className="w-3.5 h-3.5" />
                    <span>Retry message</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {showTypingIndicator && (
          <div className="flex justify-start" aria-label="Mindy is typing">
            <div className="bg-white border border-[#cce7e3] px-4 py-3.5 rounded-2xl flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-[#99d8cf] rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-[#2dd4bf] rounded-full animate-bounce [animation-delay:200ms]" />
              <div className="w-1.5 h-1.5 bg-[#0d9488] rounded-full animate-bounce [animation-delay:400ms]" />
            </div>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pb-2.5">
          <div className="flex space-x-2 overflow-x-auto no-scrollbar py-1">
            {suggestions.map((s, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleSendMessage(s)}
                disabled={isTyping}
                className="flex-shrink-0 px-3.5 py-2 bg-white text-[#0f3d3e] text-xs font-semibold rounded-xl border border-[#cce7e3] hover:bg-[#eaf6f4] disabled:opacity-50 transition-colors whitespace-nowrap min-h-[44px]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

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