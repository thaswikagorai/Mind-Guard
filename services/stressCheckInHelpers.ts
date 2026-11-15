import {
  ConfidenceLevel,
  StressCheckInAgeGroup,
  StressCheckInCameraAnalysis,
  TensionLevel,
} from '../types';

export interface WellnessActionTip {
  id: string;
  title: string;
  description: string;
  source: string;
  emoji: string;
  canLaunchBreathing?: boolean;
}

export const WELLNESS_ACTION_TIPS: Record<'low' | 'moderate' | 'high' | 'unclear', WellnessActionTip[]> = {
  low: [
    {
      id: 'water',
      title: 'Sip a glass of water',
      description: 'Staying hydrated supports steady energy and clear focus throughout your day.',
      source: 'NIH / NIMH',
      emoji: '💧',
    },
    {
      id: 'walk',
      title: 'Take a short 5–10 minute walk',
      description: 'Gentle movement helps maintain mood and keeps posture relaxed between tasks.',
      source: 'NHS & NIMH',
      emoji: '🚶',
    },
  ],
  moderate: [
    {
      id: 'breathing',
      title: 'Try 2 minutes of slow belly breathing',
      description:
        'Inhale slowly through your nose and exhale smoothly to help activate your body’s relaxation response.',
      source: 'CDC & WHO',
      emoji: '🌬️',
      canLaunchBreathing: true,
    },
    {
      id: 'stretch',
      title: 'Gentle neck, shoulder & jaw stretch',
      description:
        'Roll your shoulders back, unclench your jaw, and gently tilt your head side to side to ease physical tightness.',
      source: 'NHS',
      emoji: '🙆',
    },
    {
      id: 'water-break',
      title: 'Step away for a glass of water',
      description: 'A brief screen break with water helps prevent eye strain and fatigue from building up.',
      source: 'NIH / NIMH',
      emoji: '💧',
    },
  ],
  high: [
    {
      id: 'breathing-high',
      title: 'Pause for slow, deep breathing',
      description:
        'Take 5 slow breaths—letting your belly expand as you inhale and softening your shoulders as you exhale.',
      source: 'CDC & WHO',
      emoji: '🌬️',
      canLaunchBreathing: true,
    },
    {
      id: 'walk-high',
      title: 'Take a short, unhurried walk',
      description:
        'Stepping outside or walking quietly for a few minutes helps release built-up physical tension.',
      source: 'NIMH & NHS',
      emoji: '🌿',
    },
    {
      id: 'stretch-water',
      title: 'Drink water & drop your shoulders',
      description:
        'Notice where your body holds tension—drop your shoulders, soften your jaw, and hydrate.',
      source: 'NHS & NIMH',
      emoji: '💧',
    },
  ],
  unclear: [
    {
      id: 'breathing-unclear',
      title: 'Take 3 slow, calming breaths',
      description:
        'Even if lighting was too dim for the camera, pausing for a few slow breaths helps settle your mind.',
      source: 'CDC & WHO',
      emoji: '🌬️',
      canLaunchBreathing: true,
    },
    {
      id: 'water-unclear',
      title: 'Sip water & relax your posture',
      description: 'Roll your shoulders down away from your ears and take a short screen pause.',
      source: 'NHS & NIMH',
      emoji: '💧',
    },
  ],
};

export interface SnapshotCheckInSummary {
  headline: string;
  badgeLabel: string;
  emoji: string;
  warmSummary: string;
  emotionalCues: string[];
  postureCues: string[];
  facialFactors: string[];
  actions: WellnessActionTip[];
  tier: TensionLevel;
  confidence: ConfidenceLevel;
  imageQuality: string;
  youthNote: string | null;
}

export function buildSnapshotCheckInSummary(
  analysis: StressCheckInCameraAnalysis,
  ageGroup: StressCheckInAgeGroup
): SnapshotCheckInSummary {
  const tier = analysis.estimated_tension_level;
  const confidence = analysis.confidence;

  let headline = '';
  let badgeLabel = '';
  let emoji = '📷';

  if (tier === 'low') {
    headline = 'Calm & Low Visible Tension Cues';
    badgeLabel = 'Low Visible Tension';
    emoji = '😌';
  } else if (tier === 'moderate') {
    headline = 'Some Visible Tension or Fatigue Cues';
    badgeLabel = 'Moderate Visible Tension';
    emoji = '😐';
  } else if (tier === 'high') {
    headline = 'Noticeable Visible Tension Cues';
    badgeLabel = 'Elevated Visible Tension';
    emoji = '😟';
  } else {
    headline = 'Snapshot Was Unclear — Try Retaking';
    badgeLabel = 'Image Unclear';
    emoji = '📷';
  }

  const warmSummary =
    analysis.message_to_user ||
    (tier === 'unclear'
      ? 'The snapshot was a bit dark, blurry, or off-center to clearly read facial and posture cues. Moving toward a soft light source can help.'
      : 'Thank you for pausing for a quick check-in. Remember that camera snapshots only reflect surface cues in one moment.');

  const actions = [...WELLNESS_ACTION_TIPS[tier]].slice(0, 3);

  const youthNote =
    ageGroup === 'youth'
      ? 'If you feel weighed down or stressed—no matter what the camera shows—talking with a parent, teacher, school counselor, or trusted adult can really help.'
      : null;

  return {
    headline,
    badgeLabel,
    emoji,
    warmSummary,
    emotionalCues: analysis.emotional_cues ?? [],
    postureCues: analysis.posture_cues ?? [],
    facialFactors: analysis.facial_factors ?? [],
    actions,
    tier,
    confidence,
    imageQuality: analysis.image_quality || 'clear',
    youthNote,
  };
}

export const AUTHORITATIVE_SOURCES = [
  {
    title: 'American Heart Association (AHA) — Resting Heart Rate Reference',
    detail:
      'AHA places normal resting heart rate for ages 10+ and adults at 60–100 BPM. Post-exercise elevation is separated via the activity baseline toggle, and optical forehead rPPG is strictly a trend estimate, not a clinical ECG or pulse oximeter.',
    url: 'https://www.heart.org/en/healthy-living/fitness/fitness-basics/target-heart-rates',
  },
  {
    title: 'Cohen, Kamarck & Mermelstein (1983) — Perceived Stress Stratification',
    detail:
      'Our 4-tier non-diagnostic strain bands (0–25 Low, 26–50 Mild, 51–75 Elevated, 76–100 High) mirror standard proportional wellness load tiers rather than arbitrary scores.',
    url: 'https://www.cmu.edu/dietrich/psychology/stress-immunity-disease-lab/scales/pdf/cohen,-kamarck,-&-mermelstein,-1983.pdf',
  },
  {
    title: 'Soukupová & Čech (2016) & Bentivoglio et al. (1997) — Ocular Norms',
    detail:
      'Uses the geometric 6-point Eye Aspect Ratio (EAR; resting alert >= 0.25, closure < 0.21) and published spontaneous blink-rate resting baseline (12–20 blinks/min) to detect eyelid heaviness and screen fatigue.',
    url: 'https://vision.fe.uni-lj.si/cvww2016/proceedings/papers/05.pdf',
  },
  {
    title: 'Facial Action Coding System (Ekman & Friesen) — Brow Furrow & Visual Limits',
    detail:
      'Inner-brow proximity captures Action Unit 4 (brow lowerer) muscle contraction, while self-reported symptoms prevent relying solely on surface facial expressions.',
    url: 'https://www.apa.org',
  },
  {
    title: 'WHO, NIMH/NIH, CDC & NHS — Coping & Recovery Guidance',
    detail:
      'Grounds everyday actionable steps in published evidence-based guidance: paced slow breathing, hydration, brief movement walks, gentle neck/shoulder stretches, and restorative sleep.',
    url: 'https://www.who.int',
  },
  {
    title: 'Google MediaPipe Face Landmarker (478-Point Local Mesh)',
    detail:
      'Runs locally in your browser to evaluate face-outline fit, extract EAR and brow geometry, and sample the forehead green channel without streaming video.',
    url: 'https://ai.google.dev/edge/mediapipe',
  },
];

export const TRIAGE_SYMPTOM_CHIPS: readonly string[] = [
  'Headache',
  'Fatigue/Brain Fog',
  'Feverish/Chills',
  'Sore Throat/Congestion',
  'Muscle Tension',
  'Poor Sleep (<6h)',
  'High Workload/Anxiety',
  'Dehydrated',
];

