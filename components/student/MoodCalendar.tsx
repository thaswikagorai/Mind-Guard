import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../common/Card';
import { CalendarMoodKey, DailyMoodSummary } from '../../types';
import {
  CALENDAR_MOOD_META,
  MOOD_UPDATED_EVENT,
  ORDERED_CALENDAR_MOODS,
  fromDateKey,
  getMonthMoodMap,
  logCalendarMood,
  removeManualMoodLog,
  toLocalDateKey,
} from '../../services/moodCalendarService';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SOURCE_LABELS: Record<string, string> = {
  calendar: 'Mood log',
  journal: 'Journal',
  quiz: 'Quiz',
  checkin: 'Check-In',
};

const MoodCalendar: React.FC = () => {
  const [today, setToday] = useState<Date>(() => new Date());
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const todayKey = useMemo(() => toLocalDateKey(today), [today]);

  const [monthMoods, setMonthMoods] = useState<Record<string, DailyMoodSummary>>(() =>
    getMonthMoodMap(currentYear, currentMonth)
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [noteInput, setNoteInput] = useState<string>('');
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [showAllEntries, setShowAllEntries] = useState<boolean>(false);

  const refreshMoods = useCallback(() => {
    const now = new Date();
    const nowKey = toLocalDateKey(now);
    setToday((prev) => {
      const prevKey = toLocalDateKey(prev);
      if (prevKey !== nowKey) {
        setSelectedDateKey((sel) => (sel === prevKey ? nowKey : sel));
        return now;
      }
      return prev;
    });
    setMonthMoods(getMonthMoodMap(now.getFullYear(), now.getMonth()));
  }, []);

  useEffect(() => {
    refreshMoods();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshMoods();
      }
    };
    window.addEventListener('focus', refreshMoods);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener(MOOD_UPDATED_EVENT, refreshMoods);
    window.addEventListener('storage', refreshMoods);
    return () => {
      window.removeEventListener('focus', refreshMoods);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener(MOOD_UPDATED_EVENT, refreshMoods);
      window.removeEventListener('storage', refreshMoods);
    };
  }, [refreshMoods]);

  const monthLabel = useMemo(
    () =>
      new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [currentYear, currentMonth]
  );

  const daysInMonth = useMemo(
    () => new Date(currentYear, currentMonth + 1, 0).getDate(),
    [currentYear, currentMonth]
  );

  const firstWeekday = useMemo(
    () => new Date(currentYear, currentMonth, 1).getDay(),
    [currentYear, currentMonth]
  );

  const calendarCells = useMemo(() => {
    const cells: Array<{ day: number; dateKey: string } | null> = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(currentMonth + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      cells.push({
        day,
        dateKey: `${currentYear}-${mm}-${dd}`,
      });
    }
    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstWeekday]);

  const loggedDaysCount = Object.keys(monthMoods).length;

  const dominantMonthMood = useMemo<CalendarMoodKey | null>(() => {
    const tally: Record<CalendarMoodKey, number> = {
      happy: 0,
      calm: 0,
      tired: 0,
      stressed: 0,
    };
    const summaries = Object.values(monthMoods) as DailyMoodSummary[];
    for (const summary of summaries) {
      tally[summary.primaryMood] += 1;
    }
    let best: CalendarMoodKey | null = null;
    let bestCount = 0;
    for (const key of ORDERED_CALENDAR_MOODS) {
      if (tally[key] > bestCount) {
        best = key;
        bestCount = tally[key];
      }
    }
    return best;
  }, [monthMoods]);

  const selectedSummary = monthMoods[selectedDateKey] ?? null;
  const isSelectedFuture = selectedDateKey > todayKey;

  const selectedDateFormatted = useMemo(() => {
    const d = fromDateKey(selectedDateKey);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDateKey]);

  const handleLogMood = (dateKey: string, mood: CalendarMoodKey, useNote = false) => {
    if (dateKey > todayKey) return;
    logCalendarMood(dateKey, mood, {
      source: 'calendar',
      note: useNote ? noteInput.trim() : undefined,
    });
    if (useNote) {
      setNoteInput('');
      setShowNoteInput(false);
    }
    refreshMoods();
  };

  const handleDeleteEntry = (entryId: string) => {
    removeManualMoodLog(entryId);
    refreshMoods();
  };

  return (
    <div className="space-y-2.5">
      {/* Unboxed Metadata Header Row */}
      <div className="flex items-center justify-between gap-2 px-0.5 text-xs text-[#4b7476]">
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span className="font-semibold text-[#0f3d3e] whitespace-nowrap">Mood Calendar</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{monthLabel}</span>
        </div>

        <span className="font-mono-num font-semibold text-[#0f766e] whitespace-nowrap shrink-0">
          {loggedDaysCount}/{daysInMonth} days logged
        </span>
      </div>

      <Card className="border border-[#bde6de] bg-white rounded-2xl p-5 sm:p-6 space-y-5">
        {/* Top Row: Month Insight + Quick Log for Selected/Today */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e4f3f0]">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-[#0f3d3e] font-serif-elegant leading-snug">
              {monthLabel}
            </h2>
            <p className="text-xs text-[#4b7476] mt-0.5">
              {dominantMonthMood ? (
                <>
                  Primary mood this month:{' '}
                  <span className={`font-semibold ${CALENDAR_MOOD_META[dominantMonthMood].textAccentClass}`}>
                    {CALENDAR_MOOD_META[dominantMonthMood].label}
                  </span>
                </>
              ) : (
                'Select today or any past day to record how you felt.'
              )}
            </p>
          </div>

          <div
            className="flex items-center gap-1.5"
            role="group"
            aria-label="Quick log today's mood"
          >
            {ORDERED_CALENDAR_MOODS.map((moodKey) => {
              const meta = CALENDAR_MOOD_META[moodKey];
              const isTodayPrimary = monthMoods[todayKey]?.primaryMood === moodKey;
              return (
                <button
                  key={moodKey}
                  type="button"
                  onClick={() => {
                    setSelectedDateKey(todayKey);
                    handleLogMood(todayKey, moodKey, false);
                  }}
                  title={`Log today as ${meta.label}`}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1 min-h-[40px] ${
                    isTodayPrimary
                      ? `${meta.cellClass} shadow-xs`
                      : 'bg-[#f4fbfa] border-[#cce7e3] text-[#335c5d] hover:bg-[#e6faf6]'
                  }`}
                >
                  <span aria-hidden="true">{meta.emoji}</span>
                  <span className="hidden sm:inline">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 7-Column Current Month Grid */}
        <div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2" aria-hidden="true">
            {WEEKDAY_LABELS.map((dayName) => (
              <div
                key={dayName}
                className="text-center text-[11px] font-semibold text-[#4b7476] py-1"
              >
                {dayName}
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-7 gap-1.5 sm:gap-2"
            role="grid"
            aria-label={`Mood calendar for ${monthLabel}`}
          >
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="min-h-[44px] sm:min-h-[48px]" aria-hidden="true" />;
              }

              const summary = monthMoods[cell.dateKey];
              const isToday = cell.dateKey === todayKey;
              const isFuture = cell.dateKey > todayKey;
              const isSelected = cell.dateKey === selectedDateKey;
              const moodMeta = summary ? CALENDAR_MOOD_META[summary.primaryMood] : null;
              const entryCount = summary?.entries.length ?? 0;

              let cellColors =
                'bg-[#f4fbfa] border-[#dceeed] text-[#335c5d] hover:bg-[#e7f6f4] hover:border-[#99d8cf]';
              if (moodMeta) {
                cellColors = moodMeta.cellClass;
              } else if (isFuture) {
                cellColors = 'bg-[#fafdfc] border-[#eef7f5] text-[#9cb8b9] hover:bg-[#f4fbfa]';
              }

              const selectionRing = isSelected
                ? moodMeta
                  ? moodMeta.selectedBorderClass
                  : 'ring-2 ring-[#0d9488] ring-offset-1'
                : isToday
                ? 'ring-2 ring-[#0f3d3e] ring-offset-1'
                : '';

              const ariaLabel = moodMeta
                ? `${monthLabel.split(' ')[0]} ${cell.day}: Primary mood ${moodMeta.label} (${entryCount} ${
                    entryCount === 1 ? 'entry' : 'entries'
                  })${isToday ? ', Today' : ''}`
                : `${monthLabel.split(' ')[0]} ${cell.day}: No mood recorded${isToday ? ', Today' : ''}`;

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => {
                    setSelectedDateKey(cell.dateKey);
                    setShowNoteInput(false);
                    setShowAllEntries(false);
                  }}
                  aria-label={ariaLabel}
                  aria-pressed={isSelected}
                  title={
                    moodMeta
                      ? `${moodMeta.label} · ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`
                      : isFuture
                      ? 'Upcoming day'
                      : 'No mood logged yet'
                  }
                  className={`relative min-h-[44px] sm:min-h-[48px] rounded-xl border p-1.5 flex flex-col items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d3e] ${cellColors} ${selectionRing}`}
                >
                  <span className="font-mono-num text-xs sm:text-sm font-bold leading-none">
                    {cell.day}
                  </span>
                  {moodMeta ? (
                    <span className="text-[11px] leading-none mt-1" aria-hidden="true">
                      {moodMeta.emoji}
                    </span>
                  ) : isToday ? (
                    <span className="text-[9px] font-semibold leading-none mt-1 text-[#0f766e]">
                      Today
                    </span>
                  ) : null}

                  {entryCount > 1 && (
                    <span
                      className="absolute top-1 right-1.5 text-[9px] font-mono-num font-bold opacity-80 leading-none"
                      aria-hidden="true"
                    >
                      {entryCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clean Color Legend (No Pills) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-[#4b7476]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {ORDERED_CALENDAR_MOODS.map((moodKey) => {
              const meta = CALENDAR_MOOD_META[moodKey];
              return (
                <div key={moodKey} className="flex items-center space-x-1.5">
                  <span className={`w-3 h-3 rounded-sm ${meta.swatchClass}`} aria-hidden="true" />
                  <span className="font-medium text-[#335c5d]">{meta.label}</span>
                </div>
              );
            })}
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#f4fbfa] border border-[#dceeed]" aria-hidden="true" />
              <span className="font-medium text-[#4b7476]">No entry</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details & Logging Controls */}
        <div className="pt-4 border-t border-[#e4f3f0] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[#0f3d3e]">{selectedDateFormatted}</span>
              <span aria-hidden="true" className="text-[#8ab5b6]">·</span>
              {selectedSummary ? (
                <span className={`font-semibold ${CALENDAR_MOOD_META[selectedSummary.primaryMood].textAccentClass}`}>
                  Primary: {CALENDAR_MOOD_META[selectedSummary.primaryMood].label}{' '}
                  {CALENDAR_MOOD_META[selectedSummary.primaryMood].emoji}
                </span>
              ) : (
                <span className="text-[#4b7476]">
                  {isSelectedFuture ? 'Upcoming day' : 'No mood logged yet'}
                </span>
              )}
            </div>

            {!isSelectedFuture && (
              <button
                type="button"
                onClick={() => setShowNoteInput((prev) => !prev)}
                className="text-xs font-semibold text-[#0f766e] hover:text-[#0f3d3e] transition-colors py-1"
              >
                {showNoteInput ? 'Hide note' : '+ Add note'}
              </button>
            )}
          </div>

          {!isSelectedFuture && (
            <div className="space-y-2.5">
              {showNoteInput && (
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  maxLength={120}
                  placeholder="Optional short note (e.g., Finished math prep, felt lighter)..."
                  className="w-full px-3.5 py-2.5 text-xs bg-[#f4fbfa] border border-[#cce7e3] rounded-xl text-[#0f3d3e] placeholder-[#7ca1a3] focus:outline-none focus:border-[#0d9488] focus:bg-white min-h-[40px]"
                />
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ORDERED_CALENDAR_MOODS.map((moodKey) => {
                  const meta = CALENDAR_MOOD_META[moodKey];
                  const isActive = selectedSummary?.primaryMood === moodKey;
                  return (
                    <button
                      key={moodKey}
                      type="button"
                      onClick={() => handleLogMood(selectedDateKey, moodKey, true)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 min-h-[42px] ${
                        isActive
                          ? meta.cellClass
                          : 'bg-[#f8fcfb] border-[#d9efec] text-[#335c5d] hover:bg-[#eaf6f4]'
                      }`}
                    >
                      <span aria-hidden="true">{meta.emoji}</span>
                      <span>Log {meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedSummary && selectedSummary.entries.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {(showAllEntries ? selectedSummary.entries : selectedSummary.entries.slice(0, 4)).map((entry) => {
                const meta = CALENDAR_MOOD_META[entry.mood];
                const timeText = new Date(entry.timestamp).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#f4fbfa] border border-[#e2f2ef] text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${meta.swatchClass}`} aria-hidden="true" />
                      <span className="font-semibold text-[#0f3d3e] shrink-0">{meta.label}</span>
                      <span aria-hidden="true" className="text-[#8ab5b6]">·</span>
                      <span className="text-[#4b7476] truncate">
                        {entry.note || SOURCE_LABELS[entry.source] || 'Mood log'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono-num text-[11px] text-[#4b7476]">{timeText}</span>
                      {entry.source === 'calendar' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          aria-label={`Remove ${meta.label} mood entry`}
                          className="w-7 h-7 rounded-lg text-[#7ca1a3] hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors font-bold"
                          title="Remove mood log"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {selectedSummary.entries.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllEntries((prev) => !prev)}
                  className="text-xs font-semibold text-[#0f766e] hover:text-[#0f3d3e] py-1 transition-colors"
                >
                  {showAllEntries
                    ? 'Show fewer entries'
                    : `Show all ${selectedSummary.entries.length} entries`}
                </button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MoodCalendar;
