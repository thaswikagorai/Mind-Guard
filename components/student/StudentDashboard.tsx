import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpenIcon,
  HeartPulseIcon,
  LeafIcon,
  MusicIcon,
  SparklesIcon,
  BellIcon,
  CameraIcon,
  WindIcon,
  ClockIcon,
  CheckIcon,
} from '../icons';
import DailyAffirmationWidget from './DailyAffirmationWidget';
import WeeklyGoalsCard from './WeeklyGoalsCard';
import DeepBreathingGuide from './DeepBreathingGuide';
import LiteratureClockCard from '../common/LiteratureClockCard';
import MoodCalendar from './MoodCalendar';
import { CalendarMoodKey } from '../../types';
import {
  CALENDAR_MOOD_META,
  MOOD_UPDATED_EVENT,
  ORDERED_CALENDAR_MOODS,
  getMonthMoodMap,
  logCalendarMood,
  toLocalDateKey,
} from '../../services/moodCalendarService';
import { GOALS_UPDATED_EVENT } from '../../services/weeklyGoalsData';
import {
  REMINDERS_UPDATED_EVENT,
  getNextScheduledNudgeLabel,
  loadCheckInNotificationSettings,
} from '../../services/checkInNotificationService';
import { WellnessActivityType } from './WellnessActivities';

interface StudentDashboardProps {
  name: string;
  onNavigate: (
    view:
      | 'mood-tracker'
      | 'stress-checkin'
      | 'wellness'
      | 'journal'
      | 'music'
      | 'mentor'
      | 'reminders'
      | 'goals'
      | 'stickers'
  ) => void;
  onLaunchWellnessActivity: (activity: WellnessActivityType) => void;
  onLogout: () => void;
}

type ToolTone = 'indigo' | 'sky' | 'emerald' | 'amber' | 'violet' | 'rose';

const TOOL_TONE_CLASSES: Record<
  ToolTone,
  { card: string; icon: string; status: string }
> = {
  indigo: {
    card: 'bg-gradient-to-br from-white to-[#f5f7ff] border-[#d9e0ff] hover:border-[#818cf8]',
    icon: 'bg-[#e0e7ff] text-[#4f46e5]',
    status: 'text-[#4338ca]',
  },
  sky: {
    card: 'bg-gradient-to-br from-white to-[#eff9ff] border-[#bae6fd] hover:border-[#38bdf8]',
    icon: 'bg-[#e0f2fe] text-[#0284c7]',
    status: 'text-[#0369a1]',
  },
  emerald: {
    card: 'bg-gradient-to-br from-white to-[#eefcf5] border-[#a7f3d0] hover:border-[#34d399]',
    icon: 'bg-[#d1fae5] text-[#059669]',
    status: 'text-[#047857]',
  },
  amber: {
    card: 'bg-gradient-to-br from-white to-[#fff7ed] border-[#fed7aa] hover:border-[#fb923c]',
    icon: 'bg-[#ffedd5] text-[#c2410c]',
    status: 'text-[#9a3412]',
  },
  violet: {
    card: 'bg-gradient-to-br from-white to-[#f9f5ff] border-[#e9d5ff] hover:border-[#a855f7]',
    icon: 'bg-[#f3e8ff] text-[#7c3aed]',
    status: 'text-[#6d28d9]',
  },
  rose: {
    card: 'bg-gradient-to-br from-white to-[#fff2f5] border-[#fecdd3] hover:border-[#fb7185]',
    icon: 'bg-[#ffe4e6] text-[#e11d48]',
    status: 'text-[#be123c]',
  },
};

const QUICK_WELLNESS_SHORTCUTS: Array<{
  id: WellnessActivityType;
  label: string;
  sublabel: string;
  emoji: string;
  surface: string;
}> = [
  {
    id: 'breathing',
    label: 'Breathing',
    sublabel: '4-7-8 & Box',
    emoji: '🌬️',
    surface: 'bg-[#eefaf7] hover:bg-[#daf5ef] border-[#99e2d8]',
  },
  {
    id: 'yoga',
    label: '10 Yoga Poses',
    sublabel: 'Beginner flow',
    emoji: '🧘',
    surface: 'bg-[#ecfdf5] hover:bg-[#d1fae5] border-[#a7f3d0]',
  },
  {
    id: 'meditation',
    label: '6-Min Meditation',
    sublabel: 'Timed breath',
    emoji: '🧠',
    surface: 'bg-[#eef2ff] hover:bg-[#e0e7ff] border-[#c7d2fe]',
  },
  {
    id: 'affirmations',
    label: '10 Affirmations',
    sublabel: 'Growth mindset',
    emoji: '✨',
    surface: 'bg-[#fff7ed] hover:bg-[#ffedd5] border-[#fed7aa]',
  },
];

const StudentDashboard: React.FC<StudentDashboardProps> = ({
  name,
  onNavigate,
  onLaunchWellnessActivity,
  onLogout,
}) => {
  const [parentNudge, setParentNudge] = useState<string | null>(null);
  const [latestStressScore, setLatestStressScore] = useState<number | null>(null);
  const [todayMood, setTodayMood] = useState<CalendarMoodKey | null>(null);
  const [journalCount, setJournalCount] = useState<number>(0);
  const [nextNudgeLabel, setNextNudgeLabel] = useState<string>('Paused');
  const [activeReminderCount, setActiveReminderCount] = useState<number>(0);

  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [goalsRefreshKey, setGoalsRefreshKey] = useState(0);

  // Interactive 2-Minute Screen & Eye Reset Micro-Timer
  const [breakSecondsLeft, setBreakSecondsLeft] = useState<number | null>(null);
  const [breakFinished, setBreakFinished] = useState(false);

  const syncDashboardSignals = useCallback(() => {
    try {
      const nudge = localStorage.getItem('parent_nudge_message');
      setParentNudge(nudge && nudge.trim() ? nudge.trim() : null);

      const rawStress = localStorage.getItem('mindguard_latest_stress_score');
      if (rawStress !== null && rawStress.trim() !== '') {
        const parsed = Number(rawStress);
        setLatestStressScore(
          Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : null
        );
      } else {
        setLatestStressScore(null);
      }

      const now = new Date();
      const todayKey = toLocalDateKey(now);
      const monthMap = getMonthMoodMap(now.getFullYear(), now.getMonth());
      setTodayMood(monthMap[todayKey]?.primaryMood ?? null);

      const rawJournal = localStorage.getItem('mindguard_journal_entries');
      if (rawJournal) {
        const parsedJournal = JSON.parse(rawJournal);
        setJournalCount(Array.isArray(parsedJournal) ? parsedJournal.length : 0);
      } else {
        setJournalCount(0);
      }

      const notifSettings = loadCheckInNotificationSettings();
      setNextNudgeLabel(getNextScheduledNudgeLabel(notifSettings, now));

      const rawReminders = localStorage.getItem('mindguard_reminders');
      if (rawReminders) {
        const parsedReminders = JSON.parse(rawReminders);
        if (Array.isArray(parsedReminders)) {
          setActiveReminderCount(parsedReminders.filter((r) => r && r.enabled).length);
        } else {
          setActiveReminderCount(0);
        }
      } else {
        setActiveReminderCount(0);
      }
    } catch {
      // keep safe state on corrupted storage values
    }
  }, []);

  useEffect(() => {
    syncDashboardSignals();
    const handleGoalsSync = () => setGoalsRefreshKey((k) => k + 1);

    window.addEventListener('focus', syncDashboardSignals);
    window.addEventListener('storage', syncDashboardSignals);
    window.addEventListener(MOOD_UPDATED_EVENT, syncDashboardSignals);
    window.addEventListener(REMINDERS_UPDATED_EVENT, syncDashboardSignals);
    window.addEventListener(GOALS_UPDATED_EVENT, handleGoalsSync);

    return () => {
      window.removeEventListener('focus', syncDashboardSignals);
      window.removeEventListener('storage', syncDashboardSignals);
      window.removeEventListener(MOOD_UPDATED_EVENT, syncDashboardSignals);
      window.removeEventListener(REMINDERS_UPDATED_EVENT, syncDashboardSignals);
      window.removeEventListener(GOALS_UPDATED_EVENT, handleGoalsSync);
    };
  }, [syncDashboardSignals]);

  // 2-Minute Screen & Eye Reset countdown timer
  useEffect(() => {
    if (breakSecondsLeft === null) return;
    if (breakSecondsLeft <= 0) {
      setBreakSecondsLeft(null);
      setBreakFinished(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setBreakSecondsLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [breakSecondsLeft]);

  const handleQuickMoodSelect = (moodKey: CalendarMoodKey) => {
    const todayKey = toLocalDateKey(new Date());
    logCalendarMood(todayKey, moodKey, { source: 'calendar' });
    setTodayMood(moodKey);
  };

  const getAdaptiveSuggestion = (): {
    headline: string;
    ctaLabel: string;
    action: () => void;
  } => {
    if (todayMood === 'stressed' || (latestStressScore !== null && latestStressScore >= 60)) {
      return {
        headline: 'A 6-minute breathing meditation or 4-6 breath helps lower overwhelm fast.',
        ctaLabel: 'Start 6-Min Meditation →',
        action: () => onLaunchWellnessActivity('meditation'),
      };
    }
    if (todayMood === 'tired') {
      return {
        headline: 'Unwind stiff shoulders and eyes with beginner yoga or rain soundscapes.',
        ctaLabel: 'Try 10 Yoga Poses →',
        action: () => onLaunchWellnessActivity('yoga'),
      };
    }
    if (todayMood === 'calm') {
      return {
        headline: 'Keep this steady groove with a focus soundscape or positive truths.',
        ctaLabel: 'Open Focus Music →',
        action: () => onNavigate('music'),
      };
    }
    if (todayMood === 'happy') {
      return {
        headline: 'Capture what went well today or nudge a weekly habit forward.',
        ctaLabel: 'Write in Journal →',
        action: () => onNavigate('journal'),
      };
    }
    return {
      headline: 'Tap a mood above or take a 30-second camera check-in for tailored guidance.',
      ctaLabel: 'Quick Check-In →',
      action: () => onNavigate('stress-checkin'),
    };
  };

  const adaptiveSuggestion = getAdaptiveSuggestion();
  const formattedBreakTime =
    breakSecondsLeft !== null
      ? `${Math.floor(breakSecondsLeft / 60)}:${String(breakSecondsLeft % 60).padStart(2, '0')}`
      : null;

  const ToolCard: React.FC<{
    title: string;
    description: string;
    statusText: string;
    icon: React.ReactNode;
    onClick: () => void;
    tone: ToolTone;
  }> = ({ title, description, statusText, icon, onClick, tone }) => {
    const palette = TOOL_TONE_CLASSES[tone];
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left rounded-2xl flex items-start space-x-4 p-4 sm:p-5 border h-full transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${palette.card}`}
      >
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${palette.icon}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
          <div>
            <h3 className="font-bold text-base text-[#0f3d3e] leading-snug">{title}</h3>
            <p className="text-xs sm:text-sm text-[#4b7476] mt-1 leading-relaxed">{description}</p>
          </div>
          <p className={`text-[11px] font-semibold font-mono-num mt-2.5 truncate ${palette.status}`}>
            {statusText}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="bg-gradient-to-b from-[#eefaf7] via-[#f4fbff] to-[#fff8f4] h-full overflow-y-auto">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Clean Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-[#c9ebe4]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0f3d3e] font-serif-elegant text-balance">
              Hello, {name || 'Student'}
            </h1>
            <p className="text-sm text-[#0f766e] font-medium mt-0.5">
              Ready to take a gentle moment for yourself?
            </p>
          </div>
          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsBreathingOpen(true)}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#0f766e] hover:text-[#0f3d3e] px-3.5 py-2 rounded-xl border border-[#8cd3ca] bg-[#e6faf6] hover:bg-[#ccf7ef] transition-colors whitespace-nowrap min-h-[44px]"
            >
              <WindIcon className="w-4 h-4 text-[#0d9488]" />
              <span>Deep Breath</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-semibold text-[#335c5d] hover:text-[#0f3d3e] px-3.5 py-2 rounded-xl border border-[#bde6de] bg-white hover:bg-[#e3f7f3] transition-colors whitespace-nowrap min-h-[44px]"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Interactive Today's Mood Pulse & Adaptive Suggestion Bar */}
        <section
          aria-label="Today's mood pulse"
          className="mb-6 rounded-2xl bg-white border border-[#bde6de] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-[#0f3d3e]">How are you feeling right now?</span>
              <span className="text-[#8ab5b6]" aria-hidden="true">·</span>
              {todayMood ? (
                <span className={`font-semibold ${CALENDAR_MOOD_META[todayMood].textAccentClass}`}>
                  Today&apos;s pulse: {CALENDAR_MOOD_META[todayMood].label}{' '}
                  {CALENDAR_MOOD_META[todayMood].emoji}
                </span>
              ) : (
                <span className="text-[#4b7476]">1-tap updates your Mood Calendar below</span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2" role="group" aria-label="Log current mood">
              {ORDERED_CALENDAR_MOODS.map((moodKey) => {
                const meta = CALENDAR_MOOD_META[moodKey];
                const isActive = todayMood === moodKey;
                return (
                  <button
                    key={moodKey}
                    type="button"
                    onClick={() => handleQuickMoodSelect(moodKey)}
                    aria-pressed={isActive}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center space-x-1.5 min-h-[44px] ${
                      isActive
                        ? `${meta.cellClass} shadow-xs`
                        : 'bg-[#f4fbfa] border-[#cce7e3] text-[#335c5d] hover:bg-[#e6faf6] hover:border-[#8cd3ca]'
                    }`}
                  >
                    <span aria-hidden="true">{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:max-w-xs w-full pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#e2f2ef] lg:pl-5 flex flex-col justify-between gap-2">
            <p className="text-xs text-[#335c5d] leading-snug">{adaptiveSuggestion.headline}</p>
            <button
              type="button"
              onClick={adaptiveSuggestion.action}
              className="self-start text-xs font-bold text-[#0f766e] hover:text-[#0f3d3e] underline underline-offset-4 py-1 transition-colors"
            >
              {adaptiveSuggestion.ctaLabel}
            </button>
          </div>
        </section>

        {/* High-Stress Gentle Relief Callout when latest stress check or quiz was elevated */}
        {latestStressScore !== null && latestStressScore >= 60 && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#fff7ed] via-[#fff2ea] to-[#eefaf7] border border-[#fdba74] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3.5">
            <div className="flex items-start space-x-3.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-[#ffedd5] border border-[#fdba74] text-[#c2410c] flex items-center justify-center shrink-0">
                <WindIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#c2410c] uppercase tracking-wide">
                  Recent Stress Elevated · {latestStressScore}/100
                </p>
                <p className="text-sm font-medium text-[#0f3d3e] mt-0.5 leading-snug">
                  Feeling overwhelmed right now? A slow 4-second inhale &amp; 6-second exhale helps calm racing thoughts.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsBreathingOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0d9488] to-[#0891b2] hover:brightness-105 text-white text-xs font-semibold transition-all whitespace-nowrap min-h-[44px] shadow-xs"
            >
              Start Deep Breathing →
            </button>
          </div>
        )}

        {/* Note from Home */}
        {parentNudge && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-[#fff1e6] to-[#ffe8ec] border border-[#fcd5be] rounded-2xl p-4 sm:p-5 flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#fcd5be] flex items-center justify-center text-lg shrink-0">
                🧡
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-xs font-semibold text-[#c2410c] mb-0.5">Note from Home</p>
                <p className="text-[#0f3d3e] text-sm italic leading-relaxed">"{parentNudge}"</p>
              </div>
              <button
                type="button"
                aria-label="Dismiss note"
                onClick={() => {
                  try {
                    localStorage.removeItem('parent_nudge_message');
                  } catch {
                    // ignore
                  }
                  setParentNudge(null);
                }}
                className="min-w-[44px] min-h-[44px] -my-2 -mr-2 flex items-center justify-center rounded-xl text-[#9a3412] hover:text-[#0f3d3e] hover:bg-white/70 transition-colors text-lg"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Responsive Two-Column Layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-8">
          {/* Left Column: Daily Affirmation + Literature Clock + Weekly Wellness Goals */}
          <div className="lg:col-span-5 space-y-5">
            <DailyAffirmationWidget
              studentName={name}
              onNavigateToJournal={() => onNavigate('journal')}
              onNavigateToWellness={() => onLaunchWellnessActivity('affirmations')}
            />
            <LiteratureClockCard />
            <WeeklyGoalsCard
              key={goalsRefreshKey}
              onManageGoals={() => onNavigate('goals')}
              onOpenStickers={() => onNavigate('stickers')}
            />
          </div>

          {/* Right Column: Primary Check-In Focal Card + Instant Calm Launcher + Toolkit + Mood Calendar */}
          <div className="lg:col-span-7 space-y-5">
            {/* Primary Focal Anchor CTA */}
            <button
              type="button"
              onClick={() => onNavigate('stress-checkin')}
              className="w-full text-left rounded-2xl bg-gradient-to-br from-[#0d9488] via-[#14b8a6] to-[#0891b2] text-white p-5 sm:p-6 shadow-[0_14px_30px_-14px_rgba(13,148,136,0.55)] transition-all duration-200 hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d3e] focus-visible:ring-offset-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-[#ccf7ef]">
                    Instant Snapshot Check
                    {latestStressScore !== null ? ` · Latest score ${latestStressScore}/100` : ''}
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold font-serif-elegant leading-snug text-balance">
                    Quick Stress Check-In
                  </h2>
                  <p className="text-xs sm:text-sm text-[#ebfffb] leading-relaxed max-w-md">
                    Use one private camera frame to observe visible emotions, shoulder posture, and facial tension cues.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                  <CameraIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 inline-flex items-center space-x-2 text-xs font-semibold bg-white text-[#0f766e] px-3.5 py-2 rounded-xl shadow-xs">
                <span>Start Check-In</span>
                <span aria-hidden="true">→</span>
              </div>
            </button>

            {/* Instant Animated Deep Breathing + Direct Practice Shortcuts + 2-Min Screen Break */}
            <div className="rounded-2xl bg-gradient-to-r from-[#f0fdf9] via-[#eff9ff] to-[#eef2ff] border border-[#99e2d8] p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#99f6e4] to-[#bae6fd] text-[#0f766e] flex items-center justify-center shrink-0">
                    <WindIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0f3d3e]">
                      Need instant calm right now?
                    </p>
                    <p className="text-xs text-[#4b7476] leading-snug">
                      {formattedBreakTime
                        ? `Look 20 ft away & relax your shoulders · ${formattedBreakTime} left`
                        : breakFinished
                        ? '2-minute eye & shoulder reset complete!'
                        : 'Launch guided breathing or jump straight into a mindful practice.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (breakSecondsLeft !== null) {
                        setBreakSecondsLeft(null);
                      } else {
                        setBreakFinished(false);
                        setBreakSecondsLeft(120);
                      }
                    }}
                    className={`inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap min-h-[44px] ${
                      breakSecondsLeft !== null
                        ? 'bg-[#0f3d3e] border-[#0f3d3e] text-white'
                        : breakFinished
                        ? 'bg-[#d1fae5] border-[#34d399] text-[#065f46]'
                        : 'bg-white hover:bg-[#e6faf6] border-[#cce7e3] text-[#335c5d]'
                    }`}
                  >
                    {breakFinished ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <ClockIcon className="w-4 h-4" />
                    )}
                    <span className="font-mono-num">
                      {formattedBreakTime ? `Reset ${formattedBreakTime}` : '2m Eye Break'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBreathingOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#e6faf6] border border-[#8cd3ca] text-[#0f766e] text-xs font-bold transition-colors whitespace-nowrap min-h-[44px]"
                  >
                    Open Breathing Guide
                  </button>
                </div>
              </div>

              {/* 1-Tap Shortcuts directly into each Wellness Practice */}
              <div className="pt-3 border-t border-[#cce7e3]/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUICK_WELLNESS_SHORTCUTS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onLaunchWellnessActivity(item.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all min-h-[48px] flex items-center space-x-2.5 ${item.surface}`}
                  >
                    <span className="text-lg shrink-0" aria-hidden="true">
                      {item.emoji}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0f3d3e] truncate">{item.label}</p>
                      <p className="text-[11px] text-[#4b7476] truncate">{item.sublabel}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Secondary Tools Grid with Live Status Readouts */}
            <div>
              <h2 className="text-sm font-semibold text-[#335c5d] mb-3 px-0.5">
                Daily Wellness Toolkit
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <ToolCard
                  title="AI Wellness Mentor"
                  description="Chat with Mindy for encouragement and calm study tips."
                  statusText={`Ready for ${name || 'you'} · Streaming support`}
                  icon={<SparklesIcon className="w-5 h-5" />}
                  onClick={() => onNavigate('mentor')}
                  tone="indigo"
                />
                <ToolCard
                  title="Stress & Anxiety Quizzes"
                  description="Take the 16-item UC Berkeley quiz or PSS-10."
                  statusText={
                    latestStressScore !== null
                      ? `Latest score: ${latestStressScore}/100`
                      : 'Berkeley DASS-21 & PSS-10'
                  }
                  icon={<HeartPulseIcon className="w-5 h-5" />}
                  onClick={() => onNavigate('mood-tracker')}
                  tone="sky"
                />
                <ToolCard
                  title="Wellness Activities"
                  description="Guided breathing, 10 yoga poses, 6-min meditation & truths."
                  statusText="4 interactive practices ready"
                  icon={<LeafIcon className="w-5 h-5" />}
                  onClick={() => onNavigate('wellness')}
                  tone="emerald"
                />
                <ToolCard
                  title="Private Journal"
                  description="PIN-locked space for your personal reflections."
                  statusText={
                    journalCount > 0
                      ? `${journalCount} ${journalCount === 1 ? 'entry' : 'entries'} saved`
                      : 'PIN-protected · Start writing'
                  }
                  icon={<BookOpenIcon className="w-5 h-5" />}
                  onClick={() => onNavigate('journal')}
                  tone="amber"
                />
                <ToolCard
                  title="Reminders & Settings"
                  description="Set your daily check-in push notification time & alerts."
                  statusText={
                    nextNudgeLabel === 'Paused'
                      ? `${activeReminderCount} custom ${
                          activeReminderCount === 1 ? 'alert' : 'alerts'
                        } active`
                      : `Next push: ${nextNudgeLabel}`
                  }
                  icon={<BellIcon className="w-5 h-5" />}
                  onClick={() => onNavigate('reminders')}
                  tone="violet"
                />
                <ToolCard
                  title="Mood Music"
                  description="In-app ambient soundscapes with sleep timer."
                  statusText="Relax · Focus · Sleep · Happy"
                  icon={<MusicIcon className="w-5 h-5" />}
                  onClick={() => onNavigate('music')}
                  tone="rose"
                />
              </div>
            </div>

            {/* Current-Month Mood Calendar */}
            <MoodCalendar />
          </div>
        </div>
      </div>

      {/* Interactive Deep Breathing Modal Overlay */}
      <DeepBreathingGuide
        isOpen={isBreathingOpen}
        onClose={() => setIsBreathingOpen(false)}
        initialStressScore={latestStressScore}
        onPracticeLogged={() => setGoalsRefreshKey((k) => k + 1)}
      />
    </div>
  );
};

export default StudentDashboard;