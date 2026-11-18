import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeftIcon,
  SpeakerWaveIcon,
  ClipboardCopyIcon,
  CheckIcon,
  RefreshIcon,
} from '../icons';

interface CuratedAffirmationItem {
  id: string;
  number: string;
  theme: string;
  text: string;
  surfaceClass: string;
  borderClass: string;
  accentTextClass: string;
  motifColor: string;
  motifType:
    | 'leaf'
    | 'sprout'
    | 'horizon'
    | 'compass'
    | 'waves'
    | 'bloom'
    | 'bridge'
    | 'sunbeam'
    | 'stars'
    | 'moon';
}

const WELLNESS_AFFIRMATIONS: CuratedAffirmationItem[] = [
  {
    id: 'aff-01',
    number: '01',
    theme: 'Curiosity & Capability',
    text: 'I am capable of learning anything I put my mind to.',
    surfaceClass: 'from-[#eefbf8] via-[#ffffff] to-[#e2f5f2]',
    borderClass: 'border-[#b7e4dc]',
    accentTextClass: 'text-[#0f766e]',
    motifColor: '#0d9488',
    motifType: 'compass',
  },
  {
    id: 'aff-02',
    number: '02',
    theme: 'Growth Mindset',
    text: 'Mistakes are part of learning, and every one helps me grow.',
    surfaceClass: 'from-[#f0fdf4] via-[#ffffff] to-[#dcfce7]',
    borderClass: 'border-[#b8ebc8]',
    accentTextClass: 'text-[#15803d]',
    motifColor: '#16a34a',
    motifType: 'sprout',
  },
  {
    id: 'aff-03',
    number: '03',
    theme: 'Self-Kindness',
    text: 'I do not need to be perfect. I only need to keep trying.',
    surfaceClass: 'from-[#fff8f1] via-[#ffffff] to-[#ffedd5]',
    borderClass: 'border-[#fed7aa]',
    accentTextClass: 'text-[#c2410c]',
    motifColor: '#ea580c',
    motifType: 'sunbeam',
  },
  {
    id: 'aff-04',
    number: '04',
    theme: 'Effort Over Marks',
    text: 'My effort matters more than my marks.',
    surfaceClass: 'from-[#f0f9ff] via-[#ffffff] to-[#e0f2fe]',
    borderClass: 'border-[#bae6fd]',
    accentTextClass: 'text-[#0369a1]',
    motifColor: '#0284c7',
    motifType: 'horizon',
  },
  {
    id: 'aff-05',
    number: '05',
    theme: 'Steady Resilience',
    text: 'I can handle challenges one step at a time.',
    surfaceClass: 'from-[#eef2ff] via-[#ffffff] to-[#e0e7ff]',
    borderClass: 'border-[#c7d2fe]',
    accentTextClass: 'text-[#4338ca]',
    motifColor: '#4f46e5',
    motifType: 'waves',
  },
  {
    id: 'aff-06',
    number: '06',
    theme: 'Honoring Progress',
    text: 'I am proud of how far I have come.',
    surfaceClass: 'from-[#fff1f2] via-[#ffffff] to-[#ffe4e6]',
    borderClass: 'border-[#fecdd3]',
    accentTextClass: 'text-[#be123c]',
    motifColor: '#e11d48',
    motifType: 'bloom',
  },
  {
    id: 'aff-07',
    number: '07',
    theme: 'Courage to Connect',
    text: 'It is okay to ask for help. Asking questions makes me stronger.',
    surfaceClass: 'from-[#ecfeff] via-[#ffffff] to-[#cffafe]',
    borderClass: 'border-[#a5f3fc]',
    accentTextClass: 'text-[#0e7490]',
    motifColor: '#0891b2',
    motifType: 'bridge',
  },
  {
    id: 'aff-08',
    number: '08',
    theme: 'Confidence & Voice',
    text: 'I believe in my ideas, and my voice deserves to be heard.',
    surfaceClass: 'from-[#fefce8] via-[#ffffff] to-[#fef3c7]',
    borderClass: 'border-[#fde68a]',
    accentTextClass: 'text-[#a16207]',
    motifColor: '#d97706',
    motifType: 'stars',
  },
  {
    id: 'aff-09',
    number: '09',
    theme: 'Whole Self-Worth',
    text: 'I am more than a grade or a test result.',
    surfaceClass: 'from-[#f5f3ff] via-[#ffffff] to-[#ede9fe]',
    borderClass: 'border-[#ddd6fe]',
    accentTextClass: 'text-[#6d28d9]',
    motifColor: '#7c3aed',
    motifType: 'leaf',
  },
  {
    id: 'aff-10',
    number: '10',
    theme: 'Peaceful Sufficiency',
    text: 'Today I will do my best, and that is enough.',
    surfaceClass: 'from-[#f0fdfa] via-[#ffffff] to-[#e6faf6]',
    borderClass: 'border-[#99e2d8]',
    accentTextClass: 'text-[#0f766e]',
    motifColor: '#0d9488',
    motifType: 'moon',
  },
];

const getTodayKey = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `mindguard_wellness_affirmed_${y}-${m}-${d}`;
};

const BotanicalCornerMotif: React.FC<{
  type: CuratedAffirmationItem['motifType'];
  color: string;
  className?: string;
}> = ({ type, color, className = '' }) => {
  const sharedProps = {
    viewBox: '0 0 80 80',
    fill: 'none',
    stroke: color,
    strokeWidth: '1.35',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className,
  };

  switch (type) {
    case 'sprout':
      return (
        <svg {...sharedProps}>
          <path d="M40 68V34" />
          <path d="M40 46C28 46 21 37 22 25C33 25 40 33 40 46Z" />
          <path d="M40 38C52 38 59 29 58 17C47 17 40 25 40 38Z" />
          <path d="M28 68H52" />
        </svg>
      );
    case 'sunbeam':
      return (
        <svg {...sharedProps}>
          <circle cx="48" cy="32" r="11" />
          <path d="M48 13V17M48 47V51M29 32H33M63 32H67M35 19L38 22M58 42L61 45M61 19L58 22M38 42L35 45" />
          <path d="M18 60C28 54 52 54 66 60" />
        </svg>
      );
    case 'horizon':
      return (
        <svg {...sharedProps}>
          <path d="M16 52H64" />
          <path d="M24 52C24 41 31 33 40 33C49 33 56 41 56 52" />
          <path d="M22 61H58" />
          <path d="M40 18V25M25 24L29 29M55 24L51 29" />
        </svg>
      );
    case 'waves':
      return (
        <svg {...sharedProps}>
          <path d="M14 34C22 27 30 27 38 34C46 41 54 41 66 34" />
          <path d="M14 46C22 39 30 39 38 46C46 53 54 53 66 46" />
          <path d="M18 58C26 52 34 52 42 58C48 62 56 62 62 58" />
        </svg>
      );
    case 'bloom':
      return (
        <svg {...sharedProps}>
          <circle cx="44" cy="34" r="5" />
          <path d="M44 29C40 19 48 19 44 29Z" />
          <path d="M49 34C59 30 59 38 49 34Z" />
          <path d="M44 39C48 49 40 49 44 39Z" />
          <path d="M39 34C29 38 29 30 39 34Z" />
          <path d="M44 39V66" />
          <path d="M44 55C52 54 56 49 55 44C49 45 45 49 44 55Z" />
        </svg>
      );
    case 'bridge':
      return (
        <svg {...sharedProps}>
          <path d="M16 54C24 34 56 34 64 54" />
          <path d="M24 54C30 42 50 42 56 54" />
          <path d="M14 54H66" />
          <path d="M28 43V54M40 39V54M52 43V54" />
        </svg>
      );
    case 'stars':
      return (
        <svg {...sharedProps}>
          <path d="M46 18L49 29L60 32L49 35L46 46L43 35L32 32L43 29L46 18Z" />
          <path d="M26 44L27.5 49L32 50.5L27.5 52L26 57L24.5 52L20 50.5L24.5 49L26 44Z" />
          <circle cx="58" cy="52" r="2" />
        </svg>
      );
    case 'compass':
      return (
        <svg {...sharedProps}>
          <circle cx="44" cy="38" r="19" />
          <path d="M44 24L49 38L44 52L39 38L44 24Z" />
          <path d="M30 38H39M49 38H58" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...sharedProps}>
          <path d="M51 22C42 24 36 32 38 42C40 50 48 56 57 55C48 61 36 59 29 50C22 41 24 28 33 21C39 17 45 17 51 22Z" />
          <path d="M58 26L59.5 30L63.5 31.5L59.5 33L58 37L56.5 33L52.5 31.5L56.5 30L58 26Z" />
        </svg>
      );
    case 'leaf':
    default:
      return (
        <svg {...sharedProps}>
          <path d="M24 58C26 37 40 22 60 20C58 40 45 55 24 58Z" />
          <path d="M20 62C31 50 43 37 56 24" />
          <path d="M36 46H48M43 38V29" />
        </svg>
      );
  }
};

const AffirmationsGallery: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [affirmedIds, setAffirmedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(getTodayKey());
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const activeItem = WELLNESS_AFFIRMATIONS[activeIndex];
  const isActiveAffirmed = affirmedIds.includes(activeItem.id);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const toggleAffirm = useCallback((id: string) => {
    setAffirmedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(getTodayKey(), JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
  }, []);

  const handleSpeak = useCallback(
    (item: CuratedAffirmationItem) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      if (speakingId === item.id) {
        setSpeakingId(null);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.rate = 0.92;
      utterance.pitch = 1.02;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(item.id);
      window.speechSynthesis.speak(utterance);
    },
    [speakingId]
  );

  const handleCopy = useCallback(async (item: CuratedAffirmationItem) => {
    let didCopy = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(item.text);
        didCopy = true;
      } else {
        throw new Error('Clipboard unavailable');
      }
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = item.text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        didCopy = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        didCopy = false;
      }
    }

    if (didCopy) {
      setCopiedId(item.id);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedId((current) => (current === item.id ? null : current));
        copyTimerRef.current = null;
      }, 1800);
    }
  }, []);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + WELLNESS_AFFIRMATIONS.length) % WELLNESS_AFFIRMATIONS.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % WELLNESS_AFFIRMATIONS.length);
  };

  const handleShuffle = () => {
    const candidates = WELLNESS_AFFIRMATIONS.map((_, idx) => idx).filter((idx) => idx !== activeIndex);
    const randomIndex = candidates[Math.floor(Math.random() * candidates.length)];
    setActiveIndex(randomIndex);
  };

  const progressPercent = Math.round((affirmedIds.length / WELLNESS_AFFIRMATIONS.length) * 100);

  return (
    <div className="space-y-8">
      {/* Spotlight Keepsake Frame */}
      <section aria-label="Featured affirmation">
        <div
          className={`relative rounded-3xl p-2 border bg-gradient-to-br transition-colors duration-300 ${activeItem.surfaceClass} ${activeItem.borderClass}`}
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/70 backdrop-blur-xs px-6 py-8 sm:px-10 sm:py-11">
            {/* Botanical corner artwork */}
            <BotanicalCornerMotif
              type={activeItem.motifType}
              color={activeItem.motifColor}
              className="pointer-events-none absolute -top-2 -right-2 w-28 h-28 opacity-20"
            />
            <BotanicalCornerMotif
              type={activeItem.motifType}
              color={activeItem.motifColor}
              className="pointer-events-none absolute -bottom-3 -left-3 w-24 h-24 opacity-15 rotate-180"
            />

            {/* Quiet unboxed metadata header */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-7">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className={`font-mono-num ${activeItem.accentTextClass}`}>
                  {activeItem.number} / {WELLNESS_AFFIRMATIONS.length}
                </span>
                <span className="text-[#9cc7c1]" aria-hidden="true">
                  ·
                </span>
                <span className={activeItem.accentTextClass}>{activeItem.theme}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#4b7476]">
                <span className="font-mono-num font-semibold text-[#0f3d3e]">
                  {affirmedIds.length} of {WELLNESS_AFFIRMATIONS.length}
                </span>
                <span>affirmed today</span>
              </div>
            </div>

            {/* Primary Affirmation Prose */}
            <div className="relative z-10 max-w-2xl mx-auto text-center py-3 sm:py-5">
              <div
                aria-hidden="true"
                className={`font-serif-elegant text-4xl leading-none select-none mb-2 opacity-40 ${activeItem.accentTextClass}`}
              >
                &ldquo;
              </div>
              <blockquote className="font-serif-elegant text-2xl sm:text-3xl font-bold text-[#0f3d3e] leading-snug text-balance">
                {activeItem.text}
              </blockquote>
              <div className="mt-6 flex items-center justify-center gap-3" aria-hidden="true">
                <span className="h-px w-10 bg-[#bfe5de]" />
                <span className="text-[11px] font-medium tracking-wide text-[#4b7476]">
                  Read slowly &middot; Breathe gently
                </span>
                <span className="h-px w-10 bg-[#bfe5de]" />
              </div>
            </div>

            {/* Interactive Keepsake Controls */}
            <div className="relative z-10 mt-8 pt-6 border-t border-[#e3f4f1] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous affirmation"
                  className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-white border border-[#cce7e3] text-[#0f3d3e] hover:bg-[#eaf6f4] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next affirmation"
                  className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-white border border-[#cce7e3] text-[#0f3d3e] hover:bg-[#eaf6f4] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
                >
                  <ChevronLeftIcon className="w-5 h-5 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={handleShuffle}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#cce7e3] text-xs font-semibold text-[#335c5d] hover:text-[#0f3d3e] hover:bg-[#eaf6f4] transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
                >
                  <RefreshIcon className="w-4 h-4" />
                  <span>Shuffle</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSpeak(activeItem)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-semibold transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                    speakingId === activeItem.id
                      ? 'bg-[#0f3d3e] text-white border-[#0f3d3e]'
                      : 'bg-white text-[#335c5d] border-[#cce7e3] hover:text-[#0f3d3e] hover:bg-[#eaf6f4]'
                  }`}
                >
                  <SpeakerWaveIcon className="w-4 h-4" />
                  <span>{speakingId === activeItem.id ? 'Stop Audio' : 'Listen'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(activeItem)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#cce7e3] text-xs font-semibold text-[#335c5d] hover:text-[#0f3d3e] hover:bg-[#eaf6f4] transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
                >
                  <ClipboardCopyIcon className="w-4 h-4" />
                  <span>{copiedId === activeItem.id ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleAffirm(activeItem.id)}
                  className={`min-h-[44px] px-5 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                    isActiveAffirmed
                      ? 'bg-[#0d9488] text-white border border-[#0d9488]'
                      : 'bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white hover:brightness-105'
                  }`}
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>{isActiveAffirmed ? 'Affirmed Today' : 'I Believe This'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Reflection Progress Strip */}
      <div className="px-1">
        <div className="flex items-center justify-between text-xs text-[#4b7476] mb-2">
          <span className="font-semibold text-[#0f3d3e]">Your 10 Mindful Truths</span>
          <span className="font-mono-num">{progressPercent}% practiced today</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#e6f4f1] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0d9488] to-[#0891b2] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Decorated 10-Card Keepsake Collection */}
      <section aria-label="All 10 student affirmations" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WELLNESS_AFFIRMATIONS.map((item, idx) => {
          const isSelected = idx === activeIndex;
          const isAffirmed = affirmedIds.includes(item.id);
          const isSpeaking = speakingId === item.id;
          const isCopied = copiedId === item.id;

          return (
            <article
              key={item.id}
              onClick={() => setActiveIndex(idx)}
              className={`group relative overflow-hidden rounded-2xl border p-5 sm:p-6 bg-gradient-to-br transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                item.surfaceClass
              } ${item.borderClass} ${
                isSelected
                  ? 'ring-2 ring-[#0d9488]/60 shadow-sm'
                  : 'hover:shadow-sm hover:-translate-y-0.5'
              }`}
            >
              {/* Delicate botanical corner watermark */}
              <BotanicalCornerMotif
                type={item.motifType}
                color={item.motifColor}
                className="pointer-events-none absolute -top-2 -right-2 w-24 h-24 opacity-20 transition-transform duration-300 group-hover:scale-105"
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className={`font-mono-num ${item.accentTextClass}`}>{item.number}.</span>
                    <span className={item.accentTextClass}>{item.theme}</span>
                  </div>
                  {isAffirmed && (
                    <span className="text-xs font-semibold text-[#0f766e] inline-flex items-center gap-1">
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Affirmed</span>
                    </span>
                  )}
                </div>

                <p className="font-serif-elegant text-lg sm:text-[19px] font-semibold text-[#0f3d3e] leading-relaxed pr-6">
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>

              <div
                className="relative z-10 mt-5 pt-3 border-t border-black/[0.06] flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => toggleAffirm(item.id)}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                    isAffirmed
                      ? 'bg-[#0d9488] text-white'
                      : 'bg-white/85 text-[#0f3d3e] border border-[#cce7e3] hover:bg-white'
                  }`}
                >
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>{isAffirmed ? 'Affirmed' : 'Affirm'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSpeak(item)}
                    aria-label={`Listen to affirmation ${item.number}`}
                    className={`min-w-[40px] min-h-[40px] px-2.5 rounded-lg border text-xs font-semibold transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                      isSpeaking
                        ? 'bg-[#0f3d3e] text-white border-[#0f3d3e]'
                        : 'bg-white/85 text-[#335c5d] border-[#cce7e3] hover:text-[#0f3d3e] hover:bg-white'
                    }`}
                  >
                    <SpeakerWaveIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(item)}
                    aria-label={`Copy affirmation ${item.number}`}
                    className="min-w-[40px] min-h-[40px] px-2.5 rounded-lg bg-white/85 border border-[#cce7e3] text-xs font-semibold text-[#335c5d] hover:text-[#0f3d3e] hover:bg-white transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
                  >
                    {isCopied ? (
                      <CheckIcon className="w-4 h-4 text-[#0d9488]" />
                    ) : (
                      <ClipboardCopyIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};

export default AffirmationsGallery;
