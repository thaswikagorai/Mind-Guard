import React, { useState, useEffect } from 'react';
import { JournalEntry, Mood } from '../../types';
import { analyzeJournalEntry } from '../../services/geminiService';
import { ChevronLeftIcon, KeyIcon, PlusIcon, TrashIcon } from '../icons';
import Card from '../common/Card';
import { MOOD_UPDATED_EVENT } from '../../services/moodCalendarService';
import { loadWeeklyGoals, saveWeeklyGoals } from '../../services/weeklyGoalsData';
import { evaluateAndUnlockStickers } from '../../services/mindfulnessStickersData';

interface PrivateJournalProps {
  onBack: () => void;
}

const CORRECT_PIN = '2012';

const moodEmojis: { [key in Mood]: string } = {
  [Mood.HAPPY]: '😊',
  [Mood.TIRED]: '😴',
  [Mood.STRESSED]: '😟',
};

const PrivateJournal: React.FC<PrivateJournalProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [view, setView] = useState<'list' | 'new'>('list');

  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryMood, setNewEntryMood] = useState<Mood>(Mood.HAPPY);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mindguard_journal_entries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed
            .filter((item): item is JournalEntry => Boolean(item && typeof item.content === 'string'))
            .map((item) => ({
              id: typeof item.id === 'string' ? item.id : String(item.id ?? Date.now()),
              date: typeof item.date === 'string' ? item.date : 'Recent',
              content: item.content,
              mood: Object.values(Mood).includes(item.mood) ? item.mood : Mood.HAPPY,
              aiSentiment: typeof item.aiSentiment === 'string' && item.aiSentiment ? item.aiSentiment : 'Neutral',
              aiThemes: Array.isArray(item.aiThemes) ? item.aiThemes.filter((t): t is string => typeof t === 'string') : [],
            }));
          setEntries(valid);
        }
      }
    } catch (e) {
      console.error('Failed to parse journal entries', e);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      try {
        localStorage.setItem('mindguard_journal_entries', JSON.stringify(entries));
      } catch {
        // ignore storage quota errors
      }
    }
  }, [entries, isAuthenticated]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      setIsAuthenticated(true);
      setError('');

      try {
        const promptDraft = localStorage.getItem('mindguard_journal_prompt_draft');
        const quoteDraft = localStorage.getItem('mindguard_journal_quote_draft');
        if (promptDraft || quoteDraft) {
          const prefill = quoteDraft
            ? `Daily Affirmation: "${quoteDraft}"\n\nReflection: ${promptDraft || ''}\n\nMy thoughts: `
            : `Reflection: ${promptDraft}\n\nMy thoughts: `;
          setNewEntryContent(prefill);
          setView('new');
          localStorage.removeItem('mindguard_journal_prompt_draft');
          localStorage.removeItem('mindguard_journal_quote_draft');
        }
      } catch {
        // ignore
      }
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  const handleSaveEntry = async () => {
    if (newEntryContent.trim() === '') return;

    setIsSaving(true);
    try {
      const analysis = await analyzeJournalEntry(newEntryContent);
      const safeSentiment =
        typeof analysis?.sentiment === 'string' && analysis.sentiment.trim()
          ? analysis.sentiment.trim()
          : 'Neutral';
      const safeThemes = Array.isArray(analysis?.themes)
        ? analysis.themes.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        : [];

      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        content: newEntryContent,
        mood: newEntryMood,
        aiSentiment: safeSentiment,
        aiThemes: safeThemes,
      };
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      try {
        localStorage.setItem('mindguard_journal_entries', JSON.stringify(updatedEntries));
        window.dispatchEvent(new CustomEvent(MOOD_UPDATED_EVENT));
      } catch {
        // ignore storage errors
      }

      // Sync with matching weekly journaling goals
      const goals = loadWeeklyGoals();
      let updatedGoal = false;
      const nextGoals = goals.map((goal) => {
        if (goal.category === 'journaling' && goal.currentCount < goal.targetCount) {
          updatedGoal = true;
          return { ...goal, currentCount: Math.min(goal.targetCount, goal.currentCount + 1) };
        }
        return goal;
      });
      if (updatedGoal) {
        saveWeeklyGoals(nextGoals);
        evaluateAndUnlockStickers(nextGoals);
      }

      setNewEntryContent('');
      setNewEntryMood(Mood.HAPPY);
      setView('list');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = (id: string) => {
    const updatedEntries = entries.filter((entry) => entry.id !== id);
    setEntries(updatedEntries);
    try {
      localStorage.setItem('mindguard_journal_entries', JSON.stringify(updatedEntries));
      window.dispatchEvent(new CustomEvent(MOOD_UPDATED_EVENT));
    } catch {
      // ignore storage errors
    }
  };

  const sentimentTone = (sentiment?: string) => {
    switch ((sentiment || 'neutral').toLowerCase()) {
      case 'positive':
        return 'text-[#047857]';
      case 'negative':
        return 'text-rose-700';
      default:
        return 'text-[#4f5d95]';
    }
  };

  const moodTileStyles: { [key in Mood]: string } = {
    [Mood.HAPPY]: 'bg-[#d1fae5] border-[#34d399]',
    [Mood.TIRED]: 'bg-[#e0f2fe] border-[#38bdf8]',
    [Mood.STRESSED]: 'bg-[#ffedd5] border-[#fb923c]',
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-[#e7faf6] via-[#f4f9ff] to-[#fff3ec]">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#bde6de] shadow-sm flex flex-col items-center w-full max-w-sm">
          <div className="w-16 h-16 bg-gradient-to-br from-[#ffedd5] to-[#ccf7ef] border border-[#fed7aa] rounded-2xl flex items-center justify-center mb-5">
            <KeyIcon className="w-7 h-7 text-[#c2410c]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0f3d3e] font-serif-elegant">Journal Locked</h2>
          <p className="text-sm text-[#4b7476] mt-2 text-center leading-relaxed">
            Enter your 4-digit PIN to open your private reflections.
          </p>
          <p className="text-[11px] font-medium text-[#0f766e] mt-1 font-mono-num">
            Default PIN: 2012
          </p>
          <form onSubmit={handlePinSubmit} className="mt-7 w-full">
            <input
              type="password"
              pattern="\d*"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center text-3xl font-mono-num tracking-[0.5em] p-4 bg-[#f4fbfa] border border-[#cce7e3] rounded-2xl focus:outline-none focus:border-[#0d9488] focus:bg-white transition-colors font-bold text-[#0f3d3e]"
              autoFocus
            />
            {error && <p className="text-rose-600 text-xs mt-3 text-center font-semibold">{error}</p>}
            <div className="flex items-center space-x-3 mt-7">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 bg-[#f4fbfa] border border-[#cce7e3] text-[#335c5d] font-semibold py-3.5 rounded-xl hover:bg-[#eaf6f4] transition-colors min-h-[44px]"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#0d9488] text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-[#0f766e] transition-colors min-h-[44px]"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'new') {
    return (
      <div className="p-4 sm:p-6 h-full flex flex-col bg-gradient-to-b from-[#eefaf7] via-[#f4fbff] to-[#fff8f4]">
        <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={() => {
                setNewEntryContent('');
                setNewEntryMood(Mood.HAPPY);
                setView('list');
              }}
              className="text-[#4b7476] hover:text-[#0f3d3e] flex items-center py-2 px-3 -ml-2 rounded-xl hover:bg-[#e3f7f3] transition-colors min-h-[44px]"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              <span className="ml-1 font-semibold text-sm">Discard</span>
            </button>
            <button
              type="button"
              onClick={handleSaveEntry}
              disabled={isSaving || !newEntryContent.trim()}
              className="bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white font-semibold py-2.5 px-6 rounded-xl hover:brightness-105 transition-all disabled:opacity-50 min-h-[44px] text-sm"
            >
              {isSaving ? 'Analyzing...' : 'Save Thought'}
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#bde6de] flex-grow flex flex-col">
            <h2 className="text-xl font-bold text-[#0f3d3e] mb-5 font-serif-elegant">
              What's on your mind?
            </h2>
            <div className="flex space-x-3 mb-6" role="group" aria-label="Select mood for journal entry">
              {Object.values(Mood).map((mood) => (
                <button
                  type="button"
                  key={mood}
                  onClick={() => setNewEntryMood(mood)}
                  aria-label={`Mood: ${mood}`}
                  aria-pressed={newEntryMood === mood}
                  className={`p-3.5 rounded-2xl text-3xl transition-all duration-200 border ${
                    newEntryMood === mood
                      ? `${moodTileStyles[mood]} scale-105 shadow-xs`
                      : 'bg-[#f4fbfa] border-[#cce7e3] opacity-65 hover:opacity-100'
                  }`}
                >
                  {moodEmojis[mood]}
                </button>
              ))}
            </div>
            <textarea
              value={newEntryContent}
              onChange={(e) => setNewEntryContent(e.target.value)}
              placeholder="The page is yours..."
              className="flex-grow w-full p-4 bg-[#f4fbfa] border border-[#cce7e3] rounded-2xl focus:outline-none focus:border-[#0d9488] focus:bg-white resize-none text-base text-[#0f3d3e] leading-relaxed placeholder-[#7ca1a3]"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-gradient-to-b from-[#eefaf7] via-[#f4fbff] to-[#fff8f4] relative">
      <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl hover:bg-[#e3f7f3] text-[#4b7476] hover:text-[#0f3d3e] transition-colors mr-2 flex items-center justify-center"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0f3d3e] font-serif-elegant leading-none">
                My Journal
              </h1>
              <p className="text-[#c2410c] text-xs font-semibold mt-1">PIN-protected safe space</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setView('new')}
            className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white font-semibold px-4 py-2.5 rounded-xl hover:brightness-105 transition-all text-xs min-h-[44px]"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-4 pb-10">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-16 text-center px-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ffedd5] to-[#ccf7ef] border border-[#fed7aa] rounded-2xl flex items-center justify-center text-4xl mb-5">
                ✍️
              </div>
              <h3 className="text-xl font-bold text-[#0f3d3e] font-serif-elegant mb-2">
                Begin your story
              </h3>
              <p className="text-[#4b7476] text-sm max-w-sm leading-relaxed">
                Journaling daily helps clarify your thoughts and gently eases academic pressure.
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <Card
                key={entry.id}
                className="border border-[#bde6de] rounded-2xl bg-white p-5 sm:p-6"
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-medium text-[#4b7476] mb-2">{entry.date}</p>
                    <p className="text-[#0f3d3e] leading-relaxed text-base whitespace-pre-line">
                      {entry.content}
                    </p>
                  </div>
                  <div className={`text-3xl border p-2.5 rounded-xl flex-shrink-0 ${moodTileStyles[entry.mood] || 'bg-[#eaf6f4] border-[#cce7e3]'}`}>
                    {moodEmojis[entry.mood]}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#eaf6f4]">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#4b7476]">
                    <span className={`font-semibold capitalize ${sentimentTone(entry.aiSentiment)}`}>
                      {entry.aiSentiment || 'Neutral'}
                    </span>
                    {(Array.isArray(entry.aiThemes) ? entry.aiThemes : []).map((theme) => (
                      <React.Fragment key={theme}>
                        <span aria-hidden="true">·</span>
                        <span>{theme}</span>
                      </React.Fragment>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteEntry(entry.id)}
                    className="p-2 rounded-xl text-[#7ca1a3] hover:text-rose-600 hover:bg-rose-50 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                    title="Delete entry"
                    aria-label="Delete entry"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivateJournal;