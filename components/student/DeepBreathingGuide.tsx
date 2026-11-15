import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshIcon, CheckIcon, WindIcon } from '../icons';
import { loadWeeklyGoals, saveWeeklyGoals } from '../../services/weeklyGoalsData';
import { evaluateAndUnlockStickers } from '../../services/mindfulnessStickersData';

export interface DeepBreathingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  initialStressScore?: number | null;
  onPracticeLogged?: () => void;
}

type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

interface CadenceOption {
  id: 'deep_calm' | 'box' | 'relax_478';
  name: string;
  timingLabel: string;
  purpose: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
}

const CADENCES: CadenceOption[] = [
  {
    id: 'deep_calm',
    name: 'Deep Calm',
    timingLabel: '4s In · 6s Out',
    purpose: 'Lengthened exhale helps settle rapid breathing & acute tension',
    inhale: 4,
    hold1: 0,
    exhale: 6,
    hold2: 0,
  },
  {
    id: 'box',
    name: 'Box Breathing',
    timingLabel: '4 · 4 · 4 · 4',
    purpose: 'Steady four-part cadence for overwhelm & exam focus',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
  },
  {
    id: 'relax_478',
    name: '4-7-8 Reset',
    timingLabel: '4 · 7 · 8',
    purpose: 'Deep nervous-system down-regulation before rest',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
  },
];

const CYCLE_PRESETS = [3, 5, 8] as const;

const PHASE_LABELS: Record<BreathPhase, { title: string; cue: string }> = {
  inhale: {
    title: 'Breathe In',
    cue: 'Inhale slowly through your nose and let your belly rise',
  },
  hold1: {
    title: 'Hold Softly',
    cue: 'Keep your jaw unclenched and shoulders relaxed',
  },
  exhale: {
    title: 'Breathe Out',
    cue: 'Exhale gently and let tension melt out of your shoulders',
  },
  hold2: {
    title: 'Rest Empty',
    cue: 'Notice the quiet stillness before your next breath',
  },
};

const ORB_CIRCUMFERENCE = 2 * Math.PI * 104; // r=104 => ~653.45

const DeepBreathingGuide: React.FC<DeepBreathingGuideProps> = ({
  isOpen,
  onClose,
  initialStressScore = null,
  onPracticeLogged,
}) => {
  const [cadence, setCadence] = useState<CadenceOption>(CADENCES[0]);
  const [targetCycles, setTargetCycles] = useState<number>(5);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [phaseDurationSec, setPhaseDurationSec] = useState<number>(CADENCES[0].inhale);
  const [secondsLeft, setSecondsLeft] = useState<number>(CADENCES[0].inhale);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [totalActiveSeconds, setTotalActiveSeconds] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [goalLoggedMessage, setGoalLoggedMessage] = useState<string | null>(null);

  const phaseRef = useRef<BreathPhase>('inhale');
  const secondsLeftRef = useRef<number>(CADENCES[0].inhale);
  const completedCyclesRef = useRef<number>(0);

  const getDurationForPhase = useCallback(
    (p: BreathPhase, opt: CadenceOption): number => {
      if (p === 'inhale') return opt.inhale;
      if (p === 'hold1') return opt.hold1;
      if (p === 'exhale') return opt.exhale;
      return opt.hold2;
    },
    []
  );

  const resetGuide = useCallback(
    (selectedCadence: CadenceOption = cadence) => {
      setIsRunning(false);
      setIsCompleted(false);
      setGoalLoggedMessage(null);
      phaseRef.current = 'inhale';
      secondsLeftRef.current = selectedCadence.inhale;
      completedCyclesRef.current = 0;
      setPhase('inhale');
      setPhaseDurationSec(selectedCadence.inhale);
      setSecondsLeft(selectedCadence.inhale);
      setCompletedCycles(0);
      setTotalActiveSeconds(0);
    },
    [cadence]
  );

  // Close on Escape key while open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset cleanly whenever closed
  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
    }
  }, [isOpen]);

  // 1-second timer driving CSS transition phases deterministically
  useEffect(() => {
    if (!isOpen || !isRunning || isCompleted) return;

    const timer = window.setInterval(() => {
      setTotalActiveSeconds((prev) => prev + 1);

      if (secondsLeftRef.current > 1) {
        secondsLeftRef.current -= 1;
        setSecondsLeft(secondsLeftRef.current);
        return;
      }

      // Advance to the next valid phase in cadence
      let nextPhase: BreathPhase = 'inhale';
      let incrementedCycle = false;

      if (phaseRef.current === 'inhale') {
        nextPhase = cadence.hold1 > 0 ? 'hold1' : 'exhale';
      } else if (phaseRef.current === 'hold1') {
        nextPhase = 'exhale';
      } else if (phaseRef.current === 'exhale') {
        if (cadence.hold2 > 0) {
          nextPhase = 'hold2';
        } else {
          nextPhase = 'inhale';
          incrementedCycle = true;
        }
      } else {
        nextPhase = 'inhale';
        incrementedCycle = true;
      }

      if (incrementedCycle) {
        const nextCount = completedCyclesRef.current + 1;
        completedCyclesRef.current = nextCount;
        setCompletedCycles(nextCount);

        if (nextCount >= targetCycles) {
          setIsRunning(false);
          setIsCompleted(true);
          setSecondsLeft(0);
          return;
        }
      }

      const nextDuration = getDurationForPhase(nextPhase, cadence);
      phaseRef.current = nextPhase;
      secondsLeftRef.current = nextDuration;
      setPhase(nextPhase);
      setPhaseDurationSec(nextDuration);
      setSecondsLeft(nextDuration);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isOpen, isRunning, isCompleted, cadence, targetCycles, getDurationForPhase]);

  const handleSelectCadence = (next: CadenceOption) => {
    setCadence(next);
    resetGuide(next);
  };

  const handleStartPause = () => {
    if (isCompleted) {
      resetGuide(cadence);
      // Wait next tick so CSS transition restarts cleanly from base scale
      window.requestAnimationFrame(() => setIsRunning(true));
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const handleLogBreathingGoal = () => {
    if (goalLoggedMessage) return;
    const minsEarned = Math.max(1, Math.round(totalActiveSeconds / 60));
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
      const unlockBonus =
        newlyUnlocked.length > 0
          ? ` Unlocked "${newlyUnlocked[0].name}" sticker!`
          : '';
      setGoalLoggedMessage(`Added +${minsEarned} min toward "${matchedTitle}"!${unlockBonus}`);
      onPracticeLogged?.();
    } else {
      setGoalLoggedMessage('Session logged — your breathing goals are already complete this week!');
    }
  };

  if (!isOpen) return null;

  // CSS transition transforms driven purely by phase + running state
  const isExpanded = isRunning && (phase === 'inhale' || phase === 'hold1');
  const transitionTiming = 'cubic-bezier(0.37, 0, 0.63, 1)';
  const activeTransitionSeconds = isRunning ? Math.max(0.4, phaseDurationSec) : 0.6;

  // Core orb visual styles per phase
  const coreScale = isExpanded ? 'scale-[1.36]' : 'scale-[0.92]';
  const haloScale = isExpanded ? 'scale-[1.58] opacity-75' : 'scale-[0.88] opacity-30';
  const petalRotation = isExpanded ? 'rotate-45 scale-[1.22]' : 'rotate-0 scale-[0.95]';

  const orbGradientClass =
    phase === 'inhale'
      ? 'from-[#2dd4bf] via-[#0d9488] to-[#0891b2]'
      : phase === 'hold1'
      ? 'from-[#38bdf8] via-[#0ea5e9] to-[#4f46e5]'
      : phase === 'exhale'
      ? 'from-[#6ee7b7] via-[#14b8a6] to-[#0284c7]'
      : 'from-[#99f6e4] via-[#5eead4] to-[#38bdf8]';

  const elapsedInPhase = Math.max(0, phaseDurationSec - secondsLeft);
  const phaseProgressRatio =
    !isRunning && !isCompleted
      ? 0
      : isCompleted
      ? 1
      : phaseDurationSec > 0
      ? (elapsedInPhase + 0.05) / phaseDurationSec
      : 1;
  const strokeDashoffset = ORB_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, phaseProgressRatio)));

  const currentPhaseCopy = isCompleted
    ? {
        title: 'Feeling Steadier',
        cue: 'Notice how your shoulders and breath feel right now.',
      }
    : !isRunning && completedCycles === 0 && totalActiveSeconds === 0
    ? {
        title: 'Ready When You Are',
        cue: 'Drop your shoulders, soften your gaze, and tap Begin.',
      }
    : PHASE_LABELS[phase];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deep-breathing-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#062426]/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRunning) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#ffffff] via-[#f4fbfa] to-[#eef7ff] border border-[#99e2d8] shadow-2xl p-5 sm:p-7 space-y-5 my-auto">
        {/* Top Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#ccf7ef] text-[#0f766e]">
                <WindIcon className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0f766e]">
                Guided Deep Breathing
              </span>
              {typeof initialStressScore === 'number' && initialStressScore >= 60 && (
                <span className="text-[11px] font-semibold text-[#c2410c] bg-[#ffedd5] border border-[#fdba74] px-2 py-0.5 rounded-lg">
                  Calming High Stress ({initialStressScore}/100)
                </span>
              )}
            </div>
            <h2
              id="deep-breathing-title"
              className="text-xl sm:text-2xl font-bold text-[#0f3d3e] font-serif-elegant"
            >
              Pause &amp; Reset Your Breath
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close breathing guide"
            className="min-w-[44px] min-h-[44px] -mt-1 -mr-1 rounded-xl bg-white hover:bg-[#e6faf6] border border-[#cce7e3] text-[#335c5d] hover:text-[#0f3d3e] font-bold text-lg flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        {/* Breathing Cadence Selector */}
        <div className="grid grid-cols-3 gap-2">
          {CADENCES.map((opt) => {
            const active = cadence.id === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectCadence(opt)}
                className={`p-2.5 rounded-xl border text-left transition-all min-h-[44px] ${
                  active
                    ? 'bg-gradient-to-br from-[#e6faf6] to-[#e0f2fe] border-[#0d9488] text-[#0f3d3e] shadow-xs'
                    : 'bg-white border-[#cce7e3] text-[#4b7476] hover:border-[#8cd3ca]'
                }`}
              >
                <p className="text-xs font-bold leading-tight">{opt.name}</p>
                <p className="text-[11px] font-mono-num text-[#0f766e] mt-0.5">{opt.timingLabel}</p>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-[#335c5d] text-center bg-white/80 border border-[#dcefeb] rounded-xl px-3 py-2">
          {cadence.purpose}
        </p>

        {/* Animated CSS-Transition Breathing Stage */}
        <div className="relative flex flex-col items-center justify-center py-4 sm:py-5">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            {/* Outer expanding botanical mist halo */}
            <div
              aria-hidden="true"
              className={`absolute w-44 h-44 rounded-full bg-gradient-to-br from-[#99f6e4]/65 via-[#bae6fd]/55 to-[#c7d2fe]/55 blur-md transform ${haloScale}`}
              style={{
                transitionProperty: 'transform, opacity',
                transitionDuration: `${activeTransitionSeconds}s`,
                transitionTimingFunction: transitionTiming,
              }}
            />

            {/* Middle rotating layered ring */}
            <div
              aria-hidden="true"
              className={`absolute w-48 h-48 rounded-[42%] border-2 border-[#5eead4]/60 bg-[#ccf7ef]/25 transform ${petalRotation}`}
              style={{
                transitionProperty: 'transform, border-color, background-color',
                transitionDuration: `${activeTransitionSeconds}s`,
                transitionTimingFunction: transitionTiming,
              }}
            />

            {/* SVG Circular Phase Progress Ring */}
            <svg
              viewBox="0 0 240 240"
              aria-hidden="true"
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            >
              <circle
                cx="120"
                cy="120"
                r="104"
                fill="none"
                stroke="#dcefeb"
                strokeWidth="5"
              />
              <circle
                cx="120"
                cy="120"
                r="104"
                fill="none"
                stroke={phase === 'exhale' ? '#0891b2' : '#0d9488'}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={ORB_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transitionProperty: 'stroke-dashoffset, stroke',
                  transitionDuration: isRunning ? '980ms' : '350ms',
                  transitionTimingFunction: 'linear',
                }}
              />
            </svg>

            {/* Inner Animated Core Sphere */}
            <div
              className={`relative z-10 w-36 h-36 rounded-full bg-gradient-to-br ${orbGradientClass} shadow-[0_14px_34px_-10px_rgba(13,148,136,0.48)] flex flex-col items-center justify-center text-white transform ${coreScale}`}
              style={{
                transitionProperty: 'transform, background-color, box-shadow',
                transitionDuration: `${activeTransitionSeconds}s`,
                transitionTimingFunction: transitionTiming,
              }}
            >
              {isCompleted ? (
                <CheckIcon className="w-10 h-10 text-white" />
              ) : (
                <>
                  <span className="text-4xl font-bold font-mono-num leading-none">
                    {isRunning ? secondsLeft : cadence.inhale}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-white/90 mt-1">
                    {isRunning ? (phase === 'hold1' || phase === 'hold2' ? 'Hold' : phase) : 'sec'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Synchronized Phase Copy & Cycle Progress */}
          <div className="text-center space-y-1 mt-2 min-h-[56px]" aria-live="polite">
            <h3 className="text-xl sm:text-2xl font-bold text-[#0f3d3e] font-serif-elegant transition-opacity duration-300">
              {currentPhaseCopy.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#335c5d] max-w-sm mx-auto leading-snug">
              {currentPhaseCopy.cue}
            </p>
          </div>
        </div>

        {/* Cycle Count Selector & Progress Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-white border border-[#cce7e3]">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#335c5d]">Cycles:</span>
            <span className="text-xs font-bold font-mono-num text-[#0f766e]">
              {Math.min(completedCycles, targetCycles)} / {targetCycles}
            </span>
          </div>

          <div className="flex items-center space-x-1.5" role="group" aria-label="Target breath cycles">
            {CYCLE_PRESETS.map((count) => (
              <button
                key={count}
                type="button"
                disabled={isRunning}
                onClick={() => {
                  setTargetCycles(count);
                  resetGuide(cadence);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono-num transition-colors min-h-[34px] ${
                  targetCycles === count
                    ? 'bg-[#0d9488] text-white'
                    : 'bg-[#f4fbfa] text-[#4b7476] hover:bg-[#e6faf6] disabled:opacity-50'
                }`}
              >
                {count}×
              </button>
            ))}
          </div>
        </div>

        {/* Goal Log Banner after finishing or pausing mid-session */}
        {(isCompleted || completedCycles >= 1) && (
          <div className="p-3.5 rounded-2xl bg-[#eefaf7] border border-[#99e2d8] flex flex-wrap items-center justify-between gap-2.5">
            <p className="text-xs font-medium text-[#0f3d3e]">
              {goalLoggedMessage
                ? goalLoggedMessage
                : `Completed ${completedCycles} calming breath ${
                    completedCycles === 1 ? 'cycle' : 'cycles'
                  }. Log toward your weekly breathing goal?`}
            </p>
            {!goalLoggedMessage && (
              <button
                type="button"
                onClick={handleLogBreathingGoal}
                className="px-3.5 py-2 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold transition-colors whitespace-nowrap min-h-[38px]"
              >
                + Log Breathing
              </button>
            )}
          </div>
        )}

        {/* Primary Play/Pause & Reset Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleStartPause}
            className={`flex-1 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all min-h-[48px] ${
              isRunning
                ? 'bg-[#fff7ed] border border-[#fdba74] text-[#9a3412] hover:bg-[#ffedd5]'
                : 'bg-gradient-to-r from-[#0d9488] to-[#0891b2] hover:brightness-105 text-white shadow-sm'
            }`}
          >
            {isCompleted
              ? 'Breathe Another Round'
              : isRunning
              ? 'Pause'
              : completedCycles > 0 || totalActiveSeconds > 0
              ? 'Resume Breathing'
              : 'Begin Deep Breathing'}
          </button>

          <button
            type="button"
            onClick={() => resetGuide(cadence)}
            aria-label="Reset breathing session"
            className="min-w-[48px] min-h-[48px] px-3.5 rounded-xl bg-white hover:bg-[#e6faf6] border border-[#cce7e3] text-[#335c5d] flex items-center justify-center transition-colors"
          >
            <RefreshIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeepBreathingGuide;
