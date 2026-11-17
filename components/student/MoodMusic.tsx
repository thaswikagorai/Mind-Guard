import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MOOD_MUSIC_TRACKS } from '../../constants';
import { MusicTrack, MusicCategory } from '../../types';
import { ChevronLeftIcon, PlayIcon, SpeakerWaveIcon, ClockIcon, SparklesIcon } from '../icons';
import { recommendMusicCategory } from '../../services/geminiService';
import Card from '../common/Card';

interface MoodMusicProps {
  onBack: () => void;
}

const CATEGORIES: MusicCategory[] = ['Relax', 'Focus', 'Sleep', 'Happy'];

const SOUNDSCAPE_PROFILES: Record<
  MusicCategory,
  {
    rootFreq: number;
    chordRatios: number[];
    filterFreq: number;
    noiseMix: number;
    chimeIntervalMs: number;
    tagline: string;
  }
> = {
  Relax: {
    rootFreq: 174.61, // F3 warm harmonic pad
    chordRatios: [1, 1.25, 1.5, 1.875],
    filterFreq: 520,
    noiseMix: 0.22,
    chimeIntervalMs: 4200,
    tagline: 'Gentle stream & warm chord wash',
  },
  Focus: {
    rootFreq: 220, // A3 calm study resonance
    chordRatios: [1, 1.2, 1.5],
    filterFreq: 680,
    noiseMix: 0.18,
    chimeIntervalMs: 3000,
    tagline: 'Soft study drone & steady felt notes',
  },
  Sleep: {
    rootFreq: 130.81, // C3 deep restful hum
    chordRatios: [1, 1.5, 2],
    filterFreq: 340,
    noiseMix: 0.34,
    chimeIntervalMs: 6500,
    tagline: 'Filtered rainfall & slow low harmonic',
  },
  Happy: {
    rootFreq: 261.63, // C4 bright uplifting major9
    chordRatios: [1, 1.25, 1.5, 2.25],
    filterFreq: 960,
    noiseMix: 0.12,
    chimeIntervalMs: 2400,
    tagline: 'Sunlit pentatonic chimes & warm air',
  },
};

const PauseGlyph = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
      clipRule="evenodd"
    />
  </svg>
);

const MoodMusic: React.FC<MoodMusicProps> = ({ onBack }) => {
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.55);
  const [activeCategory, setActiveCategory] = useState<MusicCategory | 'All'>('All');
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiStatusNote, setAiStatusNote] = useState<string | null>(null);
  const [showAiSearch, setShowAiSearch] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const activeNodesRef = useRef<Array<{ stop?: () => void; disconnect: () => void }>>([]);
  const chimeTimerRef = useRef<number | null>(null);
  const sleepTimerRef = useRef<number | null>(null);
  const timeLeftRef = useRef<number | null>(null);

  const stopAudioEngine = useCallback(() => {
    if (chimeTimerRef.current !== null) {
      window.clearInterval(chimeTimerRef.current);
      chimeTimerRef.current = null;
    }
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (ctx && master) {
      try {
        master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
      } catch {
        // ignore audio scheduling failure
      }
    }
    activeNodesRef.current.forEach((node) => {
      try {
        node.stop?.();
      } catch {
        // ignore already stopped
      }
      try {
        node.disconnect();
      } catch {
        // ignore disconnect failure
      }
    });
    activeNodesRef.current = [];
  }, []);

  const startSoundscape = useCallback(
    async (track: MusicTrack, targetVolume: number) => {
      stopAudioEngine();

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        setIsPlaying(true);
        return;
      }

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {
          // ignore autoplay restriction error
        }
      }

      const profile = SOUNDSCAPE_PROFILES[track.category];
      const trackOffset = (Number(track.id) % 3) * 0.06 + 0.97; // subtle variation per track

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(
        Math.max(0.01, targetVolume * 0.45),
        ctx.currentTime + 0.8
      );
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      const createdNodes: Array<{ stop?: () => void; disconnect: () => void }> = [masterGain];

      // 1. Warm brown-ish noise generator for rain / airflow texture
      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.03 * white) / 1.03;
        lastOut = output[i];
        output[i] *= 2.6;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(profile.filterFreq, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(profile.noiseMix, ctx.currentTime);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSource.start();
      createdNodes.push(noiseSource, noiseFilter, noiseGain);

      // 2. Soft ambient harmonic drone voices
      profile.chordRatios.forEach((ratio, idx) => {
        const osc = ctx.createOscillator();
        const voiceGain = ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(profile.rootFreq * ratio * trackOffset, ctx.currentTime);

        const voiceFilter = ctx.createBiquadFilter();
        voiceFilter.type = 'lowpass';
        voiceFilter.frequency.setValueAtTime(profile.filterFreq * 1.4, ctx.currentTime);

        voiceGain.gain.setValueAtTime(0.075 / (idx + 1), ctx.currentTime);

        osc.connect(voiceFilter);
        voiceFilter.connect(voiceGain);
        voiceGain.connect(masterGain);
        osc.start();
        createdNodes.push(osc, voiceFilter, voiceGain);
      });

      // 3. Occasional delicate harmonic chime bell notes
      const pentatonic = [1, 1.125, 1.25, 1.5, 1.667, 2];
      const triggerChime = () => {
        if (!audioCtxRef.current || !masterGainRef.current) return;
        const c = audioCtxRef.current;
        const chimeOsc = c.createOscillator();
        const chimeGain = c.createGain();
        const interval = pentatonic[Math.floor(Math.random() * pentatonic.length)];
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(profile.rootFreq * 2 * interval * trackOffset, c.currentTime);

        chimeGain.gain.setValueAtTime(0.0001, c.currentTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.06, c.currentTime + 0.15);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 2.8);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(masterGainRef.current);
        chimeOsc.start();
        chimeOsc.stop(c.currentTime + 2.9);
      };

      chimeTimerRef.current = window.setInterval(triggerChime, profile.chimeIntervalMs);
      activeNodesRef.current = createdNodes;
      setIsPlaying(true);
    },
    [stopAudioEngine]
  );

  // Sync live volume changes to active AudioContext
  useEffect(() => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (ctx && master && isPlaying) {
      try {
        master.gain.setTargetAtTime(Math.max(0.0001, volume * 0.45), ctx.currentTime, 0.08);
      } catch {
        // ignore
      }
    }
  }, [volume, isPlaying]);

  const clearTimer = useCallback(() => {
    if (sleepTimerRef.current !== null) {
      window.clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    timeLeftRef.current = null;
  }, []);

  const startTimer = (durationInSeconds: number) => {
    clearTimer();
    timeLeftRef.current = durationInSeconds;
    setTimeLeft(durationInSeconds);

    sleepTimerRef.current = window.setInterval(() => {
      if (timeLeftRef.current === null || timeLeftRef.current <= 1) {
        clearTimer();
        setTimeLeft(null);
        stopAudioEngine();
        setIsPlaying(false);
        return;
      }
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      clearTimer();
      stopAudioEngine();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => undefined);
      }
    };
  }, [clearTimer, stopAudioEngine]);

  const handleTrackToggle = (track: MusicTrack) => {
    if (selectedTrack?.id === track.id && isPlaying) {
      stopAudioEngine();
      setIsPlaying(false);
      return;
    }
    setSelectedTrack(track);
    startSoundscape(track, volume);
  };

  const handleToggleCurrentPlayPause = () => {
    if (!selectedTrack) return;
    if (isPlaying) {
      stopAudioEngine();
      setIsPlaying(false);
    } else {
      startSoundscape(selectedTrack, volume);
    }
  };

  const handleAiRecommend = async () => {
    if (!aiInput.trim() || isAiLoading) return;
    setIsAiLoading(true);
    setAiStatusNote(null);
    try {
      const recommendation = await recommendMusicCategory(aiInput);
      const validCategory = CATEGORIES.find(
        (c) => c.toLowerCase() === recommendation.toLowerCase().replace(/['".\s]/g, '')
      );
      if (validCategory) {
        setActiveCategory(validCategory);
        const matchingTrack = MOOD_MUSIC_TRACKS.find((t) => t.category === validCategory);
        if (matchingTrack) {
          setSelectedTrack(matchingTrack);
          startSoundscape(matchingTrack, volume);
        }
        setShowAiSearch(false);
        setAiInput('');
      } else {
        setAiStatusNote('Picked Relax for you — tap any soundscape below to listen.');
        setActiveCategory('Relax');
      }
    } catch {
      setAiStatusNote('Could not reach music matcher right now. Choose any vibe below!');
    } finally {
      setIsAiLoading(false);
    }
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center min-w-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl hover:bg-[#eaf6f4] text-[#4b7476] hover:text-[#0f3d3e] transition-colors mr-2 flex items-center justify-center shrink-0"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0f3d3e] font-serif-elegant truncate">
                Mood Music
              </h1>
              <p className="text-xs text-[#4b7476] font-medium truncate">
                {timeLeft !== null ? (
                  <span className="inline-flex items-center text-[#0f766e] font-semibold font-mono-num">
                    <ClockIcon className="w-3.5 h-3.5 mr-1" />
                    Sleep timer: {formatTime(timeLeft)}
                  </span>
                ) : (
                  'In-app ambient soundscapes · No popups required'
                )}
              </p>
            </div>
          </div>

          <div className="flex space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAiSearch(!showAiSearch)}
              className={`min-w-[44px] min-h-[44px] px-3 rounded-xl border transition-colors flex items-center justify-center ${
                showAiSearch
                  ? 'bg-[#0d9488] text-white border-[#0d9488]'
                  : 'bg-white text-[#4b7476] border-[#cce7e3] hover:text-[#0f3d3e] hover:bg-[#eaf6f4]'
              }`}
              title="AI Vibe Matcher"
              aria-label="AI music recommendation"
            >
              <SparklesIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsTimerModalOpen(true)}
              className={`min-w-[44px] min-h-[44px] px-3 border rounded-xl transition-colors flex items-center justify-center ${
                timeLeft !== null
                  ? 'bg-[#e6faf6] border-[#0d9488] text-[#0f766e]'
                  : 'bg-white text-[#4b7476] border-[#cce7e3] hover:text-[#0f3d3e] hover:bg-[#eaf6f4]'
              }`}
              title="Set Sleep Timer"
              aria-label="Set sleep timer"
            >
              <ClockIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Search Bar */}
        {showAiSearch && (
          <div className="mb-4">
            <Card className="p-4 border border-[#cce7e3] bg-white space-y-2">
              <p className="text-xs font-semibold text-[#0f3d3e]">
                Describe how you are feeling or what you are working on
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiRecommend()}
                  placeholder="Ex: I need calm focus for chemistry revision..."
                  className="flex-grow px-4 py-2.5 bg-[#f4fbfa] border border-[#cce7e3] rounded-xl text-sm text-[#0f3d3e] placeholder-[#7ca1a3] focus:outline-none focus:border-[#0d9488]"
                />
                <button
                  type="button"
                  onClick={handleAiRecommend}
                  disabled={isAiLoading || !aiInput.trim()}
                  className="bg-[#0d9488] text-white px-5 py-2.5 rounded-xl hover:bg-[#0f766e] transition-colors disabled:opacity-50 text-xs font-semibold min-h-[44px]"
                >
                  {isAiLoading ? 'Matching...' : 'Match'}
                </button>
              </div>
              {aiStatusNote && <p className="text-xs text-[#0f766e] font-medium">{aiStatusNote}</p>}
            </Card>
          </div>
        )}

        {/* Active In-App Player Controller */}
        {selectedTrack && (
          <Card className="mb-4 p-4 sm:p-5 rounded-2xl border border-[#8cd3ca] bg-gradient-to-r from-[#0f3d3e] via-[#134e4a] to-[#0c4a6e] text-white shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={handleToggleCurrentPlayPause}
                  aria-label={isPlaying ? `Pause ${selectedTrack.title}` : `Play ${selectedTrack.title}`}
                  className="w-12 h-12 rounded-2xl bg-white text-[#0f3d3e] hover:bg-[#e6faf6] flex items-center justify-center shrink-0 transition-transform active:scale-95"
                >
                  {isPlaying ? <PauseGlyph className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5eead4]">
                      {isPlaying ? 'Playing In-App' : 'Paused'} · {selectedTrack.category}
                    </span>
                    {isPlaying && <Visualizer />}
                  </div>
                  <h2 className="font-serif-elegant font-bold text-base sm:text-lg truncate">
                    {selectedTrack.title}
                  </h2>
                  <p className="text-xs text-[#ccf7ef]/85 truncate">
                    {SOUNDSCAPE_PROFILES[selectedTrack.category].tagline}
                  </p>
                </div>
              </div>

              {/* Volume Control & Safe External Anchor */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                  <SpeakerWaveIcon className="w-4 h-4 text-[#99f6e4] shrink-0" />
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    aria-label="Soundscape volume"
                    className="w-20 sm:w-24 accent-[#2dd4bf] cursor-pointer"
                  />
                  <span className="text-[11px] font-mono-num text-[#ccf7ef] w-8 text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>

                <a
                  href={selectedTrack.youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white transition-colors whitespace-nowrap min-h-[38px] inline-flex items-center"
                >
                  YouTube ↗
                </a>
              </div>
            </div>
          </Card>
        )}

        {/* Segmented Category Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gradient-to-r from-[#e6faf6] via-[#eff9ff] to-[#ffe4e6] border border-[#bde6de] rounded-xl overflow-x-auto no-scrollbar mb-4 w-fit max-w-full">
          <button
            type="button"
            onClick={() => setActiveCategory('All')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 min-h-[36px] ${
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
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 min-h-[36px] ${
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
              const isSelected = selectedTrack?.id === track.id;
              const isTrackPlaying = isSelected && isPlaying;
              return (
                <Card
                  key={track.id}
                  onClick={() => handleTrackToggle(track)}
                  className={`relative overflow-hidden p-0 border-2 bg-gradient-to-br ${track.color} hover:brightness-105 ${
                    isSelected ? 'border-[#0f3d3e] shadow-md' : 'border-transparent'
                  }`}
                >
                  <div className="p-5 sm:p-6 flex justify-between items-center text-white">
                    <div className="flex-grow pr-4 min-w-0">
                      <div className="flex items-center space-x-2 text-xs text-white/90 font-medium mb-1">
                        <span>{track.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{track.artist}</span>
                        {isTrackPlaying && <Visualizer />}
                      </div>
                      <h3 className="font-bold text-lg font-serif-elegant leading-snug truncate">
                        {track.title}
                      </h3>
                      <p className="text-[11px] text-white/85 mt-1 truncate">
                        {SOUNDSCAPE_PROFILES[track.category].tagline}
                      </p>
                    </div>

                    <div className="w-12 h-12 bg-white/20 border border-white/25 rounded-2xl flex items-center justify-center shrink-0">
                      {isTrackPlaying ? (
                        <PauseGlyph className="w-6 h-6" />
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
                Automatically fade out your ambient soundscape when the timer ends.
              </p>

              <div className="grid grid-cols-2 gap-3 w-full mb-6">
                {[5, 15, 30, 45].map((min) => (
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