import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import {
  BookOpenIcon,
  HeartPulseIcon,
  LeafIcon,
  MusicIcon,
  SparklesIcon,
  BellIcon,
  CameraIcon,
  WindIcon,
} from '../icons';
import DailyAffirmationWidget from './DailyAffirmationWidget';
import WeeklyGoalsCard from './WeeklyGoalsCard';
import DeepBreathingGuide from './DeepBreathingGuide';
import LiteratureClockCard from '../common/LiteratureClockCard';
import MoodCalendar from './MoodCalendar';

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
  onLogout: () => void;
}

type ToolTone = 'indigo' | 'sky' | 'emerald' | 'amber' | 'violet' | 'rose';

const TOOL_TONE_CLASSES: Record<
  ToolTone,
  { card: string; icon: string }
> = {
  indigo: {
    card: 'bg-gradient-to-br from-white to-[#f5f7ff] border-[#d9e0ff] hover:border-[#818cf8]',
    icon: 'bg-[#e0e7ff] text-[#4f46e5]',
  },
  sky: {
    card: 'bg-gradient-to-br from-white to-[#eff9ff] border-[#bae6fd] hover:border-[#38bdf8]',
    icon: 'bg-[#e0f2fe] text-[#0284c7]',
  },
  emerald: {
    card: 'bg-gradient-to-br from-white to-[#eefcf5] border-[#a7f3d0] hover:border-[#34d399]',
    icon: 'bg-[#d1fae5] text-[#059669]',
  },
  amber: {
    card: 'bg-gradient-to-br from-white to-[#fff7ed] border-[#fed7aa] hover:border-[#fb923c]',
    icon: 'bg-[#ffedd5] text-[#c2410c]',
  },
  violet: {
    card: 'bg-gradient-to-br from-white to-[#f9f5ff] border-[#e9d5ff] hover:border-[#a855f7]',
    icon: 'bg-[#f3e8ff] text-[#7c3aed]',
  },
  rose: {
    card: 'bg-gradient-to-br from-white to-[#fff2f5] border-[#fecdd3] hover:border-[#fb7185]',
    icon: 'bg-[#ffe4e6] text-[#e11d48]',
  },
};

const StudentDashboard: React.FC<StudentDashboardProps> = ({ name, onNavigate, onLogout }) => {
  const [parentNudge, setParentNudge] = useState<string | null>(null);
  const [latestStressScore, setLatestStressScore] = useState<number | null>(null);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [goalsRefreshKey, setGoalsRefreshKey] = useState(0);

  const syncDashboardSignals = () => {
    const nudge = localStorage.getItem('parent_nudge_message');
    if (nudge && nudge.trim()) setParentNudge(nudge);

    const rawStress = localStorage.getItem('mindguard_latest_stress_score');
    if (rawStress !== null) {
      const parsed = Number(rawStress);
      if (Number.isFinite(parsed)) {
        setLatestStressScore(Math.max(0, Math.min(100, Math.round(parsed))));
      }
    }
  };

  useEffect(() => {
    syncDashboardSignals();
    window.addEventListener('focus', syncDashboardSignals);
    return () => window.removeEventListener('focus', syncDashboardSignals);
  }, []);

  const ToolCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    tone: ToolTone;
  }> = ({ title, description, icon, onClick, tone }) => {
    const palette = TOOL_TONE_CLASSES[tone];
    return (
      <Card
        onClick={onClick}
        className={`flex items-start space-x-4 p-4 sm:p-5 border h-full ${palette.card}`}
      >
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${palette.icon}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-base text-[#0f3d3e] leading-snug">{title}</h3>
          <p className="text-xs sm:text-sm text-[#4b7476] mt-1 leading-relaxed">{description}</p>
        </div>
      </Card>
    );
  };

  return (
    <div className="bg-gradient-to-b from-[#eefaf7] via-[#f4fbff] to-[#fff8f4] h-full overflow-y-auto">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Clean Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-[#c9ebe4]">
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
                  localStorage.removeItem('parent_nudge_message');
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
          {/* Left Column: Daily Affirmation + Weekly Wellness Goals Progress */}
          <div className="lg:col-span-5 space-y-5">
            <DailyAffirmationWidget
              studentName={name}
              onNavigateToJournal={() => onNavigate('journal')}
              onNavigateToWellness={() => onNavigate('wellness')}
            />
            <LiteratureClockCard />
            <WeeklyGoalsCard
              key={goalsRefreshKey}
              onManageGoals={() => onNavigate('goals')}
              onOpenStickers={() => onNavigate('stickers')}
            />
          </div>

          {/* Right Column: Primary Check-In Focal Card + Wellness Toolkit */}
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

            {/* Instant Animated Deep Breathing Relief Strip */}
            <div className="rounded-2xl bg-gradient-to-r from-[#f0fdf9] via-[#eff9ff] to-[#eef2ff] border border-[#99e2d8] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#99f6e4] to-[#bae6fd] text-[#0f766e] flex items-center justify-center shrink-0">
                  <WindIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0f3d3e]">
                    Need instant calm right now?
                  </p>
                  <p className="text-xs text-[#4b7476] leading-snug">
                    Launch the animated Deep Breathing guide without leaving your dashboard.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBreathingOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#e6faf6] border border-[#8cd3ca] text-[#0f766e] text-xs font-bold transition-colors whitespace-nowrap min-h-[44px]"
              >
                Open Breathing Guide
              </button>
            </div>

            {/* Secondary Tools Grid */}
            <div>
              <h2 className="text-sm font-semibold text-[#335c5d] mb-3 px-0.5">
                Daily Wellness Toolkit
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <ToolCard
                  title="AI Wellness Mentor"
                  description="Chat with Mindy for encouragement and calm study tips."
                  icon={<SparklesIcon className="w-5 h-5" />}
                  onClick={() => onNavigate('mentor')}
                  tone="indigo"
                />
                <ToolCard
                  title="Stress & Anxiety Quizzes"
                  description="Take the 16-item UC Berkeley quiz or PSS-10."
                  icon={<HeartPulseIcon className="w-5 h-5" />}
                  onClick={() => onNavigate('mood-tracker')}
                  tone="sky"
                />
                <ToolCard
                  title="Wellness Activities"
                  description="Guided breathing, yoga flows, and meditation."
                  icon={<LeafIcon className="w-5 h-5" />}
                  onClick={() => onNavigate('wellness')}
                  tone="emerald"
                />
                <ToolCard
                  title="Private Journal"
                  description="PIN-locked space for your personal reflections."
                  icon={<BookOpenIcon className="w-5 h-5" />}
                  onClick={() => onNavigate('journal')}
                  tone="amber"
                />
                <ToolCard
                  title="Reminders & Settings"
                  description="Set your daily check-in push notification time & alerts."
                  icon={<BellIcon className="w-5 h-5" />}
                  onClick={() => onNavigate('reminders')}
                  tone="violet"
                />
                <ToolCard
                  title="Mood Music"
                  description="Ambient tracks for focus, rest, and calm."
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