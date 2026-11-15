import React, { useState, useEffect, useRef } from 'react';
import { MOOD_MUSIC_TRACKS } from '../../constants';
import { MusicTrack, MusicCategory } from '../../types';
import { ChevronLeftIcon, PlayIcon, SpeakerWaveIcon, ClockIcon, SparklesIcon } from '../icons';
import { recommendMusicCategory } from '../../services/geminiService';
import Card from '../common/Card';

interface MoodMusicProps {
  onBack: () => void;
}

const CATEGORIES: MusicCategory[] = ['Relax', 'Focus', 'Sleep', 'Happy'];

const MoodMusic: React.FC<MoodMusicProps> = ({ onBack }) => {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<MusicCategory | 'All'>('All');
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [showAiSearch, setShowAiSearch] = useState(false);

  const timerIdRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  };

  const startTimer = (durationInSeconds: number) => {
    clearTimer();
    setTimeLeft(durationInSeconds);

    timerIdRef.current = window.setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime === null || prevTime <= 1) {
          clearTimer();
          setPlayingTrackId(null);
          return null;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const handlePlay = (track: MusicTrack) => {
    setPlayingTrackId(track.id);
    window.open(track.youtubeLink, '_blank', 'noopener,noreferrer');
  };

  const handleAiRecommend = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    const recommendation = await recommendMusicCategory(aiInput);
    const validCategory = CATEGORIES.find(
      (c) => c.toLowerCase() === recommendation.toLowerCase().replace(/['"]/g, '')
    ) as MusicCategory;
    if (validCategory) {
      setActiveCategory(validCategory);
      setShowAiSearch(false);
      setAiInput('');
    }
    setIsAiLoading(false);
  };

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTracks =
    activeCategory === 'All'
      ? MOOD_MUSIC_TRACKS
      : MOOD_MUSIC_TRACKS.filter((t) => t.category === activeCategory);

  const Visualizer = () => (
    <div className="flex items-end space-x-0.5 h-3.5 w-5" aria-hidden="true">
      <div className="w-1 bg-white animate-[music-bar_0.6s_ease-in-out_infinite_alternate]" />
      <div className="w-1 bg-white animate-[music-bar_0.8s_ease-in-out_infinite_alternate_0.2s]" />
      <div className="w-1 bg-white animate-[music-bar_0.5s_ease-in-out_infinite_alternate_0.1s]" />
      <div className="w-1 bg-white animate-[music-bar_0.7s_ease-in-out_infinite_alternate_0.3s]" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-gradient-to-b from-[#eefaf7] via-[#f4fbff] to-[#fff2f5] relative overflow-hidden">
      <style>{`
        @keyframes music-bar {
          from { height: 20%; }
          to { height: 100%; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center">
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl hover:bg-[#eaf6f4] text-[#4b7476] hover:text-[#0f3d3e] transition-colors mr-2 flex items-center justify-center"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0f3d3e] font-serif-elegant">
                Mood Music
              </h1>
              {timeLeft !== null && (
                <div className="flex items-center text-[#0f766e] text-xs font-semibold font-mono-num mt-0.5">
                  <ClockIcon className="w-3.5 h-3.5 mr-1" />
                  {formatTime(timeLeft)}
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowAiSearch(!showAiSearch)}
              className={`min-w-[44px] min-h-[44px] px-3 rounded-xl border transition-colors flex items-center justify-center ${
                showAiSearch
                  ? 'bg-[#0d9488] text-white border-[#0d9488]'
                  : 'bg-white text-[#4b7476] border-[#cce7e3] hover:text-[#0f3d3e] hover:bg-[#eaf6f4]'
              }`}
              title="AI Recommendation"
              aria-label="AI music recommendation"
            >
              <SparklesIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsTimerModalOpen(true)}
              className="min-w-[44px] min-h-[44px] px-3 bg-white text-[#4b7476] border border-[#cce7e3] hover:text-[#0f3d3e] hover:bg-[#eaf6f4] rounded-xl transition-colors flex items-center justify-center"
              title="Set Sleep Timer"
              aria-label="Set sleep timer"
            >
              <ClockIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Search Bar */}
        {showAiSearch && (
          <div className="mb-5">
            <Card className="p-4 border border-[#cce7e3] bg-white">
              <p className="text-xs font-semibold text-[#0f3d3e] mb-2">
                Describe how you are feeling
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiRecommend()}
                  placeholder="Ex: I need to stay calm while studying..."
                  className="flex-grow px-4 py-2.5 bg-[#f4fbfa] border border-[#cce7e3] rounded-xl text-sm text-[#0f3d3e] placeholder-[#7ca1a3] focus:outline-none focus:border-[#0d9488]"
                />
                <button
                  type="button"
                  onClick={handleAiRecommend}
                  disabled={isAiLoading || !aiInput.trim()}
                  className="bg-[#0d9488] text-white px-5 py-2.5 rounded-xl hover:bg-[#0f766e] transition-colors disabled:opacity-50 text-xs font-semibold min-h-[44px]"
                >
                  {isAiLoading ? 'Finding...' : 'Match'}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Segmented Category Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gradient-to-r from-[#e6faf6] via-[#eff9ff] to-[#ffe4e6] border border-[#bde6de] rounded-xl overflow-x-auto no-scrollbar mb-5 w-fit max-w-full">
          <button
            type="button"
            onClick={() => setActiveCategory('All')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              activeCategory === 'All'
                ? 'bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white shadow-xs'
                : 'text-[#335c5d] hover:text-[#0f3d3e]'
            }`}
          >
            All Tracks
          </button>
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white shadow-xs'
                  : 'text-[#335c5d] hover:text-[#0f3d3e]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Track Grid */}
        <div className="flex-grow overflow-y-auto pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredTracks.map((track) => {
              const isPlaying = playingTrackId === track.id;
              return (
                <Card
                  key={track.id}
                  onClick={() => handlePlay(track)}
                  className={`relative overflow-hidden p-0 border-none bg-gradient-to-br ${track.color} hover:brightness-105`}
                >
                  <div className="p-5 sm:p-6 flex justify-between items-center text-white">
                    <div className="flex-grow pr-4 min-w-0">
                      <div className="flex items-center space-x-2 text-xs text-white/85 font-medium mb-1">
                        <span>{track.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{track.artist}</span>
                        {isPlaying && <Visualizer />}
                      </div>
                      <h3 className="font-bold text-lg font-serif-elegant leading-snug truncate">
                        {track.title}
                      </h3>
                    </div>

                    <div className="w-12 h-12 bg-white/20 border border-white/25 rounded-2xl flex items-center justify-center shrink-0">
                      {isPlaying ? (
                        <SpeakerWaveIcon className="w-6 h-6" />
                      ) : (
                        <PlayIcon className="w-6 h-6" />
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sleep Timer Modal */}
      {isTimerModalOpen && (
        <div
          className="fixed inset-0 bg-[#0f3d3e]/40 backdrop-blur-xs flex items-center justify-center z-50 p-5"
          onClick={() => setIsTimerModalOpen(false)}
        >
          <Card
            className="w-full max-w-sm bg-white p-7 rounded-3xl border border-[#cce7e3] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-[#eaf6f4] border border-[#cce7e3] rounded-2xl flex items-center justify-center mb-5">
                <ClockIcon className="w-7 h-7 text-[#0f766e]" />
              </div>
              <h3 className="text-2xl font-bold text-[#0f3d3e] font-serif-elegant mb-1.5">
                Sleep Timer
              </h3>
              <p className="text-xs sm:text-sm text-[#4b7476] mb-6 leading-relaxed">
                Unwind calmly without needing to manually turn off your music.
              </p>

              <div className="grid grid-cols-2 gap-3 w-full mb-6">
                {[15, 30, 45, 60].map((min) => (
                  <button
                    type="button"
                    key={min}
                    onClick={() => {
                      startTimer(min * 60);
                      setIsTimerModalOpen(false);
                    }}
                    className="p-3.5 rounded-xl bg-[#f4fbfa] text-[#0f3d3e] font-bold font-mono-num border border-[#cce7e3] hover:bg-[#eaf6f4] hover:border-[#0d9488] transition-colors min-h-[44px]"
                  >
                    {min}m
                  </button>
                ))}
              </div>

              <div className="flex flex-col w-full space-y-2">
                {timeLeft !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      clearTimer();
                      setTimeLeft(null);
                      setIsTimerModalOpen(false);
                    }}
                    className="w-full py-3 rounded-xl bg-rose-50 text-rose-700 font-semibold text-sm hover:bg-rose-100 transition-colors min-h-[44px]"
                  >
                    Stop Timer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsTimerModalOpen(false)}
                  className="w-full py-3 rounded-xl bg-[#0d9488] text-white font-semibold text-sm hover:bg-[#0f766e] transition-colors min-h-[44px]"
                >
                  Close
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MoodMusic;