import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateWellnessRoutine } from '../../services/geminiService';
import Card from '../common/Card';
import { ChevronLeftIcon, ClockIcon } from '../icons';

interface WellnessActivitiesProps {
  onBack: () => void;
}

type ActivityType = 'breathing' | 'yoga' | 'meditation' | 'affirmations';

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
  const [counter, setCounter] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const [sessionDuration, setSessionDuration] = useState(SESSION_DURATIONS[0].value);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(SESSION_DURATIONS[0].value);

  const timerRef = useRef<number | null>(null);
  const sessionTimerRef = useRef<number | null>(null);

  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stopBreathing = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    setIsRunning(false);
    setPhase('inhale');
    setCounter(0);
    setSessionTimeRemaining(sessionDuration);
  }, [sessionDuration]);

  const startBreathing = useCallback(() => {
    setIsRunning(true);
    setCounter(activePattern.inhale);
    setPhase('inhale');
    setSessionTimeRemaining(sessionDuration);

    sessionTimerRef.current = window.setInterval(() => {
      setSessionTimeRemaining((prev) => {
        if (prev <= 1) {
          stopBreathing();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [activePattern, sessionDuration, stopBreathing]);

  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = window.setInterval(() => {
      setCounter((prev) => {
        if (prev > 1) return prev - 1;

        setPhase((currentPhase) => {
          if (currentPhase === 'inhale') {
            if (activePattern.hold1) {
              setCounter(activePattern.hold1);
              return 'hold1';
            }
            setCounter(activePattern.exhale);
            return 'exhale';
          }
          if (currentPhase === 'hold1') {
            setCounter(activePattern.exhale);
            return 'exhale';
          }
          if (currentPhase === 'exhale') {
            if (activePattern.hold2) {
              setCounter(activePattern.hold2);
              return 'hold2';
            }
            setCounter(activePattern.inhale);
            return 'inhale';
          }
          if (currentPhase === 'hold2') {
            setCounter(activePattern.inhale);
            return 'inhale';
          }
          return 'inhale';
        });
        return 0;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, activePattern]);

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
              stopBreathing();
            }}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
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
        onClick={isRunning ? stopBreathing : startBreathing}
        className={`w-full max-w-xs py-3.5 rounded-xl font-semibold text-base transition-all min-h-[48px] ${
          isRunning
            ? 'bg-[#eaf6f4] text-[#0f3d3e] border border-[#cce7e3] hover:bg-[#d7f0ec]'
            : 'bg-gradient-to-r from-[#0d9488] to-[#0891b2] hover:brightness-105 text-white'
        }`}
      >
        {isRunning ? 'Stop Session' : 'Start Session'}
      </button>
    </div>
  );
};

const WellnessActivities: React.FC<WellnessActivitiesProps> = ({ onBack }) => {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [routine, setRoutine] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchRoutine = useCallback(async (activity: ActivityType) => {
    setSelectedActivity(activity);
    if (activity === 'breathing') return;

    setIsLoading(true);
    setRoutine('');
    const result = await generateWellnessRoutine(activity);
    setRoutine(result);
    setIsLoading(false);
  }, []);

  const renderRoutine = (text: string, type: ActivityType) => {
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine === '') return <div key={index} className="h-3" />;
      if (trimmedLine === '---') return <hr key={index} className="my-8 border-[#cce7e3]" />;
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        return (
          <h3
            key={index}
            className="font-serif-elegant text-2xl font-bold text-[#0f3d3e] mt-8 mb-4 pb-2 border-b border-[#cce7e3]"
          >
            {trimmedLine.substring(2, trimmedLine.length - 2)}
          </h3>
        );
      }
      if (type === 'affirmations') {
        return (
          <div
            key={index}
            className="text-center my-6 p-6 bg-[#eaf6f4] rounded-2xl border border-[#cce7e3]"
          >
            <p className="font-serif-elegant text-xl sm:text-2xl text-[#0f3d3e] leading-snug">
              "{trimmedLine.replace(/^\d+\.\s*/, '')}"
            </p>
          </div>
        );
      }
      const stepMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
      if (stepMatch) {
        return (
          <div key={index} className="flex items-start space-x-4 mb-5">
            <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-[#0d9488] text-white rounded-xl font-mono-num text-sm font-bold">
              {stepMatch[1]}
            </span>
            <p className="text-[#335c5d] leading-relaxed text-base pt-1">{stepMatch[2]}</p>
          </div>
        );
      }
      return (
        <p key={index} className="text-[#335c5d] leading-relaxed text-base mb-5">
          {trimmedLine}
        </p>
      );
    });
  };

  if (selectedActivity) {
    return (
      <div className="p-4 sm:p-6 h-full flex flex-col bg-[#f4fbfa] overflow-hidden">
        <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
          <div className="flex items-center mb-5">
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
              <h1 className="font-serif-elegant text-3xl font-bold capitalize leading-none text-[#0f3d3e]">
                {selectedActivity}
              </h1>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto rounded-3xl bg-white border border-[#cce7e3] p-6 sm:p-10">
            {selectedActivity === 'breathing' ? (
              <div className="py-6">
                <BreathingGuide />
              </div>
            ) : isLoading ? (
              <div className="flex flex-col justify-center items-center h-full py-20 text-center">
                <div className="w-14 h-14 rounded-full border-4 border-[#eaf6f4] border-t-[#0d9488] animate-spin mb-5" />
                <p className="font-serif-elegant text-2xl font-bold text-[#0f3d3e] mb-1">
                  Finding your flow...
                </p>
                <p className="text-sm text-[#4b7476]">Creating a calm routine for you</p>
              </div>
            ) : (
              <div className="max-w-prose mx-auto">
                {renderRoutine(routine, selectedActivity)}
                <div className="mt-12 pt-6 border-t border-[#eaf6f4] text-center">
                  <p className="font-serif-elegant italic text-lg text-[#4b7476]">
                    Take a slow breath and begin when ready.
                  </p>
                </div>
              </div>
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
            onClick={() => fetchRoutine('breathing')}
          />
          <ActivityButton
            label="Yoga"
            subtitle="Desk-friendly tension release"
            emoji="🧘"
            tone="emerald"
            onClick={() => fetchRoutine('yoga')}
          />
          <ActivityButton
            label="Meditation"
            subtitle="Guided grounding reset"
            emoji="🧠"
            tone="indigo"
            onClick={() => fetchRoutine('meditation')}
          />
          <ActivityButton
            label="Affirmations"
            subtitle="Encouraging mindset prompts"
            emoji="✨"
            tone="amber"
            onClick={() => fetchRoutine('affirmations')}
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