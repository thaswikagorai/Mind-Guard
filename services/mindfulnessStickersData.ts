import {
  MindfulnessStickerDefinition,
  MindfulnessStickerId,
  UnlockedStickerRecord,
  WeeklyWellnessGoal,
} from '../types';
import { getCurrentWeekStart } from './weeklyGoalsData';

const STICKER_STORAGE_KEY = 'mindguard_mindfulness_stickers';

export const MINDFULNESS_STICKERS: MindfulnessStickerDefinition[] = [
  {
    id: 'first_bloom',
    name: 'First Bloom',
    tagline: 'Every calm habit begins with one small promise kept.',
    howToEarn: 'Meet at least 1 weekly wellness goal.',
    category: 'milestone',
    cardGradient: 'from-white via-[#eefaf7] to-[#dff7f1]',
    borderColor: 'border-[#8ce0d2]',
    accentText: 'text-[#0f766e]',
  },
  {
    id: 'breeze_buddy',
    name: 'Breeze Buddy',
    tagline: 'Slow breaths turn crowded thoughts into open sky.',
    howToEarn: 'Complete a Breathing goal this week.',
    category: 'breathing',
    cardGradient: 'from-white via-[#effcf9] to-[#dcf7f5]',
    borderColor: 'border-[#7ddfd4]',
    accentText: 'text-[#0f766e]',
    suggestedGoal: {
      title: 'Practice breathing for 5 minutes',
      category: 'breathing',
      targetCount: 5,
      unit: 'mins',
    },
  },
  {
    id: 'ink_owl',
    name: 'Ink Owl',
    tagline: 'Putting thoughts on paper gives your mind room to breathe.',
    howToEarn: 'Complete a Journaling goal this week.',
    category: 'journaling',
    cardGradient: 'from-white via-[#fff9f0] to-[#ffeed9]',
    borderColor: 'border-[#fdba74]',
    accentText: 'text-[#c2410c]',
    suggestedGoal: {
      title: 'Journal once this week',
      category: 'journaling',
      targetCount: 1,
      unit: 'entry',
    },
  },
  {
    id: 'sunbeam_sprinter',
    name: 'Sunbeam Mover',
    tagline: 'Gentle stretching wakes up energy and softens tension.',
    howToEarn: 'Complete a Movement goal this week.',
    category: 'movement',
    cardGradient: 'from-white via-[#f0fdf7] to-[#dcfce7]',
    borderColor: 'border-[#86efac]',
    accentText: 'text-[#047857]',
    suggestedGoal: {
      title: 'Do a gentle 10-min stretch break',
      category: 'movement',
      targetCount: 3,
      unit: 'breaks',
    },
  },
  {
    id: 'lotus_spark',
    name: 'Lotus Spark',
    tagline: 'Noticing the present moment builds quiet inner steadiness.',
    howToEarn: 'Complete a Mindfulness goal this week.',
    category: 'mindfulness',
    cardGradient: 'from-white via-[#f4f6ff] to-[#e0e7ff]',
    borderColor: 'border-[#a5b4fc]',
    accentText: 'text-[#4338ca]',
    suggestedGoal: {
      title: 'Read 3 daily affirmations',
      category: 'mindfulness',
      targetCount: 3,
      unit: 'days',
    },
  },
  {
    id: 'moonbeam_drifter',
    name: 'Moonbeam Calm',
    tagline: 'Unplugging gently helps tomorrow feel lighter.',
    howToEarn: 'Complete a Rest & Calm goal this week.',
    category: 'sleep',
    cardGradient: 'from-white via-[#f0f9ff] to-[#e0f2fe]',
    borderColor: 'border-[#7dd3fc]',
    accentText: 'text-[#0369a1]',
    suggestedGoal: {
      title: 'Listen to calming music before sleep',
      category: 'sleep',
      targetCount: 3,
      unit: 'nights',
    },
  },
  {
    id: 'hat_trick_star',
    name: 'Steady Trio',
    tagline: 'Three steady habits in one week shows real care for yourself.',
    howToEarn: 'Complete 3 or more wellness goals in the same week.',
    category: 'milestone',
    cardGradient: 'from-white via-[#fffbeb] to-[#fef3c7]',
    borderColor: 'border-[#fcd34d]',
    accentText: 'text-[#b45309]',
  },
  {
    id: 'weekly_crown',
    name: 'Full Harmony',
    tagline: 'Balanced care across every goal you set for yourself.',
    howToEarn: 'Complete 100% of your weekly goals (at least 2 goals).',
    category: 'milestone',
    cardGradient: 'from-white via-[#fdf4ff] to-[#fae8ff]',
    borderColor: 'border-[#e879f9]',
    accentText: 'text-[#a21caf]',
  },
];

export const STICKER_BY_ID: Record<MindfulnessStickerId, MindfulnessStickerDefinition> =
  MINDFULNESS_STICKERS.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<MindfulnessStickerId, MindfulnessStickerDefinition>
  );

export function loadUnlockedStickers(): Record<string, UnlockedStickerRecord> {
  try {
    const raw = localStorage.getItem(STICKER_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, UnlockedStickerRecord>;
  } catch {
    return {};
  }
}

export function saveUnlockedStickers(records: Record<string, UnlockedStickerRecord>): void {
  try {
    localStorage.setItem(STICKER_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore storage quota errors
  }
}

export interface StickerEvaluationResult {
  records: Record<string, UnlockedStickerRecord>;
  newlyUnlocked: MindfulnessStickerDefinition[];
}

/**
 * Evaluates current weekly wellness goals and unlocks earned mindfulness stickers.
 * Prevents duplicate earning increments within the same calendar week.
 */
export function evaluateAndUnlockStickers(
  goals: WeeklyWellnessGoal[],
  referenceWeekStart?: string
): StickerEvaluationResult {
  const weekStart = referenceWeekStart || getCurrentWeekStart();
  const existing = loadUnlockedStickers();
  const nextRecords: Record<string, UnlockedStickerRecord> = { ...existing };
  const newlyUnlocked: MindfulnessStickerDefinition[] = [];

  const completedGoals = goals.filter(
    (goal) => goal.currentCount >= Math.max(1, goal.targetCount)
  );

  const earnedIds = new Set<MindfulnessStickerId>();

  if (completedGoals.length >= 1) {
    earnedIds.add('first_bloom');
  }
  if (completedGoals.length >= 3) {
    earnedIds.add('hat_trick_star');
  }
  if (goals.length >= 2 && completedGoals.length === goals.length) {
    earnedIds.add('weekly_crown');
  }

  for (const goal of completedGoals) {
    if (goal.category === 'breathing') earnedIds.add('breeze_buddy');
    if (goal.category === 'journaling') earnedIds.add('ink_owl');
    if (goal.category === 'movement') earnedIds.add('sunbeam_sprinter');
    if (goal.category === 'mindfulness') earnedIds.add('lotus_spark');
    if (goal.category === 'sleep') earnedIds.add('moonbeam_drifter');
  }

  const nowIso = new Date().toISOString();

  for (const id of earnedIds) {
    const current = nextRecords[id];
    if (!current) {
      nextRecords[id] = {
        stickerId: id,
        unlockedAt: nowIso,
        lastEarnedWeek: weekStart,
        timesEarned: 1,
      };
      newlyUnlocked.push(STICKER_BY_ID[id]);
    } else if (current.lastEarnedWeek !== weekStart) {
      nextRecords[id] = {
        ...current,
        lastEarnedWeek: weekStart,
        timesEarned: current.timesEarned + 1,
      };
    }
  }

  if (newlyUnlocked.length > 0 || Object.keys(nextRecords).length !== Object.keys(existing).length) {
    saveUnlockedStickers(nextRecords);
  } else {
    // Save if any timesEarned bumped on new week
    const changed = Array.from(earnedIds).some(
      (id) => existing[id]?.lastEarnedWeek !== nextRecords[id]?.lastEarnedWeek
    );
    if (changed) {
      saveUnlockedStickers(nextRecords);
    }
  }

  return {
    records: nextRecords,
    newlyUnlocked,
  };
}
