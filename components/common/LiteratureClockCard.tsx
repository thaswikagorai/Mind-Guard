import React, { useState, useEffect, useCallback } from 'react';
import Card from './Card';
import { BookOpenIcon, RefreshIcon } from '../icons';
import { LiteratureClockQuote } from '../../types';
import { fetchLiteratureClockQuotes } from '../../services/literatureClockService';

interface LiteratureClockCardProps {
  compact?: boolean;
}

const LiteratureClockCard: React.FC<LiteratureClockCardProps> = ({ compact = false }) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [use24Hour, setUse24Hour] = useState<boolean>(false);
  const [quotes, setQuotes] = useState<LiteratureClockQuote[]>([]);
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [source, setSource] = useState<'literature-clock' | 'classic-fallback'>('literature-clock');

  const currentMinuteKey = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  // Tick every second to stay locked precisely to the local clock minute transition
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const loadQuotesForCurrentMinute = useCallback(async (targetDate: Date) => {
    setIsLoading(true);
    const result = await fetchLiteratureClockQuotes(targetDate);
    setQuotes(result.quotes);
    setQuoteIndex(0);
    setSource(result.source);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadQuotesForCurrentMinute(now);
    // Re-fetch strictly when the HH:MM minute rolls over
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMinuteKey, loadQuotesForCurrentMinute]);

  const activeQuote = quotes[quoteIndex] ?? null;

  const formattedClock = use24Hour
    ? currentMinuteKey
    : now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

  const formattedSeconds = String(now.getSeconds()).padStart(2, '0');
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handleCycleQuote = () => {
    if (quotes.length <= 1) return;
    setQuoteIndex((prev) => (prev + 1) % quotes.length);
  };

  return (
    <Card
      className={`border border-[#bde6de] bg-gradient-to-br from-[#ffffff] via-[#f6fcfb] to-[#eff7ff] flex flex-col justify-between ${
        compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6'
      }`}
    >
      {/* Header Row: Literary Eyebrow + Live Digital Time Display */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#dff2ee]">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#e6faf6] border border-[#99e2d8] text-[#0f766e] flex items-center justify-center shrink-0">
            <BookOpenIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0f766e] leading-none">
              Literature Clock
            </p>
            <p className="text-[11px] text-[#4b7476] mt-0.5">{formattedDate}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-2.5 py-1 rounded-xl bg-[#0f3d3e] text-white font-mono-num flex items-baseline space-x-1 shadow-xs">
            <span className="text-sm sm:text-base font-bold tracking-tight">{formattedClock}</span>
            <span className="text-[10px] text-[#99f6e4] opacity-85">:{formattedSeconds}</span>
          </div>
          <button
            type="button"
            onClick={() => setUse24Hour((prev) => !prev)}
            aria-label="Toggle 12-hour or 24-hour clock format"
            className="px-2 py-1 rounded-lg bg-white hover:bg-[#e6faf6] border border-[#cce7e3] text-[11px] font-mono-num font-semibold text-[#335c5d] transition-colors min-h-[30px]"
          >
            {use24Hour ? '24h' : '12h'}
          </button>
        </div>
      </div>

      {/* Centerpiece Literary Passage */}
      <div className="py-4 space-y-3">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse py-2">
            <div className="h-4 bg-[#dff2ee] rounded w-full" />
            <div className="h-4 bg-[#dff2ee] rounded w-5/6" />
            <div className="h-4 bg-[#dff2ee] rounded w-2/3" />
          </div>
        ) : activeQuote ? (
          <>
            <blockquote className="font-serif-elegant text-base sm:text-lg leading-relaxed text-[#0f3d3e]">
              <span>{activeQuote.quoteFirst}</span>
              <mark className="bg-[#ccf7ef] text-[#0f766e] font-bold px-1.5 py-0.5 rounded-md not-italic">
                {activeQuote.quoteTimeCase}
              </mark>
              <span>{activeQuote.quoteLast}</span>
            </blockquote>

            {/* Book Title & Author Attribution */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="text-xs sm:text-sm text-[#335c5d]">
                <span className="text-[#0f766e] font-semibold mr-1">—</span>
                <cite className="font-serif-elegant italic font-semibold text-[#0f3d3e] not-italic">
                  {activeQuote.title}
                </cite>
                <span className="text-[#4b7476]">, {activeQuote.author}</span>
              </div>

              {quotes.length > 1 && (
                <button
                  type="button"
                  onClick={handleCycleQuote}
                  title="Show another literary passage for this time"
                  className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#0f766e] hover:text-[#0f3d3e] px-2.5 py-1 rounded-lg bg-[#eefaf7] hover:bg-[#d7f3ec] border border-[#bde6de] transition-colors min-h-[30px]"
                >
                  <RefreshIcon className="w-3 h-3" />
                  <span className="font-mono-num">
                    {quoteIndex + 1}/{quotes.length}
                  </span>
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Subtle Match Status & Attribution Footer */}
      <div className="pt-2.5 border-t border-[#e7f5f2] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#4b7476]">
        <span>
          {activeQuote && !activeQuote.isExactMinute
            ? `Closest literary time (${activeQuote.time})`
            : `Matched to ${currentMinuteKey}`}
        </span>
        {source === 'literature-clock' ? (
          <a
            href="https://literature-clock.jenevoldsen.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#0f766e] underline underline-offset-2"
          >
            Literature Clock
          </a>
        ) : (
          <span>Classic Archive</span>
        )}
      </div>
    </Card>
  );
};

export default LiteratureClockCard;
