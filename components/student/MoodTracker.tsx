import React, { useState } from 'react';
import { PERCEIVED_STRESS_SCALE_QUESTIONS, BERKELEY_STRESS_ANXIETY_QUESTIONS } from '../../constants';
import { ChevronLeftIcon, SparklesIcon } from '../icons';
import { analyzeJournalEntry } from '../../services/geminiService';
import { Mood, JournalEntry, BerkeleyQuizResult } from '../../types';

interface MoodTrackerProps {
  onComplete: () => void;
  onNavigateToMentor?: () => void;
  onNavigateToWellness?: () => void;
}

type QuizType = 'berkeley' | 'pss';

const MoodTracker: React.FC<MoodTrackerProps> = ({
  onComplete,
  onNavigateToMentor,
  onNavigateToWellness,
}) => {
  const [selectedQuiz, setSelectedQuiz] = useState<QuizType>('berkeley');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const [totalScore, setTotalScore] = useState(0);
  const [berkeleyResult, setBerkeleyResult] = useState<BerkeleyQuizResult | null>(null);

  const [journalContent, setJournalContent] = useState('');
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  const [journalSaved, setJournalSaved] = useState(false);

  const activeQuestions =
    selectedQuiz === 'berkeley'
      ? BERKELEY_STRESS_ANXIETY_QUESTIONS
      : PERCEIVED_STRESS_SCALE_QUESTIONS;

  const handleSwitchQuiz = (type: QuizType) => {
    setSelectedQuiz(type);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResult(false);
    setBerkeleyResult(null);
    setJournalSaved(false);
  };

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      if (selectedQuiz === 'berkeley') {
        calculateBerkeleyResult(newAnswers);
      } else {
        calculatePSSResult(newAnswers);
      }
      setShowResult(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setAnswers(answers.slice(0, -1));
    }
  };

  const calculateBerkeleyResult = (ans: number[]) => {
    let stress = 0;
    let anxiety = 0;

    BERKELEY_STRESS_ANXIETY_QUESTIONS.forEach((q, idx) => {
      const val = ans[idx] ?? 0;
      if (q.subscale === 'stress') {
        stress += val;
      } else {
        anxiety += val;
      }
    });

    const total = stress + anxiety;
    setTotalScore(total);

    const stressLvl: 'Mild' | 'Moderate' | 'Severe' =
      stress <= 7 ? 'Mild' : stress <= 12 ? 'Moderate' : 'Severe';

    const anxietyLvl: 'Mild' | 'Moderate' | 'Severe' =
      anxiety <= 5 ? 'Mild' : anxiety <= 9 ? 'Moderate' : 'Severe';

    let overallDesc = 'Low Symptoms';
    if (total > 26) {
      overallDesc = 'High Stress & Anxiety';
    } else if (total > 14) {
      overallDesc = 'Moderate Stress & Anxiety';
    } else {
      overallDesc = 'Healthy / Low Stress & Anxiety';
    }

    const resultData: BerkeleyQuizResult = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      totalScore: total,
      stressScore: stress,
      anxietyScore: anxiety,
      stressLevel: stressLvl,
      anxietyLevel: anxietyLvl,
      overallLevel: overallDesc,
      normalizedPercentage: Math.round((total / 48) * 100),
    };

    setBerkeleyResult(resultData);

    try {
      const previous = JSON.parse(localStorage.getItem('mindguard_berkeley_quiz_results') || '[]');
      localStorage.setItem('mindguard_berkeley_quiz_results', JSON.stringify([resultData, ...previous]));
      localStorage.setItem('mindguard_latest_stress_score', resultData.normalizedPercentage.toString());
    } catch {
      // ignore
    }

    setJournalContent(
      `Berkeley Stress & Anxiety Assessment (${resultData.overallLevel}):\n` +
        `• Stress Score: ${stress}/24 (${stressLvl})\n` +
        `• Anxiety Score: ${anxiety}/24 (${anxietyLvl})\n\n` +
        `Today I'm reflecting on what triggered these feelings...`
    );
  };

  const calculatePSSResult = (ans: number[]) => {
    let sum = 0;
    PERCEIVED_STRESS_SCALE_QUESTIONS.forEach((q, idx) => {
      const raw = ans[idx] ?? 0;
      const val = q.isReversed ? 4 - raw : raw;
      sum += val;
    });

    setTotalScore(sum);
    const { level } = getPSSResultLevel(sum);
    setJournalContent(`Today my Perceived Stress quiz result was: ${level} (${sum}/40). I'm feeling...`);

    try {
      localStorage.setItem('mindguard_latest_stress_score', Math.round((sum / 40) * 100).toString());
    } catch {
      // ignore
    }
  };

  function getPSSResultLevel(score: number) {
    if (score <= 13)
      return { level: 'Low Stress', color: 'text-[#047857]', bg: 'bg-[#eaf6f4]', emoji: '😊', mood: Mood.HAPPY };
    if (score <= 26)
      return { level: 'Moderate Stress', color: 'text-amber-700', bg: 'bg-amber-50', emoji: '😐', mood: Mood.STRESSED };
    return { level: 'High Perceived Stress', color: 'text-rose-700', bg: 'bg-rose-50', emoji: '😟', mood: Mood.STRESSED };
  }

  const handleSaveJournal = async () => {
    if (!journalContent.trim()) return;
    setIsSavingJournal(true);
    try {
      const analysis = await analyzeJournalEntry(journalContent);
      let mood = Mood.HAPPY;

      if (selectedQuiz === 'berkeley' && berkeleyResult) {
        mood = berkeleyResult.totalScore > 14 ? Mood.STRESSED : Mood.HAPPY;
      } else {
        mood = totalScore > 13 ? Mood.STRESSED : Mood.HAPPY;
      }

      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        content: journalContent,
        mood: mood,
        aiSentiment: analysis.sentiment,
        aiThemes: analysis.themes,
      };

      const existingEntries = JSON.parse(localStorage.getItem('mindguard_journal_entries') || '[]');
      localStorage.setItem('mindguard_journal_entries', JSON.stringify([newEntry, ...existingEntries]));
      setJournalSaved(true);
    } catch (error) {
      console.error('Failed to save journal:', error);
    } finally {
      setIsSavingJournal(false);
    }
  };

  const progress = ((currentQuestionIndex + 1) / activeQuestions.length) * 100;

  if (showResult) {
    const isBerkeley = selectedQuiz === 'berkeley' && berkeleyResult;
    const needsSupport = isBerkeley ? berkeleyResult.totalScore > 14 : totalScore > 13;

    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-[#eefaf7] via-[#f4fbff] to-[#fff8f4] overflow-y-auto">
        <header className="px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-[#bde6de] bg-white/95 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onComplete}
              aria-label="Back to dashboard"
              className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl hover:bg-[#e3f7f3] text-[#4b7476] hover:text-[#0f3d3e] transition-colors flex items-center justify-center"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-[#0f3d3e] font-serif-elegant">Assessment Results</h1>
          </div>
          <span className="text-xs font-semibold text-[#0284c7]">
            {selectedQuiz === 'berkeley' ? 'UC Berkeley GGSC' : 'PSS-10'}
          </span>
        </header>

        <div className="p-4 sm:p-6 space-y-5 max-w-2xl mx-auto w-full">
          {isBerkeley ? (
            <div className="bg-white rounded-3xl p-6 border border-[#bde6de] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#14b8a6] via-[#0ea5e9] to-[#6366f1]" />

              <p className="text-xs font-semibold text-[#0f766e] mb-2">
                UC Berkeley Stress &amp; Anxiety Quiz
              </p>

              <h2 className="text-2xl font-bold text-[#0f3d3e] font-serif-elegant text-balance">
                {berkeleyResult.overallLevel}
              </h2>
              <p className="text-[#4b7476] text-sm mt-1">
                Total Score:{' '}
                <span className="font-bold text-[#0f3d3e] font-mono-num text-base">
                  {berkeleyResult.totalScore}
                </span>{' '}
                / 48
              </p>

              {/* Subscale Meters */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#e6faf6] to-[#d5f5ef] border border-[#99e2d8] text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0f3d3e]">Stress</span>
                    <span
                      className={`text-xs font-semibold ${
                        berkeleyResult.stressLevel === 'Mild'
                          ? 'text-[#047857]'
                          : berkeleyResult.stressLevel === 'Moderate'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {berkeleyResult.stressLevel}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#0f3d3e] mt-2 font-mono-num">
                    {berkeleyResult.stressScore}{' '}
                    <span className="text-xs font-normal text-[#4b7476]">/ 24</span>
                  </div>
                  <div className="w-full bg-white h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#14b8a6] to-[#0d9488] h-2 rounded-full"
                      style={{ width: `${(berkeleyResult.stressScore / 24) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#335c5d] mt-2">
                    Tension, irritability, and difficulty relaxing.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] border border-[#c7d2fe] text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0f3d3e]">Anxiety</span>
                    <span
                      className={`text-xs font-semibold ${
                        berkeleyResult.anxietyLevel === 'Mild'
                          ? 'text-[#047857]'
                          : berkeleyResult.anxietyLevel === 'Moderate'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {berkeleyResult.anxietyLevel}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#0f3d3e] mt-2 font-mono-num">
                    {berkeleyResult.anxietyScore}{' '}
                    <span className="text-xs font-normal text-[#4b7476]">/ 24</span>
                  </div>
                  <div className="w-full bg-white h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#6366f1] to-[#4f46e5] h-2 rounded-full"
                      style={{ width: `${(berkeleyResult.anxietyScore / 24) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#335c5d] mt-2">
                    Physical arousal, rapid heart rate, and worry.
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gradient-to-r from-[#fff7ed] to-[#eff9ff] rounded-2xl border border-[#fed7aa] text-left flex items-start space-x-2.5">
                <span className="text-lg">💡</span>
                <p className="text-xs text-[#335c5d] leading-relaxed">
                  <strong className="text-[#0f3d3e] font-semibold">Greater Good Insight:</strong> Stress shows
                  how easily you feel overwhelmed by external demands, while anxiety captures physical apprehension.
                  Mindful breathing and self-compassion help gently lower both.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-[#cce7e3] text-center">
              {(() => {
                const { level, color, bg, emoji } = getPSSResultLevel(totalScore);
                return (
                  <>
                    <div
                      className={`text-5xl mb-3 ${bg} rounded-2xl p-4 w-20 h-20 mx-auto flex items-center justify-center`}
                    >
                      {emoji}
                    </div>
                    <h2 className="text-2xl font-bold text-[#0f3d3e] font-serif-elegant">
                      Perceived Stress Result
                    </h2>
                    <p className="text-[#4b7476] mt-1">
                      Score:{' '}
                      <span className="font-bold text-[#0f3d3e] font-mono-num">{totalScore}</span> / 40
                    </p>
                    <p className={`text-xl font-bold mt-2 ${color}`}>{level}</p>
                  </>
                );
              })()}
            </div>
          )}

          {needsSupport && (
            <div className="bg-gradient-to-br from-[#0d9488] via-[#0284c7] to-[#4f46e5] rounded-2xl p-5 text-white shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold">Need a gentle sounding board?</h3>
              </div>
              <p className="text-xs text-[#e3f7ff] mb-4 leading-relaxed">
                Mindy AI Mentor can help you work through test anxiety and academic pressure step by step.
              </p>
              <button
                type="button"
                onClick={onNavigateToMentor}
                className="w-full bg-white text-[#0f3d3e] font-semibold py-3 rounded-xl hover:bg-[#eaf6f4] transition-colors text-xs min-h-[44px]"
              >
                Talk with AI Wellness Mentor
              </button>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#e6faf6] to-[#eff9ff] border border-[#99e2d8] flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🌬️</span>
              <div>
                <p className="text-xs font-bold text-[#0f3d3e]">Recommended Mindful Reset</p>
                <p className="text-xs text-[#335c5d]">
                  Practice 4-7-8 breathing or gentle yoga to release physical tension.
                </p>
              </div>
            </div>
            {onNavigateToWellness && (
              <button
                type="button"
                onClick={onNavigateToWellness}
                className="px-3.5 py-2 bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white rounded-xl text-xs font-semibold hover:brightness-105 transition-all shrink-0 whitespace-nowrap min-h-[40px]"
              >
                Try Routine
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#cce7e3]">
            <h3 className="text-sm font-bold text-[#0f3d3e] mb-1">Reflect on your results</h3>
            <p className="text-xs text-[#4b7476] mb-3">
              Save these results to your PIN-protected Private Journal to monitor your progress.
            </p>

            {!journalSaved ? (
              <>
                <textarea
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  className="w-full h-28 p-3.5 bg-[#f4fbfa] border border-[#cce7e3] rounded-xl focus:outline-none focus:border-[#0d9488] resize-none text-[#0f3d3e] text-xs leading-relaxed"
                  placeholder="How are you feeling right now?..."
                />
                <button
                  type="button"
                  onClick={handleSaveJournal}
                  disabled={isSavingJournal || !journalContent.trim()}
                  className="mt-3 w-full bg-[#0d9488] text-white font-semibold py-3 rounded-xl hover:bg-[#0f766e] transition-colors text-xs disabled:bg-[#cce7e3] disabled:text-[#4b7476] min-h-[44px]"
                >
                  {isSavingJournal ? 'Saving...' : 'Save to Private Journal'}
                </button>
              </>
            ) : (
              <div className="bg-[#eaf6f4] text-[#0f3d3e] p-3.5 rounded-xl text-center text-xs font-semibold border border-[#bfe3dd]">
                Saved to your Private Journal
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => handleSwitchQuiz(selectedQuiz === 'berkeley' ? 'pss' : 'berkeley')}
              className="flex-1 py-3 text-[#0f3d3e] font-semibold bg-white hover:bg-[#eaf6f4] rounded-xl text-xs transition-colors border border-[#cce7e3] min-h-[44px]"
            >
              Take {selectedQuiz === 'berkeley' ? 'PSS-10' : 'UC Berkeley'} Quiz
            </button>
            <button
              type="button"
              onClick={onComplete}
              className="flex-1 py-3 text-white font-semibold bg-[#0d9488] hover:bg-[#0f766e] rounded-xl text-xs transition-colors min-h-[44px]"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = activeQuestions[currentQuestionIndex];
  const isBerkeley = selectedQuiz === 'berkeley';

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-gradient-to-b from-[#eefaf7] via-[#f4fbff] to-[#fff8f4] overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full flex-grow flex flex-col">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onComplete}
              aria-label="Go back"
              className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl hover:bg-[#e3f7f3] text-[#4b7476] hover:text-[#0f3d3e] transition-colors flex items-center justify-center"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-[#0f3d3e] font-serif-elegant">
              {isBerkeley ? 'Stress & Anxiety Quiz' : 'Perceived Stress Scale'}
            </h1>
          </div>

          {/* Quiz Selector Toggle */}
          <div className="flex items-center bg-gradient-to-r from-[#e6faf6] to-[#eef2ff] border border-[#bde6de] p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleSwitchQuiz('berkeley')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                isBerkeley
                  ? 'bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white shadow-xs'
                  : 'text-[#335c5d] hover:text-[#0f3d3e]'
              }`}
            >
              UC Berkeley (16)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchQuiz('pss')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                !isBerkeley
                  ? 'bg-gradient-to-r from-[#4f46e5] to-[#0284c7] text-white shadow-xs'
                  : 'text-[#335c5d] hover:text-[#0f3d3e]'
              }`}
            >
              PSS-10 (10)
            </button>
          </div>
        </div>

        {/* Berkeley Source Info */}
        {isBerkeley && (
          <div className="mb-4 px-4 py-3 bg-gradient-to-r from-white to-[#eff9ff] border border-[#bae6fd] rounded-2xl flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#0f3d3e]">
                Greater Good Science Center · UC Berkeley
              </p>
              <p className="text-xs text-[#4b7476] mt-0.5">
                How much did each statement apply to you over the past week?
              </p>
            </div>
            <span className="text-xs font-bold text-[#4f46e5] shrink-0">DASS-21</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-[#dff1ee] rounded-full h-2.5 mb-5 overflow-hidden">
          <div
            className="h-2.5 rounded-full transition-all duration-300 bg-gradient-to-r from-[#14b8a6] via-[#0ea5e9] to-[#6366f1]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Area */}
        <div className="flex-grow flex flex-col justify-center text-center max-w-lg mx-auto w-full py-4">
          <div className="flex items-center justify-between mb-4 px-1">
            {currentQuestionIndex > 0 ? (
              <button
                type="button"
                onClick={handlePreviousQuestion}
                className="text-xs font-semibold text-[#4b7476] hover:text-[#0f3d3e] py-1 px-2"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 text-xs text-[#4b7476] font-medium">
              {isBerkeley && 'subscale' in currentQ && (
                <>
                  <span className="capitalize font-semibold text-[#0f766e]">
                    {(currentQ as any).subscale}
                  </span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span className="font-mono-num">
                {currentQuestionIndex + 1} of {activeQuestions.length}
              </span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold text-[#0f3d3e] mb-8 leading-snug px-2 min-h-[4rem] flex items-center justify-center text-balance">
            "{currentQ.question}"
          </h2>

          <div className="space-y-2.5">
            {currentQ.options.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className="w-full bg-white text-[#0f3d3e] font-medium py-3.5 px-4 rounded-xl border border-[#bde6de] hover:bg-gradient-to-r hover:from-[#e6faf6] hover:to-[#eff9ff] hover:border-[#0d9488] transition-colors text-sm sm:text-base flex items-center justify-between group min-h-[48px] active:scale-[0.99]"
              >
                <span className="text-left pr-3">{option.text}</span>
                <span className="w-7 h-7 rounded-lg bg-[#e6faf6] group-hover:bg-[#0d9488] text-[#0f766e] group-hover:text-white text-xs font-bold font-mono-num flex items-center justify-center shrink-0 transition-colors">
                  {option.value}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;