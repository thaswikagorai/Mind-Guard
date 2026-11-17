export enum UserRole {
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  NONE = 'NONE'
}

export enum Mood {
  HAPPY = 'Happy',
  TIRED = 'Tired',
  STRESSED = 'Stressed'
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: Mood;
  aiSentiment: string;
  aiThemes: string[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: { text: string; value: number }[];
}

export interface BerkeleyQuizQuestion {
  id: number;
  question: string;
  subscale: 'stress' | 'anxiety';
  options: { text: string; value: number }[];
}

export interface BerkeleyQuizResult {
  id: string;
  date: string;
  totalScore: number; // 0-48
  stressScore: number; // 0-24
  anxietyScore: number; // 0-24
  stressLevel: 'Mild' | 'Moderate' | 'Severe';
  anxietyLevel: 'Mild' | 'Moderate' | 'Severe';
  overallLevel: string;
  normalizedPercentage: number; // 0-100%
}

export interface StressReportData {
  name: string;
  stressLevel: number | null; // 0-100
}

export interface Alert {
    id: number;
    message: string;
    severity: 'high' | 'medium' | 'low';
    date: string;
}

export type MusicCategory = 'Relax' | 'Focus' | 'Sleep' | 'Happy';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  youtubeLink: string;
  color: string;
  category: MusicCategory;
}

export interface ActivityLog {
  id: number;
  activity: string;
  date: string;
  duration: string;
}

export interface ActivityStats {
  streak: number;
  consistencyScore: number; // 0-100
  totalActivities: number;
  frequentActivity: string;
}

export interface StudentReminder {
  id: string;
  time: string;
  activity: string;
  enabled: boolean;
}

export type StressCheckInAgeGroup = 'youth' | 'adult';

export type TensionLevel = 'low' | 'moderate' | 'high' | 'unclear';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface StressCheckInCameraAnalysis {
  image_quality: string;
  emotional_cues: string[];
  posture_cues: string[];
  facial_factors: string[];
  visible_cues: string[];
  estimated_tension_level: TensionLevel;
  confidence: ConfidenceLevel;
  message_to_user: string;
  suggestions: string[];
  disclaimer: string;
}

export type WellnessGoalCategory = 'breathing' | 'journaling' | 'movement' | 'mindfulness' | 'sleep';

export interface WeeklyWellnessGoal {
  id: string;
  title: string;
  category: WellnessGoalCategory;
  targetCount: number;
  currentCount: number;
  unit: string;
  weekStart: string;
  createdAt: string;
}

export type TriageBaseline = 'at_rest' | 'just_exercised';

export type SignalQualityStatus = 'calibrating' | 'good' | 'fair' | 'hold_still' | 'no_face';

export type FaceFitStatus =
  | 'no_face'
  | 'low_light'
  | 'too_far'
  | 'too_close'
  | 'off_center'
  | 'moving'
  | 'fitted';

export interface FaceBoxNormalized {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface FaceFitEvaluation {
  status: FaceFitStatus;
  isFit: boolean;
  fitScore: number; // 0-100 alignment score
  guidance: string;
  faceBox: FaceBoxNormalized | null;
}

export type StressScaleBandId = 'low' | 'mild' | 'elevated' | 'high';

export interface CalibratedScaleBreakdown {
  calibratedScore: number; // 0-100
  bandId: StressScaleBandId;
  bandLabel: string;
  bandRange: '0–25' | '26–50' | '51–75' | '76–100';
  pulseDeviationPts: number; // 0-25 (AHA 60-100 BPM resting ref)
  pulseNote: string;
  ocularStrainPts: number; // 0-20 (Soukupova & Cech EAR + Bentivoglio 12-20/min blink ref)
  ocularNote: string;
  browTensionPts: number; // 0-20 (FACS AU4 inner-brow furrow index)
  browNote: string;
  symptomLoadPts: number; // 0-35 (reported symptoms & context)
  symptomNote: string;
  signalCoverageCount: number; // active channels 0-4
}

export type PrimaryTriageCategory =
  | 'Optimal / Rested'
  | 'Acute Cognitive Stress'
  | 'Physical Fatigue / Sleep Debt'
  | 'Potential Illness / Recovery Needed';

export interface LocalBiometricTelemetry {
  bpm: number | null;
  bpmConfidence: 'low' | 'medium' | 'high';
  ear: number | null;
  blinkRate: number; // blinks per minute
  eyeFatigueLabel: 'Alert' | 'Heavy / Tired' | 'Pending';
  browTensionIndex: number | null; // 0-100
  signalQuality: SignalQualityStatus;
  motionArtifact: boolean;
  faceDetected: boolean;
  bufferProgress: number; // 0-100
}

export interface TriageAssessmentPayload {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  telemetry: {
    bpm: number | null;
    bpmConfidence: 'low' | 'medium' | 'high';
    ear: number | null;
    blinkRate: number;
    browTensionIndex: number | null;
    signalQuality: SignalQualityStatus;
  };
  symptoms: string[];
  otherSymptoms: string;
  baseline: TriageBaseline;
  calibratedScale?: CalibratedScaleBreakdown;
}

export interface TriageAssessmentResult {
  overallStrainScore: number; // 0-100
  primaryCategory: PrimaryTriageCategory;
  signalCorrelation: string;
  actionableSteps: string[];
  seekCareFlag: boolean;
  seekCareNote: string;
  disclaimer: string;
  calibratedScale?: CalibratedScaleBreakdown;
}

export type MindfulnessStickerId =
  | 'breeze_buddy'
  | 'ink_owl'
  | 'sunbeam_sprinter'
  | 'lotus_spark'
  | 'moonbeam_drifter'
  | 'first_bloom'
  | 'hat_trick_star'
  | 'weekly_crown';

export interface MindfulnessStickerDefinition {
  id: MindfulnessStickerId;
  name: string;
  tagline: string;
  howToEarn: string;
  category: WellnessGoalCategory | 'milestone';
  cardGradient: string;
  borderColor: string;
  accentText: string;
  suggestedGoal?: {
    title: string;
    category: WellnessGoalCategory;
    targetCount: number;
    unit: string;
  };
}

export interface UnlockedStickerRecord {
  stickerId: MindfulnessStickerId;
  unlockedAt: string;
  lastEarnedWeek: string;
  timesEarned: number;
}

export type NotificationCadence = 'every_day' | 'weekdays';

export interface CheckInNotificationSettings {
  enabled: boolean;
  preferredTime: string; // "HH:MM" 24-hour format
  cadence: NotificationCadence;
  customMessage: string;
  lastNotifiedDate: string | null; // "YYYY-MM-DD"
}

export interface LiteratureClockQuote {
  time: string;
  quoteFirst: string;
  quoteTimeCase: string;
  quoteLast: string;
  title: string;
  author: string;
  isExactMinute: boolean;
}

export interface LiteratureClockResponse {
  time: string;
  quotes: LiteratureClockQuote[];
  source: 'literature-clock' | 'classic-fallback';
}

export type CalendarMoodKey = 'happy' | 'calm' | 'tired' | 'stressed';

export type MoodLogSource = 'calendar' | 'journal' | 'quiz' | 'checkin';

export interface MoodLogEntry {
  id: string;
  dateKey: string; // YYYY-MM-DD local date
  mood: CalendarMoodKey;
  source: MoodLogSource;
  note?: string;
  timestamp: number;
}

export interface DailyMoodSummary {
  dateKey: string;
  primaryMood: CalendarMoodKey;
  entries: MoodLogEntry[];
}