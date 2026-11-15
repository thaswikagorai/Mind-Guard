import React, { useState, useEffect, useRef } from 'react';
import Card from '../common/Card';
import {
  QuoteIcon,
  SparklesIcon,
  HeartOutlineIcon,
  HeartFilledIcon,
  ClipboardCopyIcon,
  CheckIcon,
  SpeakerWaveIcon,
  BookOpenIcon,
} from '../icons';
import {
  DailyAffirmation,
  AFFIRMATION_THEMES,
  getDailyAffirmation,
  markAffirmationViewedToday,
  toggleFavoriteAffirmation,
  isAffirmationFavorited,
  getFavoriteAffirmations,
} from '../../services/affirmationsData';
import { generatePersonalizedDailyAffirmation } from '../../services/geminiService';

interface DailyAffirmationWidgetProps {
  studentName?: string;
  onNavigateToJournal?: () => void;
  onNavigateToWellness?: () => void;
}

const DailyAffirmationWidget: React.FC<DailyAffirmationWidgetProps> = ({
  studentName,
  onNavigateToJournal,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [currentAffirmation, setCurrentAffirmation] = useState<DailyAffirmation>(() =>
    getDailyAffirmation(new Date(), studentName, 'all')
  );
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(1);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [showBreather, setShowBreather] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCounter, setBreathCounter] = useState<number>(4);
  const [showFavoritesModal, setShowFavoritesModal] = useState<boolean>(false);
  const [favoritesList, setFavoritesList] = useState<DailyAffirmation[]>([]);
  const [recentMoodContext, setRecentMoodContext] = useState<string | null>(null);

  const breathTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const updatedStreak = markAffirmationViewedToday();
    setStreak(updatedStreak);

    try {
      const journalRaw = localStorage.getItem('mindguard_journal_entries');
      if (journalRaw) {
        const entries = JSON.parse(journalRaw);
        if (entries && entries.length > 0 && entries[0].mood) {
          setRecentMoodContext(entries[0].mood);
        }
      }
    } catch {
      // ignore
    }

    const initialAffirmation = getDailyAffirmation(new Date(), studentName, selectedTheme);
    setCurrentAffirmation(initialAffirmation);
    setIsFavorited(isAffirmationFavorited(initialAffirmation.quote));
  }, [studentName]);

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    const updated = getDailyAffirmation(new Date(), studentName, themeId);
    setCurrentAffirmation(updated);
    setIsFavorited(isAffirmationFavorited(updated.quote));
    if (isSpeaking && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSparkAIAffirmation = async () => {
    if (isGeneratingAI) return;
    setIsGeneratingAI(true);
    try {
      const result = await generatePersonalizedDailyAffirmation(
        studentName,
        selectedTheme,
        recentMoodContext || undefined
      );

      const aiAffirmation: DailyAffirmation = {
        id: `ai-${Date.now()}`,
        quote: result.quote,
        author: result.author || 'Mindy & MindGuard AI',
        theme: (selectedTheme as any) || 'general',
        themeLabel: result.themeLabel || 'AI Personalized',
        reflectionPrompt: result.reflectionPrompt || 'How does this thought resonate with your day?',
        bgGradient: 'from-[#ccf7ef] via-[#e9f8ff] to-[#f3e8ff]',
        accentColor: 'text-[#0f766e]',
      };

      setCurrentAffirmation(aiAffirmation);
      setIsFavorited(isAffirmationFavorited(aiAffirmation.quote));
    } catch (e) {
      console.error('AI Affirmation error:', e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleToggleFavorite = () => {
    const favoritedNow = toggleFavoriteAffirmation(currentAffirmation);
    setIsFavorited(favoritedNow);
    setFavoritesList(getFavoriteAffirmations());
  };

  const handleCopy = () => {
    const shareText = `"${currentAffirmation.quote}"\n— ${currentAffirmation.author} (via MindGuard)`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentAffirmation.quote);
    utterance.rate = 0.88;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const gentleVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.name.includes('Google') ||
          v.name.includes('Victoria'))
    );
    if (gentleVoice) utterance.voice = gentleVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleStartBreathing = () => {
    setShowBreather(true);
    setBreathPhase('inhale');
    setBreathCounter(4);
  };

  useEffect(() => {
    if (!showBreather) {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
      return;
    }

    breathTimerRef.current = window.setInterval(() => {
      setBreathCounter((prev) => {
        if (prev > 1) return prev - 1;
        setBreathPhase((currPhase) => {
          if (currPhase === 'inhale') return 'hold';
          if (currPhase === 'hold') return 'exhale';
          return 'inhale';
        });
        return 4;
      });
    }, 1000);

    return () => {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, [showBreather]);

  const handleReflectInJournal = () => {
    try {
      localStorage.setItem('mindguard_journal_prompt_draft', currentAffirmation.reflectionPrompt);
      localStorage.setItem('mindguard_journal_quote_draft', currentAffirmation.quote);
    } catch {
      // ignore
    }
    if (onNavigateToJournal) {
      onNavigateToJournal();
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-3">
      {/* Unboxed Metadata Header Row */}
      <div className="flex items-center justify-between gap-2 px-0.5 text-xs text-[#4b7476]">
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span className="font-semibold text-[#0f3d3e] whitespace-nowrap">Daily Affirmation</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{formattedDate}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            title={`${streak}-day daily reflection streak`}
            className="font-semibold text-[#c2410c] tabular-nums whitespace-nowrap"
          >
            🔥 {streak}d streak
          </span>
          <button
            type="button"
            onClick={() => {
              setFavoritesList(getFavoriteAffirmations());
              setShowFavoritesModal(true);
            }}
            className="font-semibold text-[#be123c] hover:text-[#9f1239] transition-colors whitespace-nowrap py-1"
            title="View saved affirmations"
          >
            Saved
          </button>
        </div>
      </div>

      {/* Main Affirmation Card */}
      <Card
        className={`relative overflow-hidden border border-[#bde6de] bg-gradient-to-br ${currentAffirmation.bgGradient} p-5 sm:p-6 rounded-2xl`}
      >
        {/* Top Row: Clean Editorial Theme Kicker + Spark AI */}
        <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
          <span className={`text-xs font-bold ${currentAffirmation.accentColor}`}>
            {currentAffirmation.themeLabel}
          </span>

          <button
            type="button"
            onClick={handleSparkAIAffirmation}
            disabled={isGeneratingAI}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#0d9488] to-[#6366f1] hover:brightness-105 px-3 py-1.5 rounded-xl shadow-xs transition-all disabled:opacity-50 whitespace-nowrap shrink-0"
            title="Generate a personalized quote using Mindy AI"
          >
            <SparklesIcon className={`w-3.5 h-3.5 text-white ${isGeneratingAI ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAI ? 'Inspiring...' : 'Spark AI'}</span>
          </button>
        </div>

        {/* Affirmation Quote */}
        <div className="relative z-10 my-2">
          <QuoteIcon className="w-6 h-6 text-[#99d8cf] mb-2" />
          <blockquote className="font-serif-elegant text-lg sm:text-xl font-bold text-[#0f3d3e] leading-snug text-balance">
            "{currentAffirmation.quote}"
          </blockquote>
          <p className="mt-3 text-xs font-semibold text-[#335c5d]">
            — {currentAffirmation.author}
          </p>
        </div>

        {/* Reflection Prompt Section */}
        <div className="mt-5 pt-4 border-t border-[#cce7e3]/80 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#0f766e]">Today's Reflection</p>
            <p className="text-xs text-[#335c5d] italic mt-0.5 line-clamp-2 leading-relaxed">
              "{currentAffirmation.reflectionPrompt}"
            </p>
          </div>

          <button
            type="button"
            onClick={handleReflectInJournal}
            className="self-start sm:self-auto inline-flex items-center space-x-1.5 bg-white hover:bg-[#eaf6f4] text-[#0f3d3e] text-xs font-semibold px-3 py-2 rounded-xl border border-[#cce7e3] transition-colors shrink-0 whitespace-nowrap min-h-[38px]"
            title="Reflect on this prompt in your Private Journal"
          >
            <BookOpenIcon className="w-3.5 h-3.5 text-[#0d9488]" />
            <span>Journal this</span>
          </button>
        </div>

        {/* Interactive Action Bar */}
        <div className="mt-4 pt-3.5 border-t border-[#cce7e3]/60 flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors whitespace-nowrap min-h-[38px] ${
                isSpeaking
                  ? 'bg-[#0d9488] text-white'
                  : 'bg-white/90 hover:bg-white text-[#335c5d] border border-[#cce7e3]'
              }`}
              title={isSpeaking ? 'Stop reading' : 'Listen aloud'}
            >
              <SpeakerWaveIcon className="w-4 h-4" />
              <span>{isSpeaking ? 'Listening...' : 'Listen'}</span>
            </button>

            <button
              type="button"
              onClick={handleStartBreathing}
              className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 bg-white/90 hover:bg-white text-[#335c5d] border border-[#cce7e3] transition-colors whitespace-nowrap min-h-[38px]"
              title="Take a 10-second mindful pause"
            >
              <span>10s Breath</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-2 rounded-xl bg-white/90 hover:bg-white text-[#335c5d] border border-[#cce7e3] transition-colors flex items-center space-x-1 min-h-[38px]"
              title="Copy affirmation"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4 text-[#0d9488]" />
                  <span className="text-xs font-semibold text-[#0f766e]">Copied</span>
                </>
              ) : (
                <ClipboardCopyIcon className="w-4 h-4 text-[#4b7476]" />
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`p-2 rounded-xl border transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center ${
                isFavorited
                  ? 'bg-rose-50 border-rose-200 text-rose-500'
                  : 'bg-white/90 hover:bg-white border-[#cce7e3] text-[#4b7476] hover:text-rose-500'
              }`}
              title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
            >
              {isFavorited ? (
                <HeartFilledIcon className="w-4 h-4 text-rose-500" />
              ) : (
                <HeartOutlineIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Breathing Micro-Overlay */}
        {showBreather && (
          <div className="absolute inset-0 bg-[#0f3d3e]/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-5 text-white text-center rounded-2xl">
            <div className="relative flex items-center justify-center w-24 h-24 mb-4">
              <div
                className={`absolute inset-0 rounded-full border-4 transition-transform duration-1000 ${
                  breathPhase === 'inhale'
                    ? 'scale-125 border-[#5eead4] bg-[#2dd4bf]/20'
                    : breathPhase === 'hold'
                    ? 'scale-125 border-[#99f6e4] bg-[#14b8a6]/20'
                    : 'scale-90 border-[#a5b4fc] bg-[#818cf8]/15'
                }`}
              />
              <div className="flex flex-col items-center z-10">
                <span className="text-2xl font-bold font-mono-num">{breathCounter}</span>
                <span className="text-[11px] font-semibold capitalize text-[#ccfbf1]">{breathPhase}</span>
              </div>
            </div>

            <p className="text-sm font-medium text-[#eaf6f4] max-w-xs">
              {breathPhase === 'inhale' && 'Inhale peace and clarity...'}
              {breathPhase === 'hold' && 'Hold gently. Notice the stillness...'}
              {breathPhase === 'exhale' && 'Exhale all tension and hurry...'}
            </p>

            <button
              type="button"
              onClick={() => setShowBreather(false)}
              className="mt-4 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 px-4 py-2 rounded-xl transition-colors"
            >
              Finish Breath
            </button>
          </div>
        )}
      </Card>

      {/* Interactive Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gradient-to-r from-[#e6faf6] to-[#eef2ff] border border-[#bde6de] rounded-xl overflow-x-auto scrollbar-none">
        {AFFIRMATION_THEMES.map((theme) => (
          <button
            type="button"
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTheme === theme.id
                ? 'bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white shadow-xs'
                : 'text-[#335c5d] hover:text-[#0f3d3e] hover:bg-white/60'
            }`}
          >
            {theme.label}
          </button>
        ))}
      </div>

      {/* Favorites Modal */}
      {showFavoritesModal && (
        <div
          className="fixed inset-0 bg-[#0f3d3e]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setShowFavoritesModal(false)}
        >
          <div
            className="bg-white rounded-3xl border border-[#cce7e3] shadow-xl max-w-sm w-full p-6 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#eaf6f4]">
              <h3 className="font-serif-elegant font-bold text-lg text-[#0f3d3e]">
                Saved Affirmations
              </h3>
              <button
                type="button"
                onClick={() => setShowFavoritesModal(false)}
                aria-label="Close saved affirmations"
                className="w-9 h-9 rounded-xl bg-[#eaf6f4] hover:bg-[#d8efec] flex items-center justify-center text-[#0f3d3e] font-bold"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {favoritesList.length === 0 ? (
                <div className="text-center py-8 text-[#4b7476]">
                  <p className="text-sm font-medium text-[#0f3d3e]">No saved affirmations yet.</p>
                  <p className="text-xs mt-1">
                    Tap the heart icon on any daily quote to keep it here.
                  </p>
                </div>
              ) : (
                favoritesList.map((fav, idx) => (
                  <div
                    key={fav.id || idx}
                    className="p-4 rounded-2xl bg-[#f4fbfa] border border-[#cce7e3] space-y-2"
                  >
                    <p className="font-serif-elegant text-sm text-[#0f3d3e] font-medium leading-relaxed">
                      "{fav.quote}"
                    </p>
                    <div className="flex items-center justify-between text-xs text-[#4b7476]">
                      <span>— {fav.author}</span>
                      <button
                        type="button"
                        onClick={() => {
                          toggleFavoriteAffirmation(fav);
                          setFavoritesList(getFavoriteAffirmations());
                          if (currentAffirmation.quote === fav.quote) {
                            setIsFavorited(false);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#eaf6f4]">
              <button
                type="button"
                onClick={() => setShowFavoritesModal(false)}
                className="w-full py-3 bg-[#0d9488] text-white font-semibold rounded-xl text-sm hover:bg-[#0f766e] transition-colors min-h-[44px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyAffirmationWidget;
