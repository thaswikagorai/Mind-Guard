import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import {
  MindfulnessStickerDefinition,
  UnlockedStickerRecord,
  WeeklyWellnessGoal,
  WellnessGoalCategory,
} from '../../types';
import {
  GOALS_UPDATED_EVENT,
  GOAL_CATEGORIES,
  GoalPreset,
  WEEKLY_GOAL_PRESETS,
  computeWeeklyGoalSummary,
  getCurrentWeekStart,
  getWeekRangeLabel,
  loadWeeklyGoals,
  saveWeeklyGoals,
} from '../../services/weeklyGoalsData';
import {
  MINDFULNESS_STICKERS,
  evaluateAndUnlockStickers,
  loadUnlockedStickers,
} from '../../services/mindfulnessStickersData';
import MindfulnessStickerArt from './MindfulnessStickerArt';
import {
  CheckCircleIcon,
  CheckIcon,
  ChevronLeftIcon,
  MinusIcon,
  PlusIcon,
  RefreshIcon,
  SparklesIcon,
  TrashIcon,
} from '../icons';

interface WeeklyGoalsProps {
  onBack: () => void;
  initialTab?: 'goals' | 'stickers';
}

const UNIT_OPTIONS = ['mins', 'sessions', 'entry', 'breaks', 'days', 'nights'];

const WeeklyGoals: React.FC<WeeklyGoalsProps> = ({ onBack, initialTab = 'goals' }) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'stickers'>(initialTab);
  const [goals, setGoals] = useState<WeeklyWellnessGoal[]>(() => loadWeeklyGoals());
  const [stickerRecords, setStickerRecords] = useState<Record<string, UnlockedStickerRecord>>(
    () => loadUnlockedStickers()
  );
  const [newlyUnlocked, setNewlyUnlocked] = useState<MindfulnessStickerDefinition[]>([]);
  const [stickerFilter, setStickerFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedSticker, setSelectedSticker] = useState<MindfulnessStickerDefinition | null>(null);

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<WellnessGoalCategory>('breathing');
  const [targetCountStr, setTargetCountStr] = useState<string>('3');
  const [unit, setUnit] = useState<string>('sessions');
  const [formError, setFormError] = useState('');

  const weekStart = getCurrentWeekStart();
  const weekRange = getWeekRangeLabel(weekStart);
  const summary = computeWeeklyGoalSummary(goals);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const syncGoalsAndStickers = () => {
      const freshGoals = loadWeeklyGoals();
      setGoals(freshGoals);
      const evaluated = evaluateAndUnlockStickers(freshGoals, getCurrentWeekStart());
      setStickerRecords(evaluated.records);
    };
    syncGoalsAndStickers();
    window.addEventListener(GOALS_UPDATED_EVENT, syncGoalsAndStickers);
    window.addEventListener('storage', syncGoalsAndStickers);
    window.addEventListener('focus', syncGoalsAndStickers);
    return () => {
      window.removeEventListener(GOALS_UPDATED_EVENT, syncGoalsAndStickers);
      window.removeEventListener('storage', syncGoalsAndStickers);
      window.removeEventListener('focus', syncGoalsAndStickers);
    };
  }, []);

  useEffect(() => {
    if (!selectedSticker && !isAddingCustom) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedSticker) setSelectedSticker(null);
        if (isAddingCustom) setIsAddingCustom(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSticker, isAddingCustom]);

  const updateGoals = (next: WeeklyWellnessGoal[]) => {
    setGoals(next);
    saveWeeklyGoals(next);

    const evaluated = evaluateAndUnlockStickers(next, weekStart);
    setStickerRecords(evaluated.records);
    if (evaluated.newlyUnlocked.length > 0) {
      setNewlyUnlocked(evaluated.newlyUnlocked);
    }
  };

  const handleStep = (goalId: string, delta: number) => {
    const next = goals.map((goal) => {
      if (goal.id !== goalId) return goal;
      const nextCount = Math.max(0, Math.min(goal.targetCount, goal.currentCount + delta));
      return { ...goal, currentCount: nextCount };
    });
    updateGoals(next);
  };

  const handleToggleComplete = (goalId: string) => {
    const next = goals.map((goal) => {
      if (goal.id !== goalId) return goal;
      const isComplete = goal.currentCount >= goal.targetCount;
      return { ...goal, currentCount: isComplete ? 0 : goal.targetCount };
    });
    updateGoals(next);
  };

  const handleDeleteGoal = (goalId: string) => {
    updateGoals(goals.filter((g) => g.id !== goalId));
  };

  const handleResetWeek = () => {
    const next = goals.map((g) => ({
      ...g,
      currentCount: 0,
      weekStart,
    }));
    updateGoals(next);
  };

  const handleAddPreset = (preset: GoalPreset) => {
    const alreadyExists = goals.some(
      (g) => g.title.trim().toLowerCase() === preset.title.trim().toLowerCase()
    );
    if (alreadyExists) return;

    const newGoal: WeeklyWellnessGoal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: preset.title,
      category: preset.category,
      targetCount: preset.targetCount,
      currentCount: 0,
      unit: preset.unit,
      weekStart,
      createdAt: new Date().toISOString(),
    };
    updateGoals([newGoal, ...goals]);
  };

  const handleCreateCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length < 3) {
      setFormError('Please enter a short goal description (at least 3 characters).');
      return;
    }

    const safeTarget = Math.max(1, Math.min(60, Number(targetCountStr) || 1));
    const newGoal: WeeklyWellnessGoal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      category,
      targetCount: safeTarget,
      currentCount: 0,
      unit: unit.trim() || 'times',
      weekStart,
      createdAt: new Date().toISOString(),
    };

    updateGoals([newGoal, ...goals]);
    setTitle('');
    setCategory('breathing');
    setTargetCountStr('3');
    setUnit('sessions');
    setFormError('');
    setIsAddingCustom(false);
  };

  const ringSize = 68;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (summary.overallPercent / 100) * circumference;

  const hasProgress = goals.some((g) => g.currentCount > 0);
  const unlockedCount = Object.keys(stickerRecords).length;
  const totalStickers = MINDFULNESS_STICKERS.length;
  const stickerProgressPct = Math.round((unlockedCount / totalStickers) * 100);

  const filteredStickers = MINDFULNESS_STICKERS.filter((sticker) => {
    const isUnlocked = Boolean(stickerRecords[sticker.id]);
    if (stickerFilter === 'unlocked') return isUnlocked;
    if (stickerFilter === 'locked') return !isUnlocked;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-gradient-to-b from-[#eefaf7] via-[#f4fbff] to-[#fff8f4] overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full space-y-5 pb-10">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center min-w-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl hover:bg-[#e3f7f3] text-[#4b7476] hover:text-[#0f3d3e] transition-colors mr-2 flex items-center justify-center shrink-0"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0f3d3e] font-serif-elegant leading-tight truncate">
                Weekly Goals &amp; Stickers
              </h1>
              <p className="text-xs font-medium text-[#0f766e] mt-0.5 truncate">
                This week · {weekRange}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError('');
              setIsAddingCustom(true);
            }}
            className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white font-semibold px-4 py-2.5 rounded-xl hover:brightness-105 transition-all text-xs min-h-[44px] whitespace-nowrap shrink-0 shadow-xs"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        </header>

        {/* Weekly Overview Card */}
        <Card className="bg-gradient-to-r from-[#0d9488] via-[#14b8a6] to-[#0284c7] text-white border-none p-5 sm:p-6 rounded-3xl shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div
                className="relative flex items-center justify-center shrink-0"
                style={{ width: ringSize, height: ringSize }}
              >
                <svg width={ringSize} height={ringSize} className="-rotate-90" aria-hidden="true">
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth={strokeWidth}
                  />
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute text-sm font-bold font-mono-num text-white">
                  {summary.overallPercent}%
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#ccf7ef]">
                  Weekly Progress · {unlockedCount}/{totalStickers} stickers earned
                </p>
                <h2 className="text-xl sm:text-2xl font-bold font-serif-elegant text-balance">
                  <span className="font-mono-num">{summary.completedGoals}</span> of{' '}
                  <span className="font-mono-num">{summary.totalGoals}</span>{' '}
                  {summary.totalGoals === 1 ? 'goal' : 'goals'} completed
                </h2>
                <p className="text-xs sm:text-sm text-[#ebfffb] mt-0.5">
                  Meet weekly wellness goals to unlock cheerful mindfulness stickers.
                </p>
              </div>
            </div>

            {hasProgress && (
              <button
                type="button"
                onClick={handleResetWeek}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/25 px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap min-h-[40px]"
              >
                <RefreshIcon className="w-3.5 h-3.5" />
                <span>Reset Week</span>
              </button>
            )}
          </div>
        </Card>

        {/* Celebratory New Sticker Banner */}
        {newlyUnlocked.length > 0 && (
          <Card className="rounded-3xl border border-[#fcd34d] bg-gradient-to-r from-[#fffbeb] via-[#eefaf7] to-[#eff8ff] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5 min-w-0">
              <MindfulnessStickerArt
                stickerId={newlyUnlocked[0].id}
                unlocked={true}
                size={62}
                label={newlyUnlocked[0].name}
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#b45309]">
                  {newlyUnlocked.length > 1
                    ? `${newlyUnlocked.length} New Mindfulness Stickers Unlocked!`
                    : 'New Mindfulness Sticker Unlocked!'}
                </p>
                <h3 className="text-base font-bold text-[#0f3d3e] font-serif-elegant">
                  {newlyUnlocked.map((s) => s.name).join(' & ')}
                </h3>
                <p className="text-xs text-[#335c5d] mt-0.5">{newlyUnlocked[0].tagline}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {activeTab !== 'stickers' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('stickers')}
                  className="px-3.5 py-2 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold whitespace-nowrap min-h-[40px]"
                >
                  View Sticker Album
                </button>
              )}
              <button
                type="button"
                onClick={() => setNewlyUnlocked([])}
                className="px-3 py-2 rounded-xl bg-white border border-[#cce7e3] text-xs font-semibold text-[#335c5d] hover:bg-[#f4fbfa] min-h-[40px]"
              >
                Dismiss
              </button>
            </div>
          </Card>
        )}

        {/* Segmented Goals / Sticker Album Switch */}
        <div
          role="tablist"
          aria-label="Weekly goals and sticker album views"
          className="grid grid-cols-2 gap-1.5 p-1.5 bg-[#e3f5f1] border border-[#bde6de] rounded-2xl"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'goals'}
            onClick={() => setActiveTab('goals')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[44px] ${
              activeTab === 'goals'
                ? 'bg-white text-[#0f3d3e] shadow-xs'
                : 'text-[#3d6b6d] hover:text-[#0f3d3e]'
            }`}
          >
            Weekly Goals ({goals.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'stickers'}
            onClick={() => setActiveTab('stickers')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center space-x-1.5 ${
              activeTab === 'stickers'
                ? 'bg-white text-[#0f3d3e] shadow-xs'
                : 'text-[#3d6b6d] hover:text-[#0f3d3e]'
            }`}
          >
            <SparklesIcon className="w-4 h-4 text-[#0d9488]" />
            <span>Sticker Album ({unlockedCount}/{totalStickers})</span>
          </button>
        </div>

        {/* TAB 1: WEEKLY GOALS */}
        {activeTab === 'goals' && (
          <>
            <section className="space-y-3">
              <div className="flex items-baseline justify-between px-0.5">
                <h2 className="text-base font-bold text-[#0f3d3e] font-serif-elegant">
                  Your Goals This Week
                </h2>
                <span className="text-xs text-[#4b7476] font-mono-num">{goals.length} active</span>
              </div>

              {goals.length === 0 ? (
                <Card className="bg-white border border-[#bde6de] rounded-2xl p-8 text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#ccf7ef] to-[#e0f2fe] flex items-center justify-center text-3xl">
                    🌱
                  </div>
                  <h3 className="text-lg font-bold text-[#0f3d3e] font-serif-elegant">
                    Start with one small goal
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4b7476] max-w-sm mx-auto leading-relaxed">
                    Pick a quick suggestion below or create your own achievable wellness goal to start unlocking stickers.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {goals.map((goal) => {
                    const meta = GOAL_CATEGORIES[goal.category] || GOAL_CATEGORIES.mindfulness;
                    const target = Math.max(1, goal.targetCount);
                    const pct = Math.min(100, Math.round((goal.currentCount / target) * 100));
                    const isDone = goal.currentCount >= target;

                    return (
                      <Card
                        key={goal.id}
                        className={`border rounded-2xl p-4 sm:p-5 space-y-3.5 ${meta.cardBg}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3.5 min-w-0">
                            <div
                              className={`w-11 h-11 rounded-xl ${meta.iconBg} flex items-center justify-center text-xl shrink-0`}
                              aria-hidden="true"
                            >
                              {meta.emoji}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className={`font-semibold ${meta.accentText}`}>
                                  {meta.label}
                                </span>
                                {isDone && (
                                  <>
                                    <span className="text-[#8ab5b6]" aria-hidden="true">·</span>
                                    <span className="inline-flex items-center space-x-1 font-semibold text-[#059669]">
                                      <CheckCircleIcon className="w-3.5 h-3.5" />
                                      <span>Completed</span>
                                    </span>
                                  </>
                                )}
                              </div>
                              <h3 className="text-base font-bold text-[#0f3d3e] mt-0.5 leading-snug">
                                {goal.title}
                              </h3>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(goal.id)}
                            aria-label={`Delete goal ${goal.title}`}
                            className="min-w-[40px] min-h-[40px] -mt-1 -mr-1 rounded-xl text-[#7ca1a3] hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center shrink-0"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-mono-num font-bold text-[#0f3d3e]">
                              {goal.currentCount} / {target} {goal.unit}
                            </span>
                            <span className="font-mono-num font-semibold text-[#4b7476]">
                              {pct}%
                            </span>
                          </div>
                          <div className="w-full bg-white/90 border border-[#dcefeb] h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full bg-gradient-to-r ${meta.barGradient} transition-all duration-300`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleStep(goal.id, -1)}
                              disabled={goal.currentCount <= 0}
                              aria-label={`Decrease progress for ${goal.title}`}
                              className="min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#bde6de] text-[#335c5d] hover:bg-[#e6faf6] disabled:opacity-40 transition-colors flex items-center justify-center"
                            >
                              <MinusIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStep(goal.id, 1)}
                              disabled={isDone}
                              aria-label={`Add 1 ${goal.unit} to ${goal.title}`}
                              className="min-w-[44px] min-h-[44px] px-3.5 rounded-xl bg-white border border-[#bde6de] text-[#0f766e] hover:bg-[#e6faf6] disabled:opacity-40 transition-colors flex items-center justify-center space-x-1 text-xs font-bold font-mono-num"
                            >
                              <PlusIcon className="w-4 h-4" />
                              <span>1</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleComplete(goal.id)}
                            className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                              isDone
                                ? 'bg-[#d1fae5] text-[#047857] border border-[#34d399] hover:bg-[#a7f3d0]'
                                : 'bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white hover:brightness-105'
                            }`}
                          >
                            <CheckIcon className="w-4 h-4" />
                            <span>{isDone ? 'Completed' : 'Mark Complete'}</span>
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="px-0.5">
                <h2 className="text-base font-bold text-[#0f3d3e] font-serif-elegant">
                  Quick-Add Weekly Ideas
                </h2>
                <p className="text-xs text-[#4b7476]">
                  Tap any small, achievable habit to add it to your week.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {WEEKLY_GOAL_PRESETS.map((preset) => {
                  const meta = GOAL_CATEGORIES[preset.category];
                  const isAdded = goals.some(
                    (g) => g.title.trim().toLowerCase() === preset.title.trim().toLowerCase()
                  );

                  return (
                    <button
                      type="button"
                      key={preset.title}
                      onClick={() => handleAddPreset(preset)}
                      disabled={isAdded}
                      className={`text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 min-h-[56px] ${
                        isAdded
                          ? 'bg-[#eaf6f4]/70 border-[#cce7e3] opacity-65 cursor-default'
                          : 'bg-white border-[#bde6de] hover:border-[#0d9488] hover:bg-[#f4fbfa]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span
                          className={`w-9 h-9 rounded-xl ${meta.iconBg} flex items-center justify-center text-base shrink-0`}
                          aria-hidden="true"
                        >
                          {meta.emoji}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-[#0f3d3e] truncate">
                            {preset.title}
                          </p>
                          <p className="text-[11px] text-[#4b7476] font-mono-num">
                            Target: {preset.targetCount} {preset.unit}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold shrink-0 whitespace-nowrap ${
                          isAdded ? 'text-[#059669]' : 'text-[#0f766e]'
                        }`}
                      >
                        {isAdded ? 'Added ✓' : '+ Add'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* TAB 2: MINDFULNESS STICKER ALBUM */}
        {activeTab === 'stickers' && (
          <section className="space-y-4">
            <Card className="bg-white border border-[#bde6de] rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0f3d3e] font-serif-elegant">
                    Mindfulness Sticker Collection
                  </h2>
                  <p className="text-xs text-[#4b7476]">
                    Collect all {totalStickers} digital stickers by completing weekly wellness habits.
                  </p>
                </div>

                {/* Filter Segmented Control */}
                <div className="flex items-center gap-1 p-1 bg-[#eefaf7] border border-[#cce7e3] rounded-xl">
                  {(['all', 'unlocked', 'locked'] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      type="button"
                      onClick={() => setStickerFilter(filterKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                        stickerFilter === filterKey
                          ? 'bg-white text-[#0f3d3e] shadow-xs'
                          : 'text-[#4b7476] hover:text-[#0f3d3e]'
                      }`}
                    >
                      {filterKey === 'all'
                        ? `All (${totalStickers})`
                        : filterKey === 'unlocked'
                        ? `Unlocked (${unlockedCount})`
                        : `To Unlock (${totalStickers - unlockedCount})`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#0f3d3e]">Collection Progress</span>
                  <span className="font-mono-num font-bold text-[#0f766e]">
                    {unlockedCount} / {totalStickers} ({stickerProgressPct}%)
                  </span>
                </div>
                <div className="w-full bg-[#e6faf6] border border-[#cce7e3] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-[#14b8a6] via-[#0284c7] to-[#6366f1] transition-all duration-300"
                    style={{ width: `${stickerProgressPct}%` }}
                  />
                </div>
              </div>
            </Card>

            {filteredStickers.length === 0 ? (
              <Card className="bg-white border border-[#cce7e3] rounded-2xl p-8 text-center space-y-2">
                <p className="text-sm font-bold text-[#0f3d3e]">
                  {stickerFilter === 'unlocked'
                    ? 'No stickers unlocked yet — complete one weekly goal to earn First Bloom!'
                    : 'Amazing! You unlocked every single mindfulness sticker.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('goals')}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#0d9488] text-white text-xs font-semibold min-h-[40px]"
                >
                  Go to Weekly Goals
                </button>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {filteredStickers.map((sticker) => {
                  const record = stickerRecords[sticker.id];
                  const isUnlocked = Boolean(record);

                  return (
                    <button
                      key={sticker.id}
                      type="button"
                      onClick={() => setSelectedSticker(sticker)}
                      className={`text-center p-4 rounded-2xl border transition-all flex flex-col items-center justify-between space-y-2.5 min-h-[188px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                        isUnlocked
                          ? `bg-gradient-to-b ${sticker.cardGradient} ${sticker.borderColor} hover:-translate-y-0.5 shadow-xs`
                          : 'bg-white/80 border-dashed border-[#bde6de] hover:border-[#0d9488] hover:bg-white'
                      }`}
                    >
                      <MindfulnessStickerArt
                        stickerId={sticker.id}
                        unlocked={isUnlocked}
                        size={82}
                        label={`${sticker.name} sticker`}
                      />
                      <div className="space-y-1 w-full">
                        <p className="text-xs sm:text-sm font-bold text-[#0f3d3e] truncate">
                          {sticker.name}
                        </p>
                        {isUnlocked && record ? (
                          <p className={`text-[11px] font-semibold font-mono-num ${sticker.accentText}`}>
                            Unlocked · {record.timesEarned}x
                          </p>
                        ) : (
                          <p className="text-[11px] text-[#4b7476] leading-snug line-clamp-2">
                            {sticker.howToEarn}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Sticker Detail Inspection Modal */}
      {selectedSticker && (
        <div
          className="fixed inset-0 bg-[#0f3d3e]/45 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelectedSticker(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl border border-[#bde6de] text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const record = stickerRecords[selectedSticker.id];
              const isUnlocked = Boolean(record);
              const alreadyHasSuggested =
                selectedSticker.suggestedGoal &&
                goals.some(
                  (g) =>
                    g.category === selectedSticker.suggestedGoal?.category &&
                    g.currentCount < g.targetCount
                );

              return (
                <>
                  <div className="flex justify-center pt-1">
                    <MindfulnessStickerArt
                      stickerId={selectedSticker.id}
                      unlocked={isUnlocked}
                      size={116}
                      label={selectedSticker.name}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#0f766e]">
                      {isUnlocked && record
                        ? `Unlocked ${new Date(record.unlockedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })} · Earned ${record.timesEarned}x`
                        : 'Locked Sticker'}
                    </p>
                    <h3 className="text-xl font-bold text-[#0f3d3e] font-serif-elegant">
                      {selectedSticker.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#335c5d] leading-relaxed">
                      {selectedSticker.tagline}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#f4fbfa] border border-[#cce7e3] text-xs text-[#335c5d]">
                    <span className="font-bold text-[#0f3d3e]">How to earn: </span>
                    {selectedSticker.howToEarn}
                  </div>

                  <div className="flex flex-col space-y-2 pt-1">
                    {!isUnlocked && selectedSticker.suggestedGoal && !alreadyHasSuggested && (
                      <button
                        type="button"
                        onClick={() => {
                          handleAddPreset(selectedSticker.suggestedGoal!);
                          setSelectedSticker(null);
                          setActiveTab('goals');
                        }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white text-xs font-semibold hover:brightness-105 min-h-[44px]"
                      >
                        Add Matching Goal to My Week
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedSticker(null)}
                      className="w-full py-3 rounded-xl bg-[#eaf6f4] text-[#0f3d3e] text-xs font-semibold hover:bg-[#d7f0ec] min-h-[44px]"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add Custom Goal Modal */}
      {isAddingCustom && (
        <div
          className="fixed inset-0 bg-[#0f3d3e]/40 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setIsAddingCustom(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-[#bde6de] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#0f3d3e] font-serif-elegant mb-1">
              Create Weekly Goal
            </h2>
            <p className="text-xs text-[#4b7476] mb-5">
              Pick something realistic you can feel good completing this week.
            </p>

            <form onSubmit={handleCreateCustomGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#335c5d] mb-1.5">
                  Goal description
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="Ex: Practice breathing for 5 minutes"
                  maxLength={80}
                  className="w-full px-4 py-3 bg-[#f4fbfa] border border-[#bde6de] rounded-xl text-sm text-[#0f3d3e] placeholder-[#7ca1a3] focus:outline-none focus:border-[#0d9488] focus:bg-white"
                  autoFocus
                />
                {formError && (
                  <p className="text-rose-600 text-xs mt-1.5 font-medium">{formError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#335c5d] mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(GOAL_CATEGORIES) as WellnessGoalCategory[]).map((catKey) => {
                    const meta = GOAL_CATEGORIES[catKey];
                    const selected = category === catKey;
                    return (
                      <button
                        type="button"
                        key={catKey}
                        onClick={() => setCategory(catKey)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors flex items-center space-x-1.5 min-h-[42px] ${
                          selected
                            ? `${meta.cardBg} border-[#0d9488] text-[#0f3d3e]`
                            : 'bg-white border-[#cce7e3] text-[#4b7476] hover:border-[#8cd3ca]'
                        }`}
                      >
                        <span aria-hidden="true">{meta.emoji}</span>
                        <span className="truncate">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#335c5d] mb-1.5">
                    Weekly target
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={targetCountStr}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setTargetCountStr('');
                        return;
                      }
                      const num = Number(val);
                      if (Number.isFinite(num)) {
                        setTargetCountStr(String(Math.min(60, Math.max(0, Math.trunc(num)))));
                      }
                    }}
                    onBlur={() => {
                      const parsed = Math.max(1, Math.min(60, Number(targetCountStr) || 1));
                      setTargetCountStr(String(parsed));
                    }}
                    className="w-full px-4 py-3 bg-[#f4fbfa] border border-[#bde6de] rounded-xl text-sm font-bold font-mono-num text-[#0f3d3e] focus:outline-none focus:border-[#0d9488] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#335c5d] mb-1.5">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-3 bg-[#f4fbfa] border border-[#bde6de] rounded-xl text-sm font-medium text-[#0f3d3e] focus:outline-none focus:border-[#0d9488] focus:bg-white"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="flex-1 py-3 bg-[#eaf6f4] text-[#0f3d3e] font-semibold rounded-xl hover:bg-[#d7f0ec] text-sm min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white font-semibold rounded-xl hover:brightness-105 text-sm min-h-[44px]"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyGoals;
