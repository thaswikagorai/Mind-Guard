import { QuizQuestion, BerkeleyQuizQuestion, StressReportData, Alert, MusicTrack, ActivityLog } from './types';

export const PERCEIVED_STRESS_SCALE_QUESTIONS: (QuizQuestion & {isReversed?: boolean})[] = [
  {
    id: 1,
    question: "In the last month, how often have you been upset because of something that happened unexpectedly?",
    options: [
      { text: 'Never', value: 0 },
      { text: 'Almost Never', value: 1 },
      { text: 'Sometimes', value: 2 },
      { text: 'Fairly Often', value: 3 },
      { text: 'Very Often', value: 4 },
    ],
  },
  {
    id: 2,
    question: "In the last month, how often have you felt that you were unable to control the important things in your life?",
    options: [
      { text: 'Never', value: 0 },
      { text: 'Almost Never', value: 1 },
      { text: 'Sometimes', value: 2 },
      { text: 'Fairly Often', value: 3 },
      { text: 'Very Often', value: 4 },
    ],
  },
  {
    id: 3,
    question: "In the last month, how often have you felt nervous and stressed?",
    options: [
      { text: 'Never', value: 0 },
      { text: 'Almost Never', value: 1 },
      { text: 'Sometimes', value: 2 },
      { text: 'Fairly Often', value: 3 },
      { text: 'Very Often', value: 4 },
    ],
  },
  {
    id: 4,
    question: "In the last month, how often have you felt confident about your ability to handle your personal problems?",
    isReversed: true,
    options: [
      { text: 'Never', value: 0 },
      { text: 'Almost Never', value: 1 },
      { text: 'Sometimes', value: 2 },
      { text: 'Fairly Often', value: 3 },
      { text: 'Very Often', value: 4 },
    ],
  },
  {
    id: 5,
    question: "In the last month, how often have you felt that things were going your way?",
    isReversed: true,
    options: [
      { text: 'Never', value: 0 },
      { text: 'Almost Never', value: 1 },
      { text: 'Sometimes', value: 2 },
      { text: 'Fairly Often', value: 3 },
      { text: 'Very Often', value: 4 },
    ],
  },
  {
    id: 6,
    question: "In the last month, how often have you found that you could not cope with all the things that you had to do?",
    options: [
      { text: 'Never', value: 0 },
      { text: 'Almost Never', value: 1 },
      { text: 'Sometimes', value: 2 },
      { text: 'Fairly Often', value: 3 },
      { text: 'Very Often', value: 4 },
    ],
  },
  {
    id: 7,
    question: "In the last month, how often have you been able to control irritations in your life?",
    isReversed: true,
    options: [
      { text: 'Never', value: 0 },
      { text: 'Almost Never', value: 1 },
      { text: 'Sometimes', value: 2 },
      { text: 'Fairly Often', value: 3 },
      { text: 'Very Often', value: 4 },
    ],
  },
  {
    id: 8,
    question: "In the last month, how often have you felt that you were on top of things?",
    isReversed: true,
    options: [
      { text: 'Never', value: 0 },
      { text: 'Almost Never', value: 1 },
      { text: 'Sometimes', value: 2 },
      { text: 'Fairly Often', value: 3 },
      { text: 'Very Often', value: 4 },
    ],
  },
  {
    id: 9,
    question: "In the last month, how often have you been angered because of things that were outside of your control?",
    options: [
      { text: 'Never', value: 0 },
      { text: 'Almost Never', value: 1 },
      { text: 'Sometimes', value: 2 },
      { text: 'Fairly Often', value: 3 },
      { text: 'Very Often', value: 4 },
    ],
  },
  {
    id: 10,
    question: "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?",
    options: [
      { text: 'Never', value: 0 },
      { text: 'Almost Never', value: 1 },
      { text: 'Sometimes', value: 2 },
      { text: 'Fairly Often', value: 3 },
      { text: 'Very Often', value: 4 },
    ],
  },
];

export const BERKELEY_STRESS_ANXIETY_QUESTIONS: BerkeleyQuizQuestion[] = [
  {
    id: 1,
    question: "I found myself getting upset by quite trivial things.",
    subscale: 'stress',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 2,
    question: "I was aware of dryness of my mouth.",
    subscale: 'anxiety',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 3,
    question: "I experienced breathing difficulty (e.g., excessively rapid breathing, breathlessness in the absence of physical exertion).",
    subscale: 'anxiety',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 4,
    question: "I tended to overreact to situations.",
    subscale: 'stress',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 5,
    question: "I had a feeling of shakiness (e.g., legs going to give way).",
    subscale: 'anxiety',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 6,
    question: "I found myself getting upset rather easily.",
    subscale: 'stress',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 7,
    question: "I found myself getting impatient when I was delayed in any way (e.g., elevators, traffic lights, being kept waiting).",
    subscale: 'stress',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 8,
    question: "I perspired noticeably, even without high temperatures or physical exertion.",
    subscale: 'anxiety',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 9,
    question: "I felt scared without any good reason.",
    subscale: 'anxiety',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 10,
    question: "I was aware of the action of my heart in the absence of physical exertion (e.g., sense of heart rate increase, heart missing a beat).",
    subscale: 'anxiety',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 11,
    question: "I found that I was very irritable.",
    subscale: 'stress',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 12,
    question: "I felt I was close to panic.",
    subscale: 'anxiety',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 13,
    question: "I found it hard to calm down after something upset me.",
    subscale: 'stress',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 14,
    question: "I found it difficult to tolerate interruptions to what I was doing.",
    subscale: 'stress',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 15,
    question: "I was in a state of nervous tension with what I was doing.",
    subscale: 'stress',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
  {
    id: 16,
    question: "I was worried about situations in which I might panic and make a fool of myself.",
    subscale: 'anxiety',
    options: [
      { text: "Did not apply to me at all", value: 0 },
      { text: "Applied to me to some degree, or some of the time", value: 1 },
      { text: "Applied to me to a considerable degree, or a good part of time", value: 2 },
      { text: "Applied to me very much, or most of the time", value: 3 },
    ],
  },
];



export const STUDENT_DATA: Record<string, { stressReport: StressReportData[], alerts: Alert[], activityLog: ActivityLog[] }> = {
    'student.a@example.com': {
        stressReport: [
            { name: 'August', stressLevel: null },
            { name: 'September', stressLevel: null },
            { name: 'October', stressLevel: 55 },
            { name: 'November', stressLevel: 65 },
            { name: 'December', stressLevel: 75 },
            { name: 'January', stressLevel: 50 },
        ],
        alerts: [
            { id: 1, message: "CRITICAL: Stress levels peaked in December. Please check in with your child.", severity: 'high', date: "Recent" },
            { id: 2, message: "Positive Trend: A significant drop in stress was observed in January. This is a great sign of recovery.", severity: 'low', date: "Recent" },
            { id: 3, message: "Review: Stress levels were elevated during the mid-winter period. This trend improved towards the new year.", severity: 'medium', date: "Recent" },
        ],
        activityLog: [
            { id: 1, activity: 'Breathing Exercise', date: 'January 15', duration: '5 mins' },
            { id: 2, activity: 'Meditation', date: 'January 11', duration: '10 mins' },
            { id: 3, activity: 'Yoga', date: 'January 09', duration: '15 mins' },
            { id: 4, activity: 'Affirmations', date: 'January 15', duration: '2 mins' },
        ]
    },
    'student.b@example.com': {
        stressReport: [
            { name: 'August', stressLevel: 25 },
            { name: 'September', stressLevel: 20 },
            { name: 'October', stressLevel: 18 },
            { name: 'November', stressLevel: 15 },
            { name: 'December', stressLevel: 20 },
            { name: 'January', stressLevel: 19 },
        ],
        alerts: [
            { id: 1, message: "Excellent progress! Student B's stress levels remain low and stable throughout the fall and winter.", severity: 'low', date: "Recent" },
            { id: 2, message: "Student B has completed all wellness activities consistently. Great job!", severity: 'low', date: "Recent" },
        ],
        activityLog: [
            { id: 1, activity: 'Affirmations', date: 'January 15', duration: '2 mins' },
            { id: 2, activity: 'Breathing Exercise', date: 'January 11', duration: '5 mins' },
            { id: 3, activity: 'Journaling', date: 'January 09', duration: '10 mins' },
        ]
    },
    'default': {
        stressReport: [
            { name: 'August', stressLevel: null },
            { name: 'September', stressLevel: null },
            { name: 'October', stressLevel: 55 },
            { name: 'November', stressLevel: 75 },
            { name: 'December', stressLevel: 60 },
            { name: 'January', stressLevel: 37 },
        ],
        alerts: [
             { id: 1, message: "MindGuard alert: Stress levels peaked in November but showed a positive decline into January.", severity: 'high', date: "Recent" },
             { id: 2, message: "Activity increase: Wellness activity completion increased in January, correlating with lower stress.", severity: 'low', date: "Recent" },
             { id: 3, message: "Data gap: No mood logs were recorded for August and September.", severity: 'medium', date: "Recent" },
             { id: 4, message: "Review: Stress levels were elevated during the peak of the semester in November.", severity: 'medium', date: "Recent" },
        ],
        activityLog: [
            { id: 1, activity: 'Meditation', date: 'January 15', duration: '10 mins' },
            { id: 2, activity: 'Yoga', date: 'January 11', duration: '15 mins' },
            { id: 3, activity: 'Breathing Exercise', date: 'January 09', duration: '5 mins' },
        ]
    }
};


export const MOOD_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: '1',
    title: 'Deep Relaxation',
    artist: 'MindGuard Sounds',
    youtubeLink: 'https://www.youtube.com/watch?v=5hjnNq-JG-8',
    color: 'from-[#0d9488] to-[#2dd4bf]',
    category: 'Relax'
  },
  {
    id: '2',
    title: 'Morning Joy',
    artist: 'MindGuard Beats',
    youtubeLink: 'https://www.youtube.com/watch?v=mN9e8W9yWPY',
    color: 'from-[#f97316] to-[#fbbf24]',
    category: 'Happy'
  },
  {
    id: '3',
    title: 'Deep Sleep Ambient',
    artist: 'MindGuard Slumber',
    youtubeLink: 'https://www.youtube.com/watch?v=bP9gMpl1gyQ',
    color: 'from-[#4f46e5] to-[#8b5cf6]',
    category: 'Sleep'
  },
  {
    id: '4',
    title: 'Focus & Study Lo-fi',
    artist: 'MindGuard Flow',
    youtubeLink: 'https://www.youtube.com/watch?v=YRJ6xoiRcpQ',
    color: 'from-[#0891b2] to-[#38bdf8]',
    category: 'Focus'
  },
  {
    id: '5',
    title: 'Nature River Walk',
    artist: 'Earthy Vibe',
    youtubeLink: 'https://www.youtube.com/watch?v=VwWKgaV2gT0',
    color: 'from-[#059669] to-[#34d399]',
    category: 'Relax'
  },
  {
    id: '6',
    title: 'Piano for Concentration',
    artist: 'The Ivory Flow',
    youtubeLink: 'https://www.youtube.com/watch?v=oiGmGFxsJi8',
    color: 'from-[#2563eb] to-[#14b8a6]',
    category: 'Focus'
  },
  {
    id: '7',
    title: 'Warm Summer Vibes',
    artist: 'Sunny Beats',
    youtubeLink: 'https://www.youtube.com/watch?v=07S0Z_hUQIE',
    color: 'from-[#ec4899] to-[#fb7185]',
    category: 'Happy'
  },
  {
    id: '8',
    title: 'White Noise Rain',
    artist: 'Stormy Night',
    youtubeLink: 'https://www.youtube.com/watch?v=5dden6Vqj4A',
    color: 'from-[#334155] to-[#6366f1]',
    category: 'Sleep'
  }
];