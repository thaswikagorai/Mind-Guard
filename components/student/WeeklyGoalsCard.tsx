import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import {
  MindfulnessStickerDefinition,
  UnlockedStickerRecord,
  WeeklyWellnessGoal,
} from '../../types';
import {
  GOALS_UPDATED_EVENT,
  GOAL_CATEGORIES,
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
import { CheckIcon, PlusIcon } from '../icons';

interface WeeklyGoalsCardProps {
  onManageGoals: () => void;
  onOpenStickers?: () => void;
}

const WeeklyGoalsCard: React.FC<WeeklyGoalsCardProps> = ({
  onManageGoals,
  onOpenStickers,
}) => {
  const [goals, setGoals] = useState<WeeklyWellnessGoal[]>(() => loadWeeklyGoals());
  const [stickerRecords, setStickerRecords] = useState<Record<string, UnlockedStickerRecord>>(
    () => loadUnlockedStickers()
  );
  const [newlyUnlocked, setNewlyUnlocked] = useState<MindfulnessStickerDefinition[]>([]);

  useEffect(() => {
    const syncGoals = () => {
      const loaded = loadWeeklyGoals();
      setGoals(loaded);
      const evaluated = evaluateAndUnlockStickers(loaded);
      setStickerRecords(evaluated.records);
      if (evaluated.newlyUnlocked.length > 0) {
        setNewlyUnlocked(evaluated.newlyUnlocked);
      }
    };
    syncGoals();
    window.addEventListener(GOALS_UPDATED_EVENT, syncGoals);
    window.addEventListener('storage', syncGoals);
    window.addEventListener('focus', syncGoals);
    return () => {
      window.removeEventListener(GOALS_UPDATED_EVENT, syncGoals);
      window.removeEventListener('storage', syncGoals);
      window.removeEventListener('focus', syncGoals);
    };
  }, []);

  const weekRange = getWeekRangeLabel(getCurrentWeekStart());
  const summary = computeWeeklyGoalSummary(goals);
  const unlockedCount = Object.keys(stickerRecords).length;
  const totalStickers = MINDFULNESS_STICKERS.length;

  const handleQuickIncrement = (goalId: string) => {
    const updated = goals.map((goal) => {
      if (goal.id !== goalId) return goal;
      const isComplete = goal.currentCount >= goal.targetCount;
      const nextCount = isComplete
        ? Math.max(0, goal.targetCount - 1)
        : Math.min(goal.targetCount, goal.currentCount + 1);
      return { ...goal, currentCount: nextCount };
    });
    setGoals(updated);
    saveWeeklyGoals(updated);

    const evaluated = evaluateAndUnlockStickers(updated);
    setStickerRecords(evaluated.records);
    if (evaluated.newlyUnlocked.length > 0) {
      setNewlyUnlocked(evaluated.newlyUnlocked);
    }
  };

  const ringSize = 54;
  const strokeWidth = 5;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (summary.overallPercent / 100) * circumference;

  const visibleGoals = goals.slice(0, 3);
  const previewStickers = [
    ...MINDFULNESS_STICKERS.filter((s) => Boolean(stickerRecords[s.id])),
    ...MINDFULNESS_STICKERS.filter((s) => !stickerRecords[s.id]),
  ].slice(0, 5);

  const openAlbum = onOpenStickers || onManageGoals;

  return (
    <div className="space-y-2.5">
      {/* Unboxed Metadata Header Row */}
      <div className="flex items-center justify-between gap-2 px-0.5 text-xs text-[#4b7476]">
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span className="font-semibold text-[#0f3d3e] whitespace-nowrap">Weekly Goals</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{weekRange}</span>
        </div>

        <button
          type="button"
          onClick={onManageGoals}
          className="font-semibold text-[#0f766e] hover:text-[#0f3d3e] transition-colors whitespace-nowrap shrink-0 py-1"
        >
          Manage all →
        </button>
      </div>

      <Card className="bg-gradient-to-br from-white via-[#f2fcf9] to-[#eff9ff] border border-[#bde6de] p-5 rounded-2xl space-y-4">
        {/* Progress Ring & Summary Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 min-w-0">
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
                  stroke="#d9f2ed"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  fill="none"
                  stroke="url(#weeklyGoalRingGradient)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-300"
                />
                <defs>
                  <linearGradient id="weeklyGoalRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute text-xs font-bold font-mono-num text-[#0f3d3e]">
                {summary.overallPercent}%
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0f3d3e] font-mono-num">
                {summary.completedGoals} of {summary.totalGoals}{' '}
                {summary.totalGoals === 1 ? 'goal' : 'goals'} met
              </p>
              <p className="text-xs text-[#4b7476] mt-0.5 leading-snug">
                {summary.totalGoals === 0
                  ? 'Set one gentle goal for this week.'
                  : summary.completedGoals === summary.totalGoals
                  ? 'Every weekly goal reached. Well done!'
                  : 'Complete a goal to unlock mindfulness stickers.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onManageGoals}
            aria-label="Add weekly wellness goal"
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white flex items-center justify-center shrink-0 hover:brightness-105 transition-all"
            title="Add or manage goals"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Instant New Sticker Celebration Banner */}
        {newlyUnlocked.length > 0 && (
          <div
            role="status"
            aria-live="polite"
            className="p-3.5 rounded-2xl bg-gradient-to-r from-[#fffbeb] via-[#eefaf7] to-[#eff8ff] border border-[#fcd34d] flex items-center justify-between gap-3"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <MindfulnessStickerArt
                stickerId={newlyUnlocked[0].id}
                unlocked={true}
                size={46}
                label={newlyUnlocked[0].name}
              />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#b45309]">
                  {newlyUnlocked.length > 1
                    ? `${newlyUnlocked.length} Mindfulness Stickers Unlocked!`
                    : 'New Mindfulness Sticker Unlocked!'}
                </p>
                <p className="text-xs font-bold text-[#0f3d3e] truncate">
                  {newlyUnlocked.map((s) => s.name).join(' & ')}
                </p>
                <button
                  type="button"
                  onClick={openAlbum}
                  className="text-[11px] font-semibold text-[#0f766e] hover:underline mt-0.5"
                >
                  Open Sticker Album →
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNewlyUnlocked([])}
              aria-label="Dismiss sticker celebration"
              className="min-w-[36px] min-h-[36px] rounded-xl text-[#9a3412] hover:bg-white/80 flex items-center justify-center text-base shrink-0"
            >
              ×
            </button>
          </div>
        )}

        {/* Inline Trackable Goals List */}
        {visibleGoals.length > 0 ? (
          <div className="space-y-2.5 pt-1 border-t border-[#d9efec]">
            {visibleGoals.map((goal) => {
              const meta = GOAL_CATEGORIES[goal.category] || GOAL_CATEGORIES.mindfulness;
              const target = Math.max(1, goal.targetCount);
              const pct = Math.min(100, Math.round((goal.currentCount / target) * 100));
              const isDone = goal.currentCount >= target;

              return (
                <div key={goal.id} className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl ${meta.iconBg} flex items-center justify-center text-base shrink-0`}
                      aria-hidden="true"
                    >
                      {meta.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isDone ? 'text-[#059669]' : 'text-[#0f3d3e]'
                          }`}
                        >
                          {goal.title}
                        </p>
                        <span className="text-[11px] font-mono-num font-semibold text-[#4b7476] shrink-0">
                          {goal.currentCount}/{target} {goal.unit}
                        </span>
                      </div>
                      <div className="w-full bg-[#dff1ee] h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full bg-gradient-to-r ${meta.barGradient} transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickIncrement(goal.id)}
                    aria-label={
                      isDone
                        ? `Undo completion for ${goal.title}`
                        : `Log progress for ${goal.title}`
                    }
                    className={`min-w-[44px] min-h-[40px] px-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center justify-center border ${
                      isDone
                        ? 'bg-[#d1fae5] border-[#34d399] text-[#047857] hover:bg-[#a7f3d0]'
                        : 'bg-white border-[#bde6de] text-[#0f766e] hover:bg-[#e6faf6] hover:border-[#0d9488]'
                    }`}
                  >
                    {isDone ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <span className="font-mono-num">+1</span>
                    )}
                  </button>
                </div>
              );
            })}

            {goals.length > 3 && (
              <button
                type="button"
                onClick={onManageGoals}
                className="w-full pt-2 text-xs font-semibold text-[#0284c7] hover:text-[#0f3d3e] text-center transition-colors"
              >
                + {goals.length - 3} more {goals.length - 3 === 1 ? 'goal' : 'goals'} in Weekly Goals
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onManageGoals}
            className="w-full py-3 rounded-xl bg-[#e6faf6] border border-[#99e2d8] text-xs font-semibold text-[#0f766e] hover:bg-[#ccf7ef] transition-colors min-h-[44px]"
          >
            Set your first weekly goal
          </button>
        )}

        {/* Mindfulness Stickers Preview Strip */}
        <div className="pt-3 border-t border-[#d9efec] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="font-bold text-[#0f3d3e]">Mindfulness Stickers</span>
              <span className="text-[#8ab5b6]" aria-hidden="true">·</span>
              <span className="font-mono-num font-semibold text-[#0f766e]">
                {unlockedCount}/{totalStickers}
              </span>
            </div>
            <div className="flex items-center -space-x-1.5 mt-1.5">
              {previewStickers.map((sticker) => (
                <div
                  key={sticker.id}
                  title={
                    stickerRecords[sticker.id]
                      ? `${sticker.name} (Unlocked)`
                      : `${sticker.name} (Locked)`
                  }
                >
                  <MindfulnessStickerArt
                    stickerId={sticker.id}
                    unlocked={Boolean(stickerRecords[sticker.id])}
                    size={34}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={openAlbum}
            className="px-3.5 py-2 rounded-xl bg-[#eef2ff] hover:bg-[#e0e7ff] border border-[#c7d2fe] text-xs font-semibold text-[#3730a3] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
          >
            Sticker Album →
          </button>
        </div>
      </Card>
    </div>
  );
};

export default WeeklyGoalsCard;
