export interface DailyAffirmation {
  id: string;
  quote: string;
  author: string;
  theme: 'general' | 'focus' | 'peace' | 'confidence' | 'rest';
  themeLabel: string;
  reflectionPrompt: string;
  bgGradient: string;
  accentColor: string;
}

export const AFFIRMATION_THEMES = [
  { id: 'all', label: 'All Vibes', emoji: '✨' },
  { id: 'focus', label: 'Study & Exams', emoji: '📚' },
  { id: 'peace', label: 'Calm & Anxiety', emoji: '🌿' },
  { id: 'confidence', label: 'Self-Worth', emoji: '💪' },
  { id: 'rest', label: 'Rest & Recharge', emoji: '🌙' },
] as const;

export const CURATED_AFFIRMATIONS: DailyAffirmation[] = [
  {
    id: 'aff-1',
    quote: "You don't have to be extreme, just consistent. Small daily progress builds monumental confidence.",
    author: "MindGuard Wisdom",
    theme: 'general',
    themeLabel: 'Consistency',
    reflectionPrompt: "What is one small step you can take today that your future self will thank you for?",
    bgGradient: "from-[#ccf7ef] via-[#e6faf6] to-[#e0e7ff]",
    accentColor: "text-[#0f766e]"
  },
  {
    id: 'aff-2',
    quote: "Your grades reflect where you are in the learning journey today, not the limits of what your mind can achieve.",
    author: "Carol Dweck",
    theme: 'focus',
    themeLabel: 'Growth Mindset',
    reflectionPrompt: "Which difficult topic can you look at with curiosity instead of fear today?",
    bgGradient: "from-[#d8f1ff] via-[#eef8ff] to-[#d9f7f2]",
    accentColor: "text-[#0369a1]"
  },
  {
    id: 'aff-3',
    quote: "Breathe in peace, exhale tension. You are capable of handling whatever this day brings, one moment at a time.",
    author: "MindGuard Mindfulness",
    theme: 'peace',
    themeLabel: 'Inner Calm',
    reflectionPrompt: "Take a deep breath right now. What can you gently let go of control over?",
    bgGradient: "from-[#c9f6ee] via-[#e9fbf8] to-[#dcf5e8]",
    accentColor: "text-[#0f766e]"
  },
  {
    id: 'aff-4',
    quote: "You have survived 100% of your hardest days, toughest exams, and greatest doubts. You are far braver than you think.",
    author: "Matt Haig",
    theme: 'confidence',
    themeLabel: 'Resilience',
    reflectionPrompt: "Remember a time you overcame something that once terrified you. How did you do it?",
    bgGradient: "from-[#ffe6d5] via-[#fff4ed] to-[#ffe4eb]",
    accentColor: "text-[#c2410c]"
  },
  {
    id: 'aff-5',
    quote: "Rest is not a reward for finished work; rest is a biological necessity that allows your brain to thrive.",
    author: "Dr. Saundra Dalton-Smith",
    theme: 'rest',
    themeLabel: 'Recharge',
    reflectionPrompt: "How can you give yourself permission to step away from your screen for 15 minutes today?",
    bgGradient: "from-[#e0e7ff] via-[#eef2ff] to-[#f3e8ff]",
    accentColor: "text-[#4338ca]"
  },
  {
    id: 'aff-6',
    quote: "Mistakes are proof that you are stretching your mind into new territory. Celebrate the courage to try.",
    author: "MindGuard Student Guide",
    theme: 'focus',
    themeLabel: 'Learning',
    reflectionPrompt: "What did a recent mistake teach you that you wouldn't have learned otherwise?",
    bgGradient: "from-[#cffafe] via-[#ecfeff] to-[#e0e7ff]",
    accentColor: "text-[#0e7490]"
  },
  {
    id: 'aff-7',
    quote: "Almost everything will work again if you unplug it for a few minutes, including you.",
    author: "Anne Lamott",
    theme: 'peace',
    themeLabel: 'Reset',
    reflectionPrompt: "What is your favorite way to unplug when your thoughts feel noisy?",
    bgGradient: "from-[#d1fae5] via-[#ecfdf5] to-[#d9f7f2]",
    accentColor: "text-[#047857]"
  },
  {
    id: 'aff-8',
    quote: "Do not compare your Chapter 1 to someone else's Chapter 20. Your pace is authentic and entirely your own.",
    author: "Jon Acuff",
    theme: 'confidence',
    themeLabel: 'Individuality',
    reflectionPrompt: "What unique strength or quality do you bring to your studies and friendships?",
    bgGradient: "from-[#ffe4e6] via-[#fff1f2] to-[#ffedd5]",
    accentColor: "text-[#be123c]"
  },
  {
    id: 'aff-9',
    quote: "Focus is saying 'no' to good distractions so you can say a powerful 'yes' to what truly matters to you.",
    author: "Steve Jobs",
    theme: 'focus',
    themeLabel: 'Clarity',
    reflectionPrompt: "What is the single most important task you want to finish calmly today?",
    bgGradient: "from-[#d5f5fb] via-[#ecfbff] to-[#dbeafe]",
    accentColor: "text-[#0e7490]"
  },
  {
    id: 'aff-10',
    quote: "Talk to yourself like you would to someone you truly love. Self-kindness unlocks true potential.",
    author: "Brené Brown",
    theme: 'peace',
    themeLabel: 'Compassion',
    reflectionPrompt: "What words of encouragement would you offer your best friend if they were stressed today?",
    bgGradient: "from-[#ccf7ef] via-[#f0fdfb] to-[#fae8ff]",
    accentColor: "text-[#0f766e]"
  },
  {
    id: 'aff-11',
    quote: "You don't have to carry the whole semester at once. You only need to navigate the next hour.",
    author: "MindGuard Mental Care",
    theme: 'general',
    themeLabel: 'Presence',
    reflectionPrompt: "Break down whatever is overwhelming you into just the next 20 minutes.",
    bgGradient: "from-[#d7f7f0] via-[#ecfcf8] to-[#e0f2fe]",
    accentColor: "text-[#0f766e]"
  },
  {
    id: 'aff-12',
    quote: "When you feel like giving up, remember why you started and give yourself credit for how far you've climbed.",
    author: "Arthur Ashe",
    theme: 'confidence',
    themeLabel: 'Grit',
    reflectionPrompt: "What made you curious about your favorite subject in the beginning?",
    bgGradient: "from-[#fef3c7] via-[#fffbeb] to-[#ffedd5]",
    accentColor: "text-[#b45309]"
  },
  {
    id: 'aff-13',
    quote: "A quiet, calm mind is the sharpest tool for problem solving. Breathe deeply before you begin.",
    author: "MindGuard Studio",
    theme: 'peace',
    themeLabel: 'Poise',
    reflectionPrompt: "Before starting your next study block, take 3 slow breaths.",
    bgGradient: "from-[#ccfbf1] via-[#f0fdfa] to-[#e0f2fe]",
    accentColor: "text-[#0f766e]"
  },
  {
    id: 'aff-14',
    quote: "Your curiosity is an engine that can unlock any subject. Don't study just to pass; study to discover.",
    author: "Albert Einstein",
    theme: 'focus',
    themeLabel: 'Curiosity',
    reflectionPrompt: "What is a fun question you'd love to know the answer to this week?",
    bgGradient: "from-[#dbeafe] via-[#eff6ff] to-[#d1fae5]",
    accentColor: "text-[#1d4ed8]"
  },
  {
    id: 'aff-15',
    quote: "Allowing yourself to sleep and unwind without guilt is the greatest gift you can give your memory and mood.",
    author: "Matthew Walker",
    theme: 'rest',
    themeLabel: 'Sleep & Mind',
    reflectionPrompt: "What time will you wind down tonight to protect your peace?",
    bgGradient: "from-[#e0e7ff] via-[#eef2ff] to-[#cffafe]",
    accentColor: "text-[#4338ca]"
  },
  {
    id: 'aff-16',
    quote: "You are not an imposter; you are a student learning in real time. Growth always feels uncertain at first.",
    author: "Adam Grant",
    theme: 'confidence',
    themeLabel: 'Self-Trust',
    reflectionPrompt: "What is something that felt impossible a year ago that feels normal today?",
    bgGradient: "from-[#fce7f3] via-[#fdf2f8] to-[#e0e7ff]",
    accentColor: "text-[#be185d]"
  },
  {
    id: 'aff-17',
    quote: "Courage does not always roar. Sometimes courage is the quiet voice at the end of the day saying, 'I will try again tomorrow.'",
    author: "Mary Anne Radmacher",
    theme: 'general',
    themeLabel: 'Gentle Courage',
    reflectionPrompt: "How can you be proud of your effort today regardless of the outcome?",
    bgGradient: "from-[#ffedd5] via-[#fff7ed] to-[#d9f7f2]",
    accentColor: "text-[#c2410c]"
  },
  {
    id: 'aff-18',
    quote: "Anxiety pretends to prevent disaster, but action—even the smallest step—is what brings peace.",
    author: "Mel Robbins",
    theme: 'peace',
    themeLabel: 'Taking Action',
    reflectionPrompt: "What tiny 2-minute action can you take to ease whatever is on your mind?",
    bgGradient: "from-[#d1fae5] via-[#ecfdf5] to-[#e0f2fe]",
    accentColor: "text-[#047857]"
  },
  {
    id: 'aff-19',
    quote: "Smart questions are far more valuable than easy answers. Never hesitate to ask for help when you're stuck.",
    author: "Carl Sagan",
    theme: 'focus',
    themeLabel: 'Seeking Support',
    reflectionPrompt: "Who is a teacher, friend, or mentor you can reach out to if you need advice?",
    bgGradient: "from-[#cffafe] via-[#ecfeff] to-[#dbeafe]",
    accentColor: "text-[#0369a1]"
  },
  {
    id: 'aff-20',
    quote: "You have a voice, you have ideas, and you belong in the room where decisions and discoveries happen.",
    author: "Sonia Sotomayor",
    theme: 'confidence',
    themeLabel: 'Belonging',
    reflectionPrompt: "Speak up with kindness today—your perspective is worthy.",
    bgGradient: "from-[#f3e8ff] via-[#faf5ff] to-[#ffe4e6]",
    accentColor: "text-[#7e22ce]"
  },
  {
    id: 'aff-21',
    quote: "Downtime is where creativity takes root. Give your subconscious space to wander and dream.",
    author: "Maria Popova",
    theme: 'rest',
    themeLabel: 'Mind Wandering',
    reflectionPrompt: "Step outside or look out a window for 5 minutes without checking notifications.",
    bgGradient: "from-[#ccf7ef] via-[#effcf9] to-[#ede9fe]",
    accentColor: "text-[#0f766e]"
  },
  {
    id: 'aff-22',
    quote: "Pressure produces diamonds, but only when balanced with patience and genuine care.",
    author: "MindGuard Wellness",
    theme: 'general',
    themeLabel: 'Balance',
    reflectionPrompt: "Are you being too hard on yourself lately? Where can you soften your expectations?",
    bgGradient: "from-[#e0f2fe] via-[#f0f9ff] to-[#fce7f3]",
    accentColor: "text-[#0369a1]"
  },
  {
    id: 'aff-23',
    quote: "Clarity comes from engagement, not from overthinking. Put pen to paper and watch the fog clear.",
    author: "Marie Forleo",
    theme: 'focus',
    themeLabel: 'Action Over Stagnation',
    reflectionPrompt: "Write down the first 3 lines of your assignment without judging the quality.",
    bgGradient: "from-[#d5f5fb] via-[#ecfbff] to-[#d1fae5]",
    accentColor: "text-[#0e7490]"
  },
  {
    id: 'aff-24',
    quote: "You are not your thoughts; you are the calm sky observing the passing weather of your thoughts.",
    author: "Tara Brach",
    theme: 'peace',
    themeLabel: 'Mindful Detachment',
    reflectionPrompt: "Notice an anxious thought and imagine it as a cloud drifting across the blue sky.",
    bgGradient: "from-[#dbeafe] via-[#eff6ff] to-[#ccf7ef]",
    accentColor: "text-[#1d4ed8]"
  },
  {
    id: 'aff-25',
    quote: "Trust the timing of your life. Everyone blooms in their own season under the right care and patience.",
    author: "Morgan Harper Nichols",
    theme: 'confidence',
    themeLabel: 'Patience & Blooming',
    reflectionPrompt: "What is something you enjoy that has nothing to do with school rankings or grades?",
    bgGradient: "from-[#ffe4e6] via-[#fff1f2] to-[#fef3c7]",
    accentColor: "text-[#be123c]"
  },
  {
    id: 'aff-26',
    quote: "When you protect your energy, you have more light to illuminate everything you pursue.",
    author: "Robin Sharma",
    theme: 'rest',
    themeLabel: 'Energy Shield',
    reflectionPrompt: "What drained your energy recently, and how can you set a healthy boundary?",
    bgGradient: "from-[#ede9fe] via-[#f5f3ff] to-[#cffafe]",
    accentColor: "text-[#6d28d9]"
  },
  {
    id: 'aff-27',
    quote: "The secret of getting ahead is getting started. Break your complex tasks into small, bite-sized joys.",
    author: "Mark Twain",
    theme: 'focus',
    themeLabel: 'Starting Simple',
    reflectionPrompt: "What is a 5-minute piece of your study guide you can knock out easily?",
    bgGradient: "from-[#d1fae5] via-[#ecfdf5] to-[#fef3c7]",
    accentColor: "text-[#047857]"
  },
  {
    id: 'aff-28',
    quote: "You are worthy of love, respect, and peace just because you exist—not because of what you produce.",
    author: "Haemin Sunim",
    theme: 'peace',
    themeLabel: 'Unconditional Worth',
    reflectionPrompt: "Remind yourself: I am human, not a productivity machine.",
    bgGradient: "from-[#ccf7ef] via-[#f0fdfa] to-[#fce7f3]",
    accentColor: "text-[#0f766e]"
  },
  {
    id: 'aff-29',
    quote: "Believe in the person you are becoming. Every challenge you tackle is forging your character.",
    author: "Theodore Roosevelt",
    theme: 'confidence',
    themeLabel: 'Character',
    reflectionPrompt: "What is one character trait you are proud of developing this year?",
    bgGradient: "from-[#fef3c7] via-[#fffbeb] to-[#e0f2fe]",
    accentColor: "text-[#b45309]"
  },
  {
    id: 'aff-30',
    quote: "A well-rested student with a peaceful heart will outshine an exhausted mind every single time.",
    author: "MindGuard Counsel",
    theme: 'rest',
    themeLabel: 'Restorative Wellness',
    reflectionPrompt: "Celebrate finishing today's tasks and prepare for deep, rejuvenating rest.",
    bgGradient: "from-[#e0e7ff] via-[#eef2ff] to-[#d1fae5]",
    accentColor: "text-[#4338ca]"
  },
  {
    id: 'aff-31',
    quote: "Today is a fresh canvas. Bring your authentic curiosity, your genuine effort, and your warm smile.",
    author: "MindGuard Inspiration",
    theme: 'general',
    themeLabel: 'Fresh Start',
    reflectionPrompt: "What positive tone do you want to set for yourself right now?",
    bgGradient: "from-[#ccf7ef] via-[#e9fbf8] to-[#ffedd5]",
    accentColor: "text-[#0f766e]"
  }
];

export function getDailyIndexForDate(date: Date = new Date()): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - startOfYear.getTime()) + ((startOfYear.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return dayOfYear;
}

export function getDailyAffirmation(
  date: Date = new Date(),
  studentName?: string,
  themeFilter: string = 'all'
): DailyAffirmation {
  const dayIndex = getDailyIndexForDate(date);
  
  let pool = CURATED_AFFIRMATIONS;
  if (themeFilter && themeFilter !== 'all') {
    pool = CURATED_AFFIRMATIONS.filter(a => a.theme === themeFilter);
    if (pool.length === 0) pool = CURATED_AFFIRMATIONS;
  }
  
  const picked = pool[Math.abs(dayIndex) % pool.length];
  
  // Personalize quote if studentName is provided and doesn't already contain it
  let personalizedQuote = picked.quote;
  const cleanName = studentName?.trim();
  if (cleanName && cleanName.toLowerCase() !== 'student') {
    // Inject personalized prefix or greeting smoothly
    personalizedQuote = `${cleanName}, remember: ${picked.quote.charAt(0).toLowerCase() + picked.quote.slice(1)}`;
  }
  
  return {
    ...picked,
    quote: personalizedQuote
  };
}

// Streak Tracking Functions
export interface AffirmationStreakInfo {
  streak: number;
  lastViewedDate: string; // YYYY-MM-DD
  todayViewed: boolean;
}

export function getAffirmationStreak(): AffirmationStreakInfo {
  try {
    const raw = localStorage.getItem('mindguard_affirmation_streak_data');
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (!raw) {
      return { streak: 1, lastViewedDate: todayStr, todayViewed: false };
    }
    
    const parsed = JSON.parse(raw);
    const lastDate = parsed.lastViewedDate;
    const today = new Date(todayStr);
    const last = new Date(lastDate);
    const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return { streak: parsed.streak || 1, lastViewedDate: todayStr, todayViewed: true };
    } else if (diffDays === 1) {
      // Consecutive day!
      return { streak: parsed.streak || 1, lastViewedDate: lastDate, todayViewed: false };
    } else {
      // Streak broken
      return { streak: 1, lastViewedDate: lastDate, todayViewed: false };
    }
  } catch {
    return { streak: 1, lastViewedDate: new Date().toISOString().split('T')[0], todayViewed: false };
  }
}

export function markAffirmationViewedToday(): number {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const streakInfo = getAffirmationStreak();
    
    if (streakInfo.todayViewed) {
      return streakInfo.streak;
    }
    
    const today = new Date(todayStr);
    const last = new Date(streakInfo.lastViewedDate);
    const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    
    let newStreak = 1;
    if (diffDays === 1) {
      newStreak = (streakInfo.streak || 1) + 1;
    } else if (diffDays === 0) {
      newStreak = streakInfo.streak;
    }
    
    localStorage.setItem('mindguard_affirmation_streak_data', JSON.stringify({
      streak: newStreak,
      lastViewedDate: todayStr
    }));
    return newStreak;
  } catch {
    return 1;
  }
}

// Favorites persistence
export function getFavoriteAffirmations(): DailyAffirmation[] {
  try {
    const raw = localStorage.getItem('mindguard_favorite_affirmations');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteAffirmation(item: DailyAffirmation): boolean {
  try {
    const list = getFavoriteAffirmations();
    const exists = list.some(fav => fav.quote === item.quote);
    let updated: DailyAffirmation[];
    if (exists) {
      updated = list.filter(fav => fav.quote !== item.quote);
    } else {
      updated = [item, ...list];
    }
    localStorage.setItem('mindguard_favorite_affirmations', JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
}

export function isAffirmationFavorited(quote: string): boolean {
  try {
    const list = getFavoriteAffirmations();
    return list.some(fav => fav.quote === quote);
  } catch {
    return false;
  }
}
