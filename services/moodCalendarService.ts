import {
  BerkeleyQuizResult,
  CalendarMoodKey,
  DailyMoodSummary,
  JournalEntry,
  Mood,
  MoodLogEntry,
  MoodLogSource,
} from '../types';

const CALENDAR_STORAGE_KEY = 'mindguard_mood_calendar_logs';
const JOURNAL_STORAGE_KEY = 'mindguard_journal_entries';
const BERKELEY_STORAGE_KEY = 'mindguard_berkeley_quiz_results';
export const MOOD_UPDATED_EVENT = 'mindguard:mood-updated';

export interface MoodPaletteMeta {
  key: CalendarMoodKey;
  label: string;
  emoji: string;
  cellClass: string;
  selectedBorderClass: string;
  swatchClass: string;
  textAccentClass: string;
}

export const CALENDAR_MOOD_META: Record<CalendarMoodKey, MoodPaletteMeta> = {
  happy: {
    key: 'happy',
    label: 'Happy',
    emoji: '😊',
    cellClass: 'bg-[#a7f3d0] border-[#34d399] text-[#064e3b] hover:bg-[#86efac]',
    selectedBorderClass: 'ring-2 ring-[#059669] ring-offset-1',
    swatchClass: 'bg-[#34d399]',
    textAccentClass: 'text-[#047857]',
  },
  calm: {
    key: 'calm',
    label: 'Calm',
    emoji: '😌',
    cellClass: 'bg-[#bae6fd] border-[#38bdf8] text-[#0c4a6e] hover:bg-[#93c5fd]/70',
    selectedBorderClass: 'ring-2 ring-[#0284c7] ring-offset-1',
    swatchClass: 'bg-[#38bdf8]',
    textAccentClass: 'text-[#0369a1]',
  },
  tired: {
    key: 'tired',
    label: 'Tired',
    emoji: '😴',
    cellClass: 'bg-[#ddd6fe] border-[#a78bfa] text-[#4c1d95] hover:bg-[#c4b5fd]',
    selectedBorderClass: 'ring-2 ring-[#7c3aed] ring-offset-1',
    swatchClass: 'bg-[#a78bfa]',
    textAccentClass: 'text-[#6d28d9]',
  },
  stressed: {
    key: 'stressed',
    label: 'Stressed',
    emoji: '😟',
    cellClass: 'bg-[#fed7aa] border-[#fb923c] text-[#7c2d12] hover:bg-[#fdba74]',
    selectedBorderClass: 'ring-2 ring-[#ea580c] ring-offset-1',
    swatchClass: 'bg-[#fb923c]',
    textAccentClass: 'text-[#c2410c]',
  },
};

export const ORDERED_CALENDAR_MOODS: CalendarMoodKey[] = ['happy', 'calm', 'tired', 'stressed'];

export function toLocalDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function fromDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function parseEntryDateKey(rawId?: string, rawDateStr?: string): { dateKey: string; timestamp: number } | null {
  if (rawId && /^\d{12,15}$/.test(rawId)) {
    const ms = Number(rawId);
    if (Number.isFinite(ms) && ms > 0) {
      return { dateKey: toLocalDateKey(new Date(ms)), timestamp: ms };
    }
  }
  if (rawDateStr) {
    const trimmed = rawDateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const localDate = fromDateKey(trimmed);
      if (!Number.isNaN(localDate.getTime())) {
        return { dateKey: trimmed, timestamp: localDate.getTime() };
      }
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return { dateKey: toLocalDateKey(parsed), timestamp: parsed.getTime() };
    }
  }
  return null;
}

function mapLegacyMoodToCalendar(mood: Mood | string): CalendarMoodKey {
  switch (mood) {
    case Mood.HAPPY:
    case 'Happy':
    case 'happy':
      return 'happy';
    case Mood.TIRED:
    case 'Tired':
    case 'tired':
      return 'tired';
    case Mood.STRESSED:
    case 'Stressed':
    case 'stressed':
      return 'stressed';
    case 'calm':
    case 'Calm':
      return 'calm';
    default:
      return 'calm';
  }
}

export function mapStressScoreToMood(score: number): CalendarMoodKey {
  if (score <= 28) return 'calm';
  if (score <= 50) return 'happy';
  if (score <= 70) return 'tired';
  return 'stressed';
}

function loadManualMoodLogs(): MoodLogEntry[] {
  try {
    const raw = localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is MoodLogEntry =>
        item &&
        typeof item.id === 'string' &&
        typeof item.dateKey === 'string' &&
        typeof item.mood === 'string' &&
        item.mood in CALENDAR_MOOD_META
    );
  } catch {
    return [];
  }
}

function loadJournalMoodLogs(): MoodLogEntry[] {
  try {
    const raw = localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (!raw) return [];
    const entries = JSON.parse(raw) as JournalEntry[];
    if (!Array.isArray(entries)) return [];
    const results: MoodLogEntry[] = [];
    for (const entry of entries) {
      const parsedDate = parseEntryDateKey(entry?.id, entry?.date);
      if (!parsedDate) continue;
      results.push({
        id: `journal-${entry.id}`,
        dateKey: parsedDate.dateKey,
        mood: mapLegacyMoodToCalendar(entry.mood),
        source: 'journal',
        note: entry.aiSentiment ? `Journal reflection (${entry.aiSentiment})` : 'Journal reflection',
        timestamp: parsedDate.timestamp,
      });
    }
    return results;
  } catch {
    return [];
  }
}

function loadQuizMoodLogs(): MoodLogEntry[] {
  try {
    const raw = localStorage.getItem(BERKELEY_STORAGE_KEY);
    if (!raw) return [];
    const entries = JSON.parse(raw) as BerkeleyQuizResult[];
    if (!Array.isArray(entries)) return [];
    const results: MoodLogEntry[] = [];
    for (const entry of entries) {
      const parsedDate = parseEntryDateKey(entry?.id, entry?.date);
      if (!parsedDate) continue;
      results.push({
        id: `quiz-${entry.id}`,
        dateKey: parsedDate.dateKey,
        mood: mapStressScoreToMood(entry.normalizedPercentage ?? 40),
        source: 'quiz',
        note: `Stress & Anxiety Quiz (${entry.overallLevel})`,
        timestamp: parsedDate.timestamp,
      });
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Determines the primary mood for a single day:
 * 1. Highest frequency mood recorded on that date.
 * 2. If tied, most recently recorded mood wins.
 */
export function resolvePrimaryMood(entries: MoodLogEntry[]): CalendarMoodKey {
  const counts: Record<CalendarMoodKey, number> = {
    happy: 0,
    calm: 0,
    tired: 0,
    stressed: 0,
  };
  const latestTimestamp: Record<CalendarMoodKey, number> = {
    happy: 0,
    calm: 0,
    tired: 0,
    stressed: 0,
  };

  for (const entry of entries) {
    counts[entry.mood] += 1;
    if (entry.timestamp > latestTimestamp[entry.mood]) {
      latestTimestamp[entry.mood] = entry.timestamp;
    }
  }

  let bestMood: CalendarMoodKey = entries[0]?.mood ?? 'calm';
  let bestCount = -1;
  let bestTime = -1;

  for (const moodKey of ORDERED_CALENDAR_MOODS) {
    const c = counts[moodKey];
    const t = latestTimestamp[moodKey];
    if (c > bestCount || (c === bestCount && t > bestTime)) {
      bestMood = moodKey;
      bestCount = c;
      bestTime = t;
    }
  }

  return bestMood;
}

export function getMonthMoodMap(year: number, monthIndex: number): Record<string, DailyMoodSummary> {
  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`;
  const allLogs = [...loadManualMoodLogs(), ...loadJournalMoodLogs(), ...loadQuizMoodLogs()];

  const byDate: Record<string, MoodLogEntry[]> = {};
  for (const log of allLogs) {
    if (!log.dateKey.startsWith(monthPrefix)) continue;
    if (!byDate[log.dateKey]) byDate[log.dateKey] = [];
    byDate[log.dateKey].push(log);
  }

  const summaries: Record<string, DailyMoodSummary> = {};
  for (const [dateKey, entries] of Object.entries(byDate)) {
    const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    summaries[dateKey] = {
      dateKey,
      primaryMood: resolvePrimaryMood(sorted),
      entries: sorted,
    };
  }
  return summaries;
}

export function logCalendarMood(
  dateKey: string,
  mood: CalendarMoodKey,
  options?: { source?: MoodLogSource; note?: string; replaceManualForDay?: boolean }
): MoodLogEntry[] {
  const source = options?.source ?? 'calendar';
  const existing = loadManualMoodLogs();
  const filtered = options?.replaceManualForDay
    ? existing.filter((e) => !(e.dateKey === dateKey && e.source === 'calendar'))
    : existing;

  const newEntry: MoodLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    dateKey,
    mood,
    source,
    note: options?.note?.trim() || undefined,
    timestamp: Date.now(),
  };

  const updated = [newEntry, ...filtered].slice(0, 365);
  try {
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(MOOD_UPDATED_EVENT));
  } catch {
    // ignore quota issues
  }
  return updated;
}

export function removeManualMoodLog(entryId: string): void {
  const existing = loadManualMoodLogs();
  const updated = existing.filter((e) => e.id !== entryId);
  try {
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(MOOD_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

export function recordAutoMoodFromScore(score: number, label: string): void {
  const todayKey = toLocalDateKey(new Date());
  const mappedMood = mapStressScoreToMood(score);
  logCalendarMood(todayKey, mappedMood, {
    source: 'checkin',
    note: `${label} (${Math.round(score)}/100)`,
  });
}
