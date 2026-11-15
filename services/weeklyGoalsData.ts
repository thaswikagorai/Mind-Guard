import { WeeklyWellnessGoal, WellnessGoalCategory } from '../types';

const STORAGE_KEY = 'mindguard_weekly_goals';

export interface GoalCategoryMeta {
  id: WellnessGoalCategory;
  label: string;
  emoji: string;
  cardBg: string;
  iconBg: string;
  barGradient: string;
  accentText: string;
}

export const GOAL_CATEGORIES: Record<WellnessGoalCategory, GoalCategoryMeta> = {
  breathing: {
    id: 'breathing',
    label: 'Breathing',
    emoji: '🌬️',
    cardBg: 'bg-gradient-to-br from-white to-[#e6faf6] border-[#99e2d8]',
    iconBg: 'bg-[#ccf7ef] text-[#0f766e]',
    barGradient: 'from-[#14b8a6] to-[#0891b2]',
    accentText: 'text-[#0f766e]',
  },
  journaling: {
    id: 'journaling',
    label: 'Journaling',
    emoji: '✍️',
    cardBg: 'bg-gradient-to-br from-white to-[#fff7ed] border-[#fed7aa]',
    iconBg: 'bg-[#ffedd5] text-[#c2410c]',
    barGradient: 'from-[#f97316] to-[#f59e0b]',
    accentText: 'text-[#c2410c]',
  },
  movement: {
    id: 'movement',
    label: 'Movement',
    emoji: '🧘',
    cardBg: 'bg-gradient-to-br from-white to-[#ecfdf5] border-[#a7f3d0]',
    iconBg: 'bg-[#d1fae5] text-[#059669]',
    barGradient: 'from-[#10b981] to-[#14b8a6]',
    accentText: 'text-[#059669]',
  },
  mindfulness: {
    id: 'mindfulness',
    label: 'Mindfulness',
    emoji: '✨',
    cardBg: 'bg-gradient-to-br from-white to-[#eef2ff] border-[#c7d2fe]',
    iconBg: 'bg-[#e0e7ff] text-[#4f46e5]',
    barGradient: 'from-[#6366f1] to-[#0284c7]',
    accentText: 'text-[#4f46e5]',
  },
  sleep: {
    id: 'sleep',
    label: 'Rest & Calm',
    emoji: '🌙',
    cardBg: 'bg-gradient-to-br from-white to-[#eff8ff] border-[#bae6fd]',
    iconBg: 'bg-[#e0f2fe] text-[#0284c7]',
    barGradient: 'from-[#0ea5e9] to-[#6366f1]',
    accentText: 'text-[#0284c7]',
  },
};

export interface GoalPreset {
  title: string;
  category: WellnessGoalCategory;
  targetCount: number;
  unit: string;
}

export const WEEKLY_GOAL_PRESETS: GoalPreset[] = [
  { title: 'Practice breathing for 5 minutes', category: 'breathing', targetCount: 5, unit: 'mins' },
  { title: 'Journal once this week', category: 'journaling', targetCount: 1, unit: 'entry' },
  { title: 'Do a gentle 10-min stretch break', category: 'movement', targetCount: 3, unit: 'breaks' },
  { title: 'Complete a stress check-in', category: 'mindfulness', targetCount: 2, unit: 'check-ins' },
  { title: 'Listen to calming music before sleep', category: 'sleep', targetCount: 3, unit: 'nights' },
  { title: 'Read 3 daily affirmations', category: 'mindfulness', targetCount: 3, unit: 'days' },
];

export function getCurrentWeekStart(referenceDate: Date = new Date()): string {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 = Sun, 1 = Mon...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getWeekRangeLabel(weekStartIso: string): string {
  const [y, m, d] = weekStartIso.split('-').map(Number);
  const start = new Date(y, (m || 1) - 1, d || 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} – ${endStr}`;
}

function createStarterGoals(weekStart: string): WeeklyWellnessGoal[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'starter-breathing',
      title: 'Practice breathing for 5 minutes',
      category: 'breathing',
      targetCount: 5,
      currentCount: 0,
      unit: 'mins',
      weekStart,
      createdAt: now,
    },
    {
      id: 'starter-journal',
      title: 'Journal once',
      category: 'journaling',
      targetCount: 1,
      currentCount: 0,
      unit: 'entry',
      weekStart,
      createdAt: now,
    },
    {
      id: 'starter-stretch',
      title: 'Take a screen-free stretch break',
      category: 'movement',
      targetCount: 3,
      currentCount: 0,
      unit: 'breaks',
      weekStart,
      createdAt: now,
    },
  ];
}

export function loadWeeklyGoals(): WeeklyWellnessGoal[] {
  const currentWeek = getCurrentWeekStart();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const starters = createStarterGoals(currentWeek);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starters));
      return starters;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      const starters = createStarterGoals(currentWeek);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starters));
      return starters;
    }

    // Roll over to a fresh week while keeping the student's chosen goal list
    let didRollOver = false;
    const normalized: WeeklyWellnessGoal[] = parsed.map((g: WeeklyWellnessGoal) => {
      if (g.weekStart !== currentWeek) {
        didRollOver = true;
        return {
          ...g,
          currentCount: 0,
          weekStart: currentWeek,
        };
      }
      return g;
    });

    if (didRollOver) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch {
    return createStarterGoals(currentWeek);
  }
}

export function saveWeeklyGoals(goals: WeeklyWellnessGoal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch {
    // ignore storage quota failures
  }
}

export interface WeeklyGoalSummary {
  totalGoals: number;
  completedGoals: number;
  overallPercent: number;
}

export function computeWeeklyGoalSummary(goals: WeeklyWellnessGoal[]): WeeklyGoalSummary {
  if (goals.length === 0) {
    return { totalGoals: 0, completedGoals: 0, overallPercent: 0 };
  }

  let completedGoals = 0;
  let progressSum = 0;

  for (const goal of goals) {
    const target = Math.max(1, goal.targetCount);
    const ratio = Math.min(1, Math.max(0, goal.currentCount / target));
    progressSum += ratio;
    if (goal.currentCount >= target) {
      completedGoals += 1;
    }
  }

  return {
    totalGoals: goals.length,
    completedGoals,
    overallPercent: Math.round((progressSum / goals.length) * 100),
  };
}
