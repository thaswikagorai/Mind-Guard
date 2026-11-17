import React, { useState, useCallback, useEffect, useRef } from 'react';
import Card from '../common/Card';
import AffirmationsGallery from './AffirmationsGallery';
import SixMinuteMeditation from './SixMinuteMeditation';
import BeginnerYogaStudio from './BeginnerYogaStudio';
import { ChevronLeftIcon, ClockIcon, CheckIcon } from '../icons';
import { loadWeeklyGoals, saveWeeklyGoals } from '../../services/weeklyGoalsData';
import { evaluateAndUnlockStickers } from '../../services/mindfulnessStickersData';

export type WellnessActivityType = 'breathing' | 'yoga' | 'meditation' | 'affirmations';

interface WellnessActivitiesProps {
  onBack: () => void;
  initialActivity?: WellnessActivityType | null;
}

type ActivityType = WellnessActivityType;

interface BreathingPattern {
  name: string;
  inhale: number;
  hold1?: number;
  exhale: number;
  hold2?: number;
  description: string;
}

const BREATHING_PATTERNS: BreathingPattern[] = [
  { name: 'Pursed Lip', inhale: 2, exhale: 4, description: 'Best for shortness of breath' },
  { name: 'Box Breathing', inhale: 4, hold1: 4, exhale: 4, hold2: 4, description: 'Calm and focus' },
  { name: '4-7-8 Technique', inhale: 4, hold1: 7, exhale: 8, description: 'Fall asleep faster' },
  { name: 'Deep Calm', inhale: 5, exhale: 5, description: 'Slow, steady relaxation' },
];

const SESSION_DURATIONS = [
  { label: '5m', value: 5 * 60 },
  { label: '10m', value: 10 * 60 },
  { label: '15m', value: 15 * 60 },
];

type ActivityTone = 'teal' | 'emerald' | 'indigo' | 'amber';

const ACTIVITY_TONES: Record<ActivityTone, { card: string; icon: string }> = {
  teal: {
    card: 'bg-gradient-to-br from-white to-[#e6faf6] border-[#99e2d8] hover:border-[#0d9488]',
    icon: 'bg-[#ccf7ef]',
  },
  emerald: {
    card: 'bg-gradient-to-br from-white to-[#ecfdf5] border-[#a7f3d0] hover:border-[#059669]',
    icon: 'bg-[#d1fae5]',
  },
  indigo: {
    card: 'bg-gradient-to-br from-white to-[#eef2ff] border-[#c7d2fe] hover:border-[#4f46e5]',
    icon: 'bg-[#e0e7ff]',
  },
  amber: {
    card: 'bg-gradient-to-br from-white to-[#fff7ed] border-[#fed7aa] hover:border-[#ea580c]',
    icon: 'bg-[#ffedd5]',
  },
};

const ActivityButton: React.FC<{
  label: string;
  subtitle: string;
  onClick: () => void;
  emoji: string;
  tone: ActivityTone;
}> = ({ label, subtitle, onClick, emoji, tone }) => {
  const palette = ACTIVITY_TONES[tone];
  return (
    <Card
      onClick={onClick}
      className={`flex flex-col items-start text-left p-5 sm:p-6 border rounded-2xl group ${palette.card}`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-transform duration-200 group-hover:scale-105 ${palette.icon}`}
      >
        {emoji}
      </div>
      <h3 className="font-bold text-lg text-[#0f3d3e] font-serif-elegant">{label}</h3>
      <p className="text-xs text-[#4b7476] mt-1">{subtitle}</p>
    </Card>
  );
};

const BreathingGuide: React.FC = () => {
  const [activePattern, setActivePattern] = useState<BreathingPattern>(BREATHING_PATTERNS[0]);
  const [phase, setPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [counter, setCounter] = useState<number>(BREATHING_PATTERNS[0].inhale);
  const [isRunning, setIsRunning] = useState(false);

  const [sessionDuration, setSessionDuration] = useState(SESSION_DURATIONS[0].value);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(SESSION_DURATIONS[0].value);
  const [secondsPracticed, setSecondsPracticed] = useState(0);
  const [loggedNote, setLoggedNote] = useState<string | null>(null);

  const phaseRef = useRef<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const counterRef = useRef<number>(BREATHING_PATTERNS[0].inhale);
  const sessionRemainingRef = useRef<number>(SESSION_DURATIONS[0].value);

  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stopBreathing = useCallback(
    (patternToReset: BreathingPattern = activePattern, durationToReset: number = sessionDuration) => {
      setIsRunning(false);
      phaseRef.current = 'inhale';
      counterRef.current = patternToReset.inhale;
      sessionRemainingRef.current = durationToReset;
      setPhase('inhale');
      setCounter(patternToReset.inhale);
      setSessionTimeRemaining(durationToReset);
    },
    [activePattern, sessionDuration]
  );

  const startBreathing = useCallback(() => {
    setLoggedNote(null);
    setSecondsPracticed(0);
    phaseRef.current = 'inhale';
    counterRef.current = activePattern.inhale;
    sessionRemainingRef.current = sessionDuration;
    setPhase('inhale');
    setCounter(activePattern.inhale);
    setSessionTimeRemaining(sessionDuration);
    setIsRunning(true);
  }, [activePattern, sessionDuration]);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = window.setInterval(() => {
      setSecondsPracticed((prev) => prev + 1);

      if (sessionRemainingRef.current <= 1) {
        stopBreathing(activePattern, sessionDuration);
        return;
      }

      sessionRemainingRef.current -= 1;
      setSessionTimeRemaining(sessionRemainingRef.current);

      if (counterRef.current > 1) {
        counterRef.current -= 1;
        setCounter(counterRef.current);
        return;
      }

      let nextPhase: 'inhale' | 'hold1' | 'exhale' | 'hold2' = 'inhale';
      let nextCount = activePattern.inhale;

      if (phaseRef.current === 'inhale') {
        if (activePattern.hold1 && activePattern.hold1 > 0) {
          nextPhase = 'hold1';
          nextCount = activePattern.hold1;
        } else {
          nextPhase = 'exhale';
          nextCount = activePattern.exhale;
        }
      } else if (phaseRef.current === 'hold1') {
        nextPhase = 'exhale';
        nextCount = activePattern.exhale;
      } else if (phaseRef.current === 'exhale') {
        if (activePattern.hold2 && activePattern.hold2 > 0) {
          nextPhase = 'hold2';
          nextCount = activePattern.hold2;
        } else {
          nextPhase = 'inhale';
          nextCount = activePattern.inhale;
        }
      } else {
        nextPhase = 'inhale';
        nextCount = activePattern.inhale;
      }

      phaseRef.current = nextPhase;
      counterRef.current = nextCount;
      setPhase(nextPhase);
      setCounter(nextCount);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, activePattern, sessionDuration, stopBreathing]);

  const handleLogPracticeToGoal = () => {
    if (loggedNote) return;
    const minsEarned = Math.max(1, Math.round(secondsPracticed / 60));
    const goals = loadWeeklyGoals();
    let matchedTitle: string | null = null;
    const updated = goals.map((goal) => {
      if (goal.category === 'breathing' && goal.currentCount < goal.targetCount) {
        matchedTitle = goal.title;
        return {
          ...goal,
          currentCount: Math.min(goal.targetCount, goal.currentCount + minsEarned),
        };
      }
      return goal;
    });
    if (matchedTitle) {
      saveWeeklyGoals(updated);
      const { newlyUnlocked } = evaluateAndUnlockStickers(updated);
      const stickerMsg = newlyUnlocked.length > 0 ? ` Earned "${newlyUnlocked[0].name}" sticker!` : '';
      setLoggedNote(`Logged +${minsEarned} min to "${matchedTitle}".${stickerMsg}`);
    } else {
      setLoggedNote('Great breathwork! Your breathing goal is already complete for this week.');
    }
  };

  const getCircleScale = () => {
    if (!isRunning) return 'scale-100';
    if (phase === 'inhale') return 'scale-150';
    if (phase === 'exhale') return 'scale-100';
    return phase === 'hold1' ? 'scale-150' : 'scale-100';
  };

  const getPhaseText = () => {
    if (!isRunning) return 'Ready?';
    switch (phase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold1':
      case 'hold2':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex space-x-2 overflow-x-auto no-scrollbar w-full justify-start sm:justify-center pb-4 mb-2">
        {BREATHING_PATTERNS.map((p) => (
          <button
            type="button"
            key={p.name}
            onClick={() => {
              setActivePattern(p);
              stopBreathing(p, sessionDuration);
            }}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap min-h-[40px] ${
              activePattern.name === p.name
                ? 'bg-[#0d9488] text-white'
                : 'bg-[#f4fbfa] text-[#335c5d] border border-[#cce7e3] hover:border-[#8cd3ca]'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {!isRunning && (
        <div className="flex items-center space-x-3 mb-6">
          <ClockIcon className="w-5 h-5 text-[#4b7476]" />
          <div className="flex bg-[#eaf6f4] border border-[#cce7e3] rounded-xl p-1">
            {SESSION_DURATIONS.map((dur) => (
              <button
                type="button"
                key={dur.value}
                onClick={() => {
                  setSessionDuration(dur.value);
                  sessionRemainingRef.current = dur.value;
                  setSessionTimeRemaining(dur.value);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-mono-num transition-colors ${
                  sessionDuration === dur.value
                    ? 'bg-white text-[#0f3d3e] shadow-xs'
                    : 'text-[#4b7476] hover:text-[#0f3d3e]'
                }`}
              >
                {dur.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isRunning && (
        <div className="mb-6 flex items-center space-x-2 bg-[#eaf6f4] px-4 py-2 rounded-xl border border-[#cce7e3]">
          <ClockIcon className="w-4 h-4 text-[#0d9488]" />
          <span className="font-mono-num font-bold text-[#0f3d3e]">
            {formatSessionTime(sessionTimeRemaining)}
          </span>
        </div>
      )}

      <div className="relative w-64 h-64 flex items-center justify-center mb-10">
        <div
          className={`absolute inset-0 bg-gradient-to-br from-[#99f6e4] to-[#bae6fd] rounded-full opacity-50 transition-transform duration-[4000ms] ease-in-out ${
            isRunning ? 'scale-150' : 'scale-0'
          }`}
        />
        <div
          className={`w-32 h-32 bg-gradient-to-br from-[#2dd4bf] via-[#0ea5e9] to-[#6366f1] rounded-full shadow-lg flex flex-col items-center justify-center text-white transition-transform ease-in-out ${getCircleScale()}`}
          style={{
            transitionDuration:
              phase === 'inhale'
                ? `${activePattern.inhale}s`
                : phase === 'exhale'
                ? `${activePattern.exhale}s`
                : '1s',
          }}
        >
          <span className="text-4xl font-bold font-mono-num">{isRunning ? counter : '🌬️'}</span>
        </div>
        <div className="absolute -bottom-12 w-full text-center">
          <p className="font-serif-elegant text-2xl font-bold text-[#0f3d3e] transition-colors">
            {getPhaseText()}
          </p>
          <p className="text-[#4b7476] text-sm mt-1">{activePattern.description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={isRunning ? () => stopBreathing(activePattern, sessionDuration) : startBreathing}
        className={`w-full max-w-xs py-3.5 rounded-xl font-semibold text-base transition-all min-h-[48px] ${
          isRunning
            ? 'bg-[#eaf6f4] text-[#0f3d3e] border border-[#cce7e3] hover:bg-[#d7f0ec]'
            : 'bg-gradient-to-r from-[#0d9488] to-[#0891b2] hover:brightness-105 text-white'
        }`}
      >
        {isRunning ? 'Stop Session' : 'Start Session'}
      </button>

      {!isRunning && secondsPracticed >= 10 && (
        <div className="mt-5 w-full max-w-md p-3.5 rounded-2xl bg-[#eefaf7] border border-[#99e2d8] flex flex-wrap items-center justify-between gap-2.5">
          <p className="text-xs font-medium text-[#0f3d3e]">
            {loggedNote || `Completed ${secondsPracticed}s of mindful breathing.`}
          </p>
          {!loggedNote && (
            <button
              type="button"
              onClick={handleLogPracticeToGoal}
              className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold min-h-[38px]"
            >
              <CheckIcon className="w-3.5 h-3.5" />
              <span>Log to Weekly Goal</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const ACTIVITY_TABS: Array<{ id: ActivityType; label: string; emoji: string }> = [
  { id: 'breathing', label: 'Breathing', emoji: '🌬️' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘' },
  { id: 'meditation', label: 'Meditation', emoji: '🧠' },
  { id: 'affirmations', label: 'Affirmations', emoji: '✨' },
];

const WellnessActivities: React.FC<WellnessActivitiesProps> = ({
  onBack,
  initialActivity = null,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(initialActivity);

  useEffect(() => {
    setSelectedActivity(initialActivity ?? null);
  }, [initialActivity]);

  if (selectedActivity) {
    const isWideView =
      selectedActivity === 'affirmations' ||
      selectedActivity === 'meditation' ||
      selectedActivity === 'yoga';
    return (
      <div className="p-4 sm:p-6 h-full flex flex-col bg-[#f4fbfa] overflow-hidden">
        <div
          className={`${
            isWideView ? 'max-w-4xl' : 'max-w-3xl'
          } mx-auto w-full flex flex-col h-full`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                aria-label="Back to activities"
                className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl hover:bg-[#eaf6f4] text-[#4b7476] hover:text-[#0f3d3e] transition-colors mr-2 flex items-center justify-center"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <p className="text-xs font-semibold text-[#0f766e]">Mindful Practice</p>
                <h1 className="font-serif-elegant text-2xl sm:text-3xl font-bold capitalize leading-none text-[#0f3d3e]">
                  {selectedActivity}
                </h1>
              </div>
            </div>

            {/* Quick switcher between the 4 Wellness Activities */}
            <div
              role="tablist"
              aria-label="Switch wellness activity"
              className="flex items-center gap-1 p-1 bg-[#e3f5f1] border border-[#bde6de] rounded-xl overflow-x-auto max-w-full"
            >
              {ACTIVITY_TABS.map((tab) => {
                const active = selectedActivity === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedActivity(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center space-x-1 min-h-[36px] ${
                      active
                        ? 'bg-white text-[#0f3d3e] shadow-xs'
                        : 'text-[#3d6b6d] hover:text-[#0f3d3e]'
                    }`}
                  >
                    <span aria-hidden="true">{tab.emoji}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto rounded-3xl bg-white border border-[#cce7e3] p-5 sm:p-8 lg:p-10">
            {selectedActivity === 'breathing' ? (
              <div className="py-6">
                <BreathingGuide />
              </div>
            ) : selectedActivity === 'yoga' ? (
              <BeginnerYogaStudio />
            ) : selectedActivity === 'affirmations' ? (
              <AffirmationsGallery />
            ) : (
              <SixMinuteMeditation />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-gradient-to-b from-[#eefaf7] via-[#f4fbff] to-[#fff8f4] overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex items-center mb-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl hover:bg-[#e3f7f3] text-[#4b7476] hover:text-[#0f3d3e] transition-colors mr-2 flex items-center justify-center"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="font-serif-elegant text-3xl sm:text-4xl font-bold text-[#0f3d3e]">
            Wellness Activities
          </h1>
        </div>
        <p className="text-[#335c5d] text-base sm:text-lg mb-8 leading-relaxed">
          Choose a gentle activity to reconnect with your breath and focus.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActivityButton
            label="Breathing"
            subtitle="Paced visual breath cycles"
            emoji="🌬️"
            tone="teal"
            onClick={() => setSelectedActivity('breathing')}
          />
          <ActivityButton
            label="Yoga"
            subtitle="10 easy beginner yoga poses"
            emoji="🧘"
            tone="emerald"
            onClick={() => setSelectedActivity('yoga')}
          />
          <ActivityButton
            label="Meditation"
            subtitle="6-minute breathing meditation guide"
            emoji="🧠"
            tone="indigo"
            onClick={() => setSelectedActivity('meditation')}
          />
          <ActivityButton
            label="Affirmations"
            subtitle="10 encouraging growth-mindset truths"
            emoji="✨"
            tone="amber"
            onClick={() => setSelectedActivity('affirmations')}
          />
        </div>

        <div className="mt-8 p-5 bg-gradient-to-r from-[#fff1e6] to-[#e6faf6] rounded-2xl border border-[#fcd5be] flex items-center space-x-4">
          <div className="text-2xl shrink-0">💡</div>
          <p className="text-[#0f3d3e] text-sm italic font-medium leading-relaxed">
            "Consistency matters more than intensity. Even two quiet minutes a day can noticeably ease study tension."
          </p>
        </div>
      </div>
    </div>
  );
};

export default WellnessActivities;