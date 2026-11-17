import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayIcon,
  RefreshIcon,
  CheckIcon,
  ClockIcon,
  SpeakerWaveIcon,
} from '../icons';

type PaceMode = 'natural' | 'slow-4-6';

const TOTAL_SECONDS = 6 * 60; // 360 seconds

const BEFORE_START_STEPS = [
  'Sit upright on a chair or the floor, with your back fairly straight but not stiff.',
  'Rest your hands on your lap and close your eyes, or look softly at the floor.',
  'Silence your phone and set a timer for 6 minutes.',
];

interface PhaseSegment {
  id: 'settle' | 'follow' | 'widen';
  windowLabel: string;
  title: string;
  startElapsed: number; // seconds elapsed
  endElapsed: number;
  tintClass: string;
  accentClass: string;
}

const MEDITATION_PHASES: PhaseSegment[] = [
  {
    id: 'settle',
    windowLabel: 'Minute 0–1',
    title: 'Minute 0-1: Settle',
    startElapsed: 0,
    endElapsed: 60,
    tintClass: 'from-[#eefbf8] via-[#ffffff] to-[#e4f7f3] border-[#b7e4dc]',
    accentClass: 'text-[#0f766e]',
  },
  {
    id: 'follow',
    windowLabel: 'Minute 1–5',
    title: 'Minute 1-5: Follow your breath',
    startElapsed: 60,
    endElapsed: 300,
    tintClass: 'from-[#eef2ff] via-[#ffffff] to-[#e6f0ff] border-[#c7d2fe]',
    accentClass: 'text-[#4338ca]',
  },
  {
    id: 'widen',
    windowLabel: 'Minute 5–6',
    title: 'Minute 5-6: Widen and close',
    startElapsed: 300,
    endElapsed: 360,
    tintClass: 'from-[#fff8f1] via-[#ffffff] to-[#ffedd5] border-[#fed7aa]',
    accentClass: 'text-[#c2410c]',
  },
];

const RESEARCH_POINTS = [
  {
    index: '01',
    text: 'Reviews and meta-analyses of school-based mindfulness programs generally find small to moderate benefits for stress, anxiety, attention, and emotional regulation.',
  },
  {
    index: '02',
    text: 'Slow, controlled breathing is associated with increased heart rate variability and a calmer physiological state.',
  },
  {
    index: '03',
    text: 'Results are modest and vary between people. Regular short practice, such as 5 to 10 minutes most days, works better than occasional long sessions. Meditation is a helpful habit, not a cure-all.',
  },
];

function playSoftBell(ctxRef: React.MutableRefObject<AudioContext | null>, frequency = 528) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!ctxRef.current) {
      ctxRef.current = new AudioCtx();
    }
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const harmonic = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(frequency * 2, now);

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(0.03, now);
    harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

    osc.connect(gain);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    harmonic.start(now);
    osc.stop(now + 2.5);
    harmonic.stop(now + 1.7);
  } catch {
    // Web Audio not available or blocked
  }
}

const SixMinuteMeditation: React.FC = () => {
  const [remainingSeconds, setRemainingSeconds] = useState(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [paceMode, setPaceMode] = useState<PaceMode>('natural');
  const [bellEnabled, setBellEnabled] = useState(true);
  const [checkedPrep, setCheckedPrep] = useState<boolean[]>([false, false, false]);
  const [breathCount, setBreathCount] = useState(1);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevElapsedRef = useRef(0);

  const elapsedSeconds = TOTAL_SECONDS - remainingSeconds;

  const activePhase: PhaseSegment =
    elapsedSeconds < 60
      ? MEDITATION_PHASES[0]
      : elapsedSeconds < 300
        ? MEDITATION_PHASES[1]
        : MEDITATION_PHASES[2];

  // 4s inhale, 6s exhale = 10s cycle (roughly 6 breaths per minute)
  const slowCycleSec = elapsedSeconds % 10;
  const slowIsInhale = slowCycleSec < 4;
  const slowPhaseRemaining = slowIsInhale ? 4 - slowCycleSec : 10 - slowCycleSec;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isRunning) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setHasCompleted(true);
          if (bellEnabled) {
            playSoftBell(audioCtxRef, 528);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, bellEnabled]);

  // Trigger subtle phase transition bells at 1:00 and 5:00 marks
  useEffect(() => {
    const prevElapsed = prevElapsedRef.current;
    if (isRunning && bellEnabled) {
      if (prevElapsed < 60 && elapsedSeconds >= 60) {
        playSoftBell(audioCtxRef, 440);
      } else if (prevElapsed < 300 && elapsedSeconds >= 300) {
        playSoftBell(audioCtxRef, 493.88);
      }
    }
    prevElapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds, isRunning, bellEnabled]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleToggleStart = useCallback(() => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(TOTAL_SECONDS);
      setHasCompleted(false);
      prevElapsedRef.current = 0;
    }
    setIsRunning((prev) => {
      const next = !prev;
      if (next && bellEnabled && elapsedSeconds === 0) {
        playSoftBell(audioCtxRef, 528);
      }
      return next;
    });
  }, [remainingSeconds, bellEnabled, elapsedSeconds]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setHasCompleted(false);
    setRemainingSeconds(TOTAL_SECONDS);
    prevElapsedRef.current = 0;
  }, []);

  const handleJumpToPhase = (startElapsed: number) => {
    setRemainingSeconds(TOTAL_SECONDS - startElapsed);
    setHasCompleted(false);
    prevElapsedRef.current = startElapsed;
  };

  const togglePrepItem = (idx: number) => {
    setCheckedPrep((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const progressRatio = elapsedSeconds / TOTAL_SECONDS;
  const ringRadius = 78;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference * (1 - progressRatio);

  return (
    <div className="space-y-8">
      {/* Editorial Hero Introduction */}
      <header className="relative overflow-hidden rounded-3xl border border-[#bde6de] bg-gradient-to-br from-[#eefbf8] via-[#ffffff] to-[#eef2ff] p-6 sm:p-9">
        {/* Delicate lotus horizon SVG filigree */}
        <svg
          aria-hidden="true"
          viewBox="0 0 140 140"
          fill="none"
          className="pointer-events-none absolute -top-4 -right-4 w-40 h-40 opacity-20 text-[#0d9488]"
        >
          <circle cx="70" cy="70" r="54" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
          <circle cx="70" cy="70" r="36" stroke="currentColor" strokeWidth="1.2" />
          <path d="M70 28C82 46 82 64 70 78C58 64 58 46 70 28Z" stroke="currentColor" strokeWidth="1.2" />
          <path d="M40 52C58 52 70 62 70 78C54 76 42 66 40 52Z" stroke="currentColor" strokeWidth="1.2" />
          <path d="M100 52C82 52 70 62 70 78C86 76 98 66 100 52Z" stroke="currentColor" strokeWidth="1.2" />
        </svg>

        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#0f766e] mb-3">
            <span>Mindfulness of Breathing</span>
            <span aria-hidden="true" className="text-[#9cc7c1]">
              ·
            </span>
            <span className="font-mono-num">6 Minutes</span>
            <span aria-hidden="true" className="text-[#9cc7c1]">
              ·
            </span>
            <span>Guided Timer</span>
          </div>

          <h2 className="font-serif-elegant text-2xl sm:text-4xl font-bold text-[#0f3d3e] leading-tight text-balance">
            A 6-minute breathing meditation for students
          </h2>

          <p className="mt-3 text-base sm:text-[17px] text-[#335c5d] leading-relaxed">
            This is mindfulness of breathing, the core technique used in most school-based mindfulness programs.
          </p>
        </div>
      </header>

      {/* Interactive 6-Minute Sanctuary Timer & Breath Pace Companion */}
      <section
        aria-label="Interactive 6-minute meditation timer"
        className="rounded-3xl p-2 border border-[#bfe5de] bg-gradient-to-br from-[#f2fbf9] via-[#f7faff] to-[#eef2ff]"
      >
        <div className="rounded-2xl bg-white/85 backdrop-blur-xs border border-white p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Orbital Progress Clock */}
            <div className="relative flex-shrink-0 w-48 h-48 flex items-center justify-center">
              {/* Gentle ambient aura ring that scales calmly in 4-6 mode */}
              <div
                aria-hidden="true"
                className={`absolute inset-3 rounded-full bg-gradient-to-br from-[#ccf7ef] to-[#e0e7ff] transition-transform ease-in-out ${
                  paceMode === 'slow-4-6' && isRunning
                    ? slowIsInhale
                      ? 'scale-105 opacity-70 duration-[4000ms]'
                      : 'scale-90 opacity-45 duration-[6000ms]'
                    : isRunning
                      ? 'scale-100 opacity-55 duration-1000'
                      : 'scale-95 opacity-35 duration-500'
                }`}
              />

              <svg className="w-48 h-48 -rotate-90 relative z-10" viewBox="0 0 180 180">
                <circle
                  cx="90"
                  cy="90"
                  r={ringRadius}
                  fill="none"
                  stroke="#e3f4f1"
                  strokeWidth="8"
                />
                {/* Phase tick marks at Minute 1 (60s) and Minute 5 (300s) */}
                <circle
                  cx="90"
                  cy="90"
                  r={ringRadius}
                  fill="none"
                  stroke={paceMode === 'slow-4-6' ? '#4f46e5' : '#0d9488'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-[stroke-dashoffset] duration-700 ease-linear"
                />
              </svg>

              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
                <span className="text-[11px] font-semibold text-[#4b7476]">
                  {hasCompleted ? 'Complete' : activePhase.windowLabel}
                </span>
                <span className="font-mono-num text-3xl sm:text-4xl font-bold text-[#0f3d3e] mt-0.5 tracking-tight">
                  {formatTimer(remainingSeconds)}
                </span>
                {paceMode === 'slow-4-6' ? (
                  <span className="text-xs font-semibold text-[#4338ca] mt-1">
                    {isRunning
                      ? `${slowIsInhale ? 'Inhale' : 'Exhale'} · ${slowPhaseRemaining}s`
                      : '4s In · 6s Out'}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[#0f766e] mt-1">
                    {isRunning ? activePhase.title.split(': ')[1] : 'Ready'}
                  </span>
                )}
              </div>
            </div>

            {/* Timer Controls & Mode Switcher */}
            <div className="flex-grow w-full space-y-5">
              <div>
                <p className="text-xs font-semibold text-[#4b7476] mb-2">Breathing Pace</p>
                <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-[#eef6f5] border border-[#cde8e3]">
                  <button
                    type="button"
                    onClick={() => setPaceMode('natural')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                      paceMode === 'natural'
                        ? 'bg-white text-[#0f3d3e] shadow-xs'
                        : 'text-[#4b7476] hover:text-[#0f3d3e]'
                    }`}
                  >
                    Natural Breath (Core)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaceMode('slow-4-6')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] ${
                      paceMode === 'slow-4-6'
                        ? 'bg-white text-[#4338ca] shadow-xs'
                        : 'text-[#4b7476] hover:text-[#0f3d3e]'
                    }`}
                  >
                    Slow Exam Pace (4s In / 6s Out)
                  </button>
                </div>
              </div>

              {/* 3-Segment Timeline Scrubber */}
              <div>
                <div className="flex items-center justify-between text-xs text-[#4b7476] mb-2">
                  <span>Session Map</span>
                  <span className="font-mono-num">
                    {Math.round(progressRatio * 100)}% elapsed
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MEDITATION_PHASES.map((seg) => {
                    const isCurrent = !hasCompleted && activePhase.id === seg.id;
                    return (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() => handleJumpToPhase(seg.startElapsed)}
                        className={`text-left px-3 py-2.5 rounded-xl border transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                          isCurrent
                            ? 'bg-[#e6faf6] border-[#0d9488] text-[#0f3d3e]'
                            : 'bg-[#f8fcfb] border-[#d8eeea] text-[#4b7476] hover:border-[#99d8cf] hover:text-[#0f3d3e]'
                        }`}
                      >
                        <div className="font-mono-num text-[11px] font-semibold">{seg.windowLabel}</div>
                        <div className="text-xs font-semibold truncate mt-0.5">
                          {seg.title.split(': ')[1]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleToggleStart}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0d9488] to-[#0891b2] hover:brightness-105 text-white text-sm font-semibold inline-flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
                >
                  <PlayIcon className="w-4 h-4" />
                  <span>
                    {hasCompleted
                      ? 'Practice Again'
                      : isRunning
                        ? 'Pause Timer'
                        : elapsedSeconds > 0
                          ? 'Resume Timer'
                          : 'Start 6-Minute Timer'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-[#cce7e3] hover:bg-[#eaf6f4] text-[#0f3d3e] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
                >
                  <RefreshIcon className="w-4 h-4" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBellEnabled((b) => !b)}
                  aria-pressed={bellEnabled}
                  className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                    bellEnabled
                      ? 'bg-[#eaf6f4] border-[#99d8cf] text-[#0f766e]'
                      : 'bg-white border-[#d8eeea] text-[#648889]'
                  }`}
                >
                  <SpeakerWaveIcon className="w-4 h-4" />
                  <span>{bellEnabled ? 'Soft Bell On' : 'Bell Muted'}</span>
                </button>
              </div>
            </div>
          </div>

          {hasCompleted && (
            <div className="mt-6 pt-5 border-t border-[#d8eeea] flex flex-wrap items-center justify-between gap-3">
              <p className="font-serif-elegant text-lg font-semibold text-[#0f3d3e]">
                Well done — six quiet minutes completed. Take a moment before returning to your day.
              </p>
              <ClockIcon className="w-5 h-5 text-[#0d9488] shrink-0" />
            </div>
          )}
        </div>
      </section>

      {/* Before You Start Checklist */}
      <section className="rounded-2xl border border-[#cce7e3] bg-[#f8fdfc] p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="font-serif-elegant text-2xl font-bold text-[#0f3d3e]">
            Before you start
          </h3>
          <span className="text-xs font-mono-num font-semibold text-[#0f766e]">
            {checkedPrep.filter(Boolean).length} / {BEFORE_START_STEPS.length} ready
          </span>
        </div>

        <ul className="space-y-3">
          {BEFORE_START_STEPS.map((step, index) => {
            const done = checkedPrep[index];
            return (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => togglePrepItem(index)}
                  className={`w-full text-left flex items-start gap-3.5 p-3.5 rounded-xl border transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                    done
                      ? 'bg-[#e6faf6] border-[#99d8cf]'
                      : 'bg-white border-[#dcefed] hover:border-[#a7dcd3]'
                  }`}
                >
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                      done
                        ? 'bg-[#0d9488] border-[#0d9488] text-white'
                        : 'bg-white border-[#9cc7c1] text-transparent'
                    }`}
                  >
                    <CheckIcon className="w-3.5 h-3.5" />
                  </span>
                  <span
                    className={`text-sm sm:text-base leading-relaxed ${
                      done ? 'text-[#0f3d3e] font-medium' : 'text-[#2c5253]'
                    }`}
                  >
                    {step}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Step-by-Step Timed Practice Chapters */}
      <section aria-label="6-minute guided sequence" className="space-y-4">
        {/* Minute 0-1: Settle */}
        <article
          className={`rounded-2xl border bg-gradient-to-br p-6 sm:p-7 transition-all ${
            MEDITATION_PHASES[0].tintClass
          } ${
            activePhase.id === 'settle' && !hasCompleted
              ? 'ring-2 ring-[#0d9488]/40'
              : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="font-mono-num text-xs font-semibold text-[#0f766e]">
              01 · First 60 Seconds
            </span>
            {activePhase.id === 'settle' && isRunning && (
              <span className="text-xs font-semibold text-[#0f766e]">Current Stage</span>
            )}
          </div>
          <h3 className="font-serif-elegant text-2xl font-bold text-[#0f3d3e] mb-3">
            Minute 0-1: Settle
          </h3>
          <p className="text-[#2c5253] text-base leading-relaxed">
            Take three slow breaths. Breathe in through your nose and out through your mouth. Notice your feet on the floor and your body&apos;s weight on the seat.
          </p>
        </article>

        {/* Minute 1-5: Follow your breath */}
        <article
          className={`rounded-2xl border bg-gradient-to-br p-6 sm:p-7 transition-all ${
            MEDITATION_PHASES[1].tintClass
          } ${
            activePhase.id === 'follow' && !hasCompleted
              ? 'ring-2 ring-[#4f46e5]/40'
              : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="font-mono-num text-xs font-semibold text-[#4338ca]">
              02 · Core Practice (4 Minutes)
            </span>
            {activePhase.id === 'follow' && isRunning && (
              <span className="text-xs font-semibold text-[#4338ca]">Current Stage</span>
            )}
          </div>
          <h3 className="font-serif-elegant text-2xl font-bold text-[#0f3d3e] mb-4">
            Minute 1-5: Follow your breath
          </h3>

          <ul className="space-y-3 text-[#2c5253] text-base leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="font-mono-num text-xs font-bold text-[#4338ca] mt-1.5 shrink-0">
                •
              </span>
              <span>Breathe normally through your nose.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-mono-num text-xs font-bold text-[#4338ca] mt-1.5 shrink-0">
                •
              </span>
              <span>
                Pick one spot to focus on: the air at your nostrils, or your belly rising and falling.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-mono-num text-xs font-bold text-[#4338ca] mt-1.5 shrink-0">
                •
              </span>
              <span>
                Silently count each out-breath from 1 to 10, then start over. If you lose count, just begin again at 1.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="font-mono-num text-xs font-bold text-[#4338ca] mt-1.5 shrink-0">
                •
              </span>
              <span>
                Your mind will wander. That is normal and part of the practice. When you notice, gently bring your attention back to the breath without scolding yourself. Each time you notice and return, you are strengthening your attention.
              </span>
            </li>
          </ul>

          {/* Gentle Interactive 1-10 Breath Counter Helper */}
          <div className="mt-6 pt-5 border-t border-[#dce4ff] flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#4338ca]">
                Practice Breath Counter (1 to 10)
              </p>
              <p className="text-xs text-[#4b7476] mt-0.5">
                Tap gently on each exhale if you want an anchor before closing your eyes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBreathCount((c) => (c >= 10 ? 1 : c + 1))}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#c7d2fe] hover:bg-[#eef2ff] text-[#0f3d3e] text-xs font-semibold transition-colors inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
              >
                <span>Out-breath</span>
                <span className="font-mono-num text-sm font-bold text-[#4338ca]">
                  {breathCount} / 10
                </span>
              </button>
              <button
                type="button"
                onClick={() => setBreathCount(1)}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#dce4ff] hover:bg-[#f5f7ff] text-xs font-semibold text-[#4b7476] hover:text-[#0f3d3e] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
              >
                Start at 1
              </button>
            </div>
          </div>
        </article>

        {/* Minute 5-6: Widen and close */}
        <article
          className={`rounded-2xl border bg-gradient-to-br p-6 sm:p-7 transition-all ${
            MEDITATION_PHASES[2].tintClass
          } ${
            activePhase.id === 'widen' && !hasCompleted
              ? 'ring-2 ring-[#ea580c]/35'
              : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="font-mono-num text-xs font-semibold text-[#c2410c]">
              03 · Final Minute
            </span>
            {activePhase.id === 'widen' && isRunning && (
              <span className="text-xs font-semibold text-[#c2410c]">Current Stage</span>
            )}
          </div>
          <h3 className="font-serif-elegant text-2xl font-bold text-[#0f3d3e] mb-3">
            Minute 5-6: Widen and close
          </h3>
          <p className="text-[#2c5253] text-base leading-relaxed">
            Let go of the counting. Notice the sounds in the room and how your body feels. Then open your eyes slowly.
          </p>
        </article>
      </section>

      {/* Optional Slow-Breathing Variation */}
      <section className="rounded-2xl border border-[#bae6fd] bg-gradient-to-br from-[#f0f9ff] via-[#ffffff] to-[#e0f2fe] p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold text-[#0369a1]">
              Calm Rhythm · ~6 Breaths per Minute
            </p>
            <h3 className="font-serif-elegant text-xl sm:text-2xl font-bold text-[#0f3d3e]">
              Optional slow-breathing variation
            </h3>
            <p className="text-[#2c5253] text-base leading-relaxed">
              If you feel anxious, such as before an exam, breathe in for about 4 seconds and out for about 6. A slow rate of roughly 6 breaths per minute is linked to calmer heart-rate patterns and reduced stress.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPaceMode('slow-4-6');
              if (!isRunning) {
                setRemainingSeconds(TOTAL_SECONDS);
                setHasCompleted(false);
                prevElapsedRef.current = 0;
              }
            }}
            className={`shrink-0 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] ${
              paceMode === 'slow-4-6'
                ? 'bg-[#0369a1] text-white'
                : 'bg-white border border-[#bae6fd] text-[#0369a1] hover:bg-[#e0f2fe]'
            }`}
          >
            {paceMode === 'slow-4-6' ? '4s / 6s Pace Active' : 'Use 4s In · 6s Out Pace'}
          </button>
        </div>
      </section>

      {/* What the Research Says */}
      <section className="rounded-2xl border border-[#cce7e3] bg-white p-6 sm:p-7">
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#0f766e] mb-1">Evidence & Perspective</p>
          <h3 className="font-serif-elegant text-2xl font-bold text-[#0f3d3e]">
            What the research says
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RESEARCH_POINTS.map((point) => (
            <div
              key={point.index}
              className="rounded-xl border border-[#dcefed] bg-[#f7fcfb] p-5 flex flex-col justify-between"
            >
              <span className="font-mono-num text-xs font-bold text-[#0d9488] mb-3">
                {point.index}
              </span>
              <p className="text-sm text-[#2c5253] leading-relaxed">{point.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tips for Beginners */}
      <section className="rounded-2xl border border-[#fde68a] bg-gradient-to-br from-[#fefce8] via-[#ffffff] to-[#fff7ed] p-6 sm:p-7">
        <p className="text-xs font-semibold text-[#a16207] mb-1">Daily Habit Guidance</p>
        <h3 className="font-serif-elegant text-xl sm:text-2xl font-bold text-[#0f3d3e] mb-3">
          Tips for beginners
        </h3>
        <p className="text-[#2c5253] text-base leading-relaxed">
          Practice at the same time daily, such as before study or before bed. Don&apos;t aim for a &ldquo;blank mind,&rdquo; because the goal is simply noticing where your attention is. If you feel persistently overwhelmed or very anxious, talk to a school counselor or a trusted adult as well.
        </p>
      </section>
    </div>
  );
};

export default SixMinuteMeditation;
