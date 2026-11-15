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
            { name: 'Jan', stressLevel: 38 },
            { name: 'Feb', stressLevel: 44 },
            { name: 'Mar', stressLevel: 58 },
            { name: 'Apr', stressLevel: 64 },
            { name: 'May', stressLevel: 55 },
            { name: 'Jun', stressLevel: 40 },
            { name: 'Jul', stressLevel: 36 },
            { name: 'Aug', stressLevel: 48 },
            { name: 'Sep', stressLevel: 62 },
            { name: 'Oct', stressLevel: 74 },
            { name: 'Early Nov', stressLevel: 52 },
        ],
        alerts: [
            { id: 1, message: "Positive Trend: Stress eased noticeably into early November after October's peak—a strong sign of recovery.", severity: 'low', date: "Nov 04" },
            { id: 2, message: "ATTENTION: Academic stress levels peaked at 74% in October during mid-term assessments.", severity: 'high', date: "Oct 24" },
            { id: 3, message: "Review: Moderate spring-term stress occurred in April before dropping through summer (Jun–Jul).", severity: 'medium', date: "Apr 18" },
            { id: 4, message: "Baseline established: Calm start recorded in January (38%) with steady early-year routines.", severity: 'low', date: "Jan 19" },
        ],
        activityLog: [
            { id: 1, activity: 'Breathing Exercise', date: 'Nov 04', duration: '5 mins' },
            { id: 2, activity: 'Meditation', date: 'Nov 01', duration: '10 mins' },
            { id: 3, activity: 'Yoga', date: 'Oct 19', duration: '15 mins' },
            { id: 4, activity: 'Journaling', date: 'Sep 12', duration: '8 mins' },
            { id: 5, activity: 'Affirmations', date: 'Jan 15', duration: '3 mins' },
        ]
    },
    'student.b@example.com': {
        stressReport: [
            { name: 'Jan', stressLevel: 26 },
            { name: 'Feb', stressLevel: 24 },
            { name: 'Mar', stressLevel: 28 },
            { name: 'Apr', stressLevel: 25 },
            { name: 'May', stressLevel: 22 },
            { name: 'Jun', stressLevel: 18 },
            { name: 'Jul', stressLevel: 16 },
            { name: 'Aug', stressLevel: 20 },
            { name: 'Sep', stressLevel: 22 },
            { name: 'Oct', stressLevel: 19 },
            { name: 'Early Nov', stressLevel: 17 },
        ],
        alerts: [
            { id: 1, message: "Excellent progress! Stress levels have stayed low and steady from January right into early November.", severity: 'low', date: "Nov 03" },
            { id: 2, message: "Consistent habits: Regular breathing, affirmations, and journaling kept fall workload pressure well balanced.", severity: 'low', date: "Oct 14" },
            { id: 3, message: "Mid-year calm: Summer and early-year wellness routines held stress below 30% every month since January.", severity: 'low', date: "Jun 22" },
        ],
        activityLog: [
            { id: 1, activity: 'Affirmations', date: 'Nov 03', duration: '3 mins' },
            { id: 2, activity: 'Breathing Exercise', date: 'Oct 28', duration: '5 mins' },
            { id: 3, activity: 'Journaling', date: 'Aug 16', duration: '10 mins' },
            { id: 4, activity: 'Meditation', date: 'Apr 09', duration: '10 mins' },
            { id: 5, activity: 'Breathing Exercise', date: 'Jan 14', duration: '5 mins' },
        ]
    },
    'default': {
        stressReport: [
            { name: 'Jan', stressLevel: 42 },
            { name: 'Feb', stressLevel: 48 },
            { name: 'Mar', stressLevel: 55 },
            { name: 'Apr', stressLevel: 60 },
            { name: 'May', stressLevel: 52 },
            { name: 'Jun', stressLevel: null },
            { name: 'Jul', stressLevel: null },
            { name: 'Aug', stressLevel: 45 },
            { name: 'Sep', stressLevel: 58 },
            { name: 'Oct', stressLevel: 68 },
            { name: 'Early Nov', stressLevel: 46 },
        ],
        alerts: [
             { id: 1, message: "Positive shift: Stress peaked in October (68%) and declined sharply into early November (46%).", severity: 'low', date: "Nov 04" },
             { id: 2, message: "MindGuard notice: Workload stress climbed during March–April and again in October.", severity: 'high', date: "Oct 26" },
             { id: 3, message: "Data gap: No stress logs were recorded during the June and July summer break.", severity: 'medium', date: "Aug 05" },
             { id: 4, message: "Year start: Healthy January–February baseline with steady mindfulness participation.", severity: 'low', date: "Jan 18" },
        ],
        activityLog: [
            { id: 1, activity: 'Meditation', date: 'Nov 04', duration: '10 mins' },
            { id: 2, activity: 'Breathing Exercise', date: 'Nov 01', duration: '5 mins' },
            { id: 3, activity: 'Yoga', date: 'Oct 21', duration: '15 mins' },
            { id: 4, activity: 'Journaling', date: 'May 14', duration: '10 mins' },
            { id: 5, activity: 'Breathing Exercise', date: 'Jan 16', duration: '5 mins' },
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