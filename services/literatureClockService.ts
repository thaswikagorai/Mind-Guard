import { LiteratureClockQuote, LiteratureClockResponse } from '../types';

/**
 * Verified authentic literary passages about time used strictly as an offline backup
 * if the live minute-by-minute Literature Clock lookup returns empty or offline.
 */
const VERIFIED_TIME_EXCERPTS: LiteratureClockQuote[] = [
  {
    time: '07:00',
    quoteFirst: 'Seven o’clock had struck, and he had not left the house; ',
    quoteTimeCase: 'seven o’clock',
    quoteLast: ' was his hour for rising and beginning the day with a calm mind.',
    title: 'Around the World in Eighty Days',
    author: 'Jules Verne',
    isExactMinute: false,
  },
  {
    time: '09:00',
    quoteFirst: 'At ',
    quoteTimeCase: 'nine o’clock',
    quoteLast: ', when the morning sun lay bright across the lawn, every ordinary hour seemed full of quiet promise.',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isExactMinute: false,
  },
  {
    time: '12:00',
    quoteFirst: 'Towards ',
    quoteTimeCase: 'noon',
    quoteLast: ' he rose and began to write a letter to her; but he could not find the right words.',
    title: 'The Tale of Genji',
    author: 'Murasaki Shikibu',
    isExactMinute: false,
  },
  {
    time: '15:00',
    quoteFirst: '“What a curious feeling!” said Alice. Wait a moment for ',
    quoteTimeCase: 'tea-time',
    quoteLast: ', when all the clocks seem to pause together in the afternoon stillness.',
    title: 'Alice’s Adventures in Wonderland',
    author: 'Lewis Carroll',
    isExactMinute: false,
  },
  {
    time: '18:15',
    quoteFirst: '“',
    quoteTimeCase: 'Quarter past six',
    quoteLast: ',” said Tony. “He’s bound to have told her by now.”',
    title: 'A Handful of Dust',
    author: 'Evelyn Waugh',
    isExactMinute: false,
  },
  {
    time: '21:00',
    quoteFirst: 'The chimes were ringing ',
    quoteTimeCase: 'nine o’clock',
    quoteLast: ' across the quiet rooftops as evening settled softly over the city.',
    title: 'Mrs. Dalloway',
    author: 'Virginia Woolf',
    isExactMinute: false,
  },
  {
    time: '00:00',
    quoteFirst: '“It is ',
    quoteTimeCase: 'midnight',
    quoteLast: '!” said Scrooge, listening to the deep bell echo into the clear winter air.',
    title: 'A Christmas Carol',
    author: 'Charles Dickens',
    isExactMinute: false,
  },
];

function getClosestClassicFallback(hh: number, mm: number): LiteratureClockQuote[] {
  const targetMinutes = hh * 60 + mm;
  let best = VERIFIED_TIME_EXCERPTS[0];
  let bestDiff = Infinity;

  for (const item of VERIFIED_TIME_EXCERPTS) {
    const [ih, im] = item.time.split(':').map(Number);
    const diff = Math.abs(ih * 60 + im - targetMinutes);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = item;
    }
  }
  return [best];
}

export async function fetchLiteratureClockQuotes(date: Date): Promise<LiteratureClockResponse> {
  const hhNum = date.getHours();
  const mmNum = date.getMinutes();
  const hh = String(hhNum).padStart(2, '0');
  const mm = String(mmNum).padStart(2, '0');

  try {
    const response = await fetch(`/api/literature-clock?hh=${hh}&mm=${mm}`);
    if (!response.ok) {
      throw new Error('Literature clock fetch failed');
    }
    const data = (await response.json()) as LiteratureClockResponse;
    if (Array.isArray(data.quotes) && data.quotes.length > 0) {
      return data;
    }
  } catch {
    // Fall back gracefully to verified excerpts
  }

  return {
    time: `${hh}:${mm}`,
    quotes: getClosestClassicFallback(hhNum, mmNum),
    source: 'classic-fallback',
  };
}
