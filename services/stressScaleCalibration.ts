import type {
  CalibratedScaleBreakdown,
  LocalBiometricTelemetry,
  StressScaleBandId,
  TriageBaseline,
} from '../types';

export interface StressScaleBandMeta {
  id: StressScaleBandId;
  range: '0–25' | '26–50' | '51–75' | '76–100';
  min: number;
  max: number;
  label: string;
  shortLabel: string;
  summary: string;
  pillClass: string;
  barSegmentClass: string;
}

/**
 * Calibrated 4-tier non-diagnostic wellness & strain rubric modeled on
 * proportional Perceived Stress Scale (Cohen et al., 1983) quartiles fused with
 * AHA resting pulse norms, Soukupová & Čech (2016) EAR thresholds, and
 * Bentivoglio et al. (1997) spontaneous blink norms.
 */
export const STRESS_SCALE_BANDS: StressScaleBandMeta[] = [
  {
    id: 'low',
    range: '0–25',
    min: 0,
    max: 25,
    label: 'Low Strain / Rested',
    shortLabel: 'Low',
    summary: 'Metrics within resting reference bounds with minimal symptom load.',
    pillClass: 'bg-[#d1fae5] text-[#065f46] border-[#6ee7b7]',
    barSegmentClass: 'bg-[#10b981]',
  },
  {
    id: 'mild',
    range: '26–50',
    min: 26,
    max: 50,
    label: 'Mild Strain / Everyday Load',
    shortLabel: 'Mild',
    summary: 'Noticeable mild workload, ocular screen load, or isolated physical cue.',
    pillClass: 'bg-[#e0f2fe] text-[#075985] border-[#7dd3fc]',
    barSegmentClass: 'bg-[#0ea5e9]',
  },
  {
    id: 'elevated',
    range: '51–75',
    min: 51,
    max: 75,
    label: 'Moderate-to-Elevated Strain',
    shortLabel: 'Elevated',
    summary: 'Converging physiological tension and fatigue/stress cues; restorative pause advised.',
    pillClass: 'bg-[#ffedd5] text-[#9a3412] border-[#fdba74]',
    barSegmentClass: 'bg-[#f59e0b]',
  },
  {
    id: 'high',
    range: '76–100',
    min: 76,
    max: 100,
    label: 'High Strain / Recovery Priority',
    shortLabel: 'High',
    summary: 'Strong multi-signal convergence needing rest, support, or clinical check if ill.',
    pillClass: 'bg-rose-100 text-rose-900 border-rose-300',
    barSegmentClass: 'bg-rose-500',
  },
];

export function classifyStressBand(score: number): StressScaleBandMeta {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  for (const band of STRESS_SCALE_BANDS) {
    if (clamped >= band.min && clamped <= band.max) {
      return band;
    }
  }
  return STRESS_SCALE_BANDS[1];
}

const SYMPTOM_WEIGHTS: Record<string, number> = {
  'Feverish/Chills': 15,
  'Sore Throat/Congestion': 10,
  'Poor Sleep (<6h)': 11,
  'High Workload/Anxiety': 11,
  'Headache': 9,
  'Fatigue/Brain Fog': 9,
  'Muscle Tension': 7,
  'Dehydrated': 6,
};

/**
 * Computes a transparent, weighted 0–100 calibrated wellness strain breakdown
 * from live local optical telemetry + user baseline + reported symptoms.
 *
 * Weights sum strictly to 100 max:
 *  - Pulse vs. AHA 60–100 BPM resting zone: 0–25 pts
 *  - Ocular fatigue (Soukupová & Čech EAR < 0.24 + Bentivoglio 12–20/min norm): 0–20 pts
 *  - Inner-Brow tension (FACS AU4 furrow ratio): 0–20 pts
 *  - Self-reported symptom & context load: 0–35 pts
 */
export function computeCalibratedStressScale(
  telemetry: Pick<
    LocalBiometricTelemetry,
    'bpm' | 'bpmConfidence' | 'ear' | 'blinkRate' | 'browTensionIndex' | 'faceDetected'
  >,
  baseline: TriageBaseline,
  selectedSymptoms: string[],
  otherSymptoms: string
): CalibratedScaleBreakdown {
  let signalCoverageCount = 0;

  // 1. Pulse channel (0–25 pts) grounded on AHA 60–100 BPM healthy resting norm
  let pulseDeviationPts = 0;
  let pulseNote = 'Calibrating forehead rPPG pulse trend';

  if (telemetry.bpm !== null && Number.isFinite(telemetry.bpm)) {
    signalCoverageCount++;
    const bpm = Math.round(telemetry.bpm);
    const confMultiplier =
      telemetry.bpmConfidence === 'high' ? 1.0 : telemetry.bpmConfidence === 'medium' ? 0.78 : 0.45;

    if (baseline === 'just_exercised') {
      // Expected post-exertion pulse window up to ~135 BPM without stress penalty
      if (bpm <= 125) {
        pulseDeviationPts = 3;
        pulseNote = `${bpm} BPM · Expected post-exercise range`;
      } else {
        pulseDeviationPts = Math.round(Math.min(18, ((bpm - 125) / 35) * 18) * confMultiplier);
        pulseNote = `${bpm} BPM · Elevated even post-exercise`;
      }
    } else {
      if (bpm >= 58 && bpm <= 84) {
        pulseDeviationPts = 2;
        pulseNote = `${bpm} BPM · Calm AHA resting band (60–100 BPM)`;
      } else if (bpm > 84 && bpm <= 100) {
        pulseDeviationPts = Math.round((4 + ((bpm - 84) / 16) * 10) * confMultiplier);
        pulseNote = `${bpm} BPM · Upper-normal AHA resting zone (85–100 BPM)`;
      } else if (bpm > 100) {
        pulseDeviationPts = Math.round((15 + Math.min(10, ((bpm - 100) / 30) * 10)) * confMultiplier);
        pulseNote = `${bpm} BPM · Above AHA 100 BPM resting reference`;
      } else {
        // Low optical estimate (< 58) — treat conservatively in case of lighting noise
        pulseDeviationPts = Math.round(4 * confMultiplier);
        pulseNote = `${bpm} BPM · Calm slow pulse / optical baseline`;
      }
    }
  }

  // 2. Ocular strain channel (0–20 pts) grounded on Soukupová & Čech (2016) EAR & Bentivoglio (1997) 12–20/min
  let ocularStrainPts = 0;
  let ocularNote = 'Awaiting eye landmark lock';

  if (telemetry.faceDetected && telemetry.ear !== null) {
    signalCoverageCount++;
    const ear = telemetry.ear;
    const blink = telemetry.blinkRate;

    // EAR component (0–12 pts): alert >= 0.26, mild dip 0.23–0.26, heavy < 0.23
    let earPts = 0;
    if (ear < 0.26) {
      earPts = Math.min(12, Math.round(((0.26 - ear) / 0.08) * 12));
    }

    // Blink frequency component (0–8 pts): Bentivoglio resting spontaneous norm 12–20 blinks/min
    let blinkPts = 0;
    if (blink > 22) {
      blinkPts = Math.min(8, Math.round(((blink - 22) / 14) * 8));
    } else if (blink > 0 && blink < 8) {
      // Abnormally reduced blink rate indicates sustained screen lock/dryness strain
      blinkPts = Math.min(6, Math.round(((8 - blink) / 8) * 6));
    }

    ocularStrainPts = Math.min(20, earPts + blinkPts);
    if (ocularStrainPts <= 5) {
      ocularNote = `EAR ${ear.toFixed(2)} · ${blink}/min (within 12–20/min norm)`;
    } else if (ear < 0.24) {
      ocularNote = `EAR ${ear.toFixed(2)} · Heavy eyelid droopiness (<0.24 threshold)`;
    } else {
      ocularNote = `EAR ${ear.toFixed(2)} · ${blink}/min (${blink > 22 ? 'rapid blinking' : 'screen-stare suppression'})`;
    }
  }

  // 3. Brow tension channel (0–20 pts) from FACS AU4 inner-brow furrow ratio
  let browTensionPts = 0;
  let browNote = 'Awaiting brow landmarks';

  if (telemetry.faceDetected && telemetry.browTensionIndex !== null) {
    signalCoverageCount++;
    const rawBrow = Math.max(0, Math.min(100, telemetry.browTensionIndex));
    browTensionPts = Math.round((rawBrow / 100) * 20);
    if (rawBrow < 30) {
      browNote = `${rawBrow}/100 · Relaxed inner-brow baseline`;
    } else if (rawBrow < 62) {
      browNote = `${rawBrow}/100 · Mild concentration / brow tension`;
    } else {
      browNote = `${rawBrow}/100 · Pronounced AU4 brow furrow`;
    }
  }

  // 4. Self-reported symptom & qualitative note load (0–35 pts)
  let rawSymptomPts = 0;
  for (const sym of selectedSymptoms) {
    rawSymptomPts += SYMPTOM_WEIGHTS[sym] ?? 6;
  }
  if (otherSymptoms.trim().length >= 8) {
    rawSymptomPts += 4;
  }
  if (selectedSymptoms.length > 0 || otherSymptoms.trim().length > 0) {
    signalCoverageCount++;
  }

  const symptomLoadPts = Math.min(35, Math.round(rawSymptomPts));
  let symptomNote = 'No acute physical or workload symptoms selected';
  if (selectedSymptoms.length === 1) {
    symptomNote = `1 cue reported (${selectedSymptoms[0]})`;
  } else if (selectedSymptoms.length > 1) {
    symptomNote = `${selectedSymptoms.length} cues reported (${selectedSymptoms.slice(0, 2).join(', ')}${selectedSymptoms.length > 2 ? '…' : ''})`;
  } else if (otherSymptoms.trim().length > 0) {
    symptomNote = 'Custom check-in note added';
  }

  // Combine directly anchored channels (0–100)
  const rawCombined = pulseDeviationPts + ocularStrainPts + browTensionPts + symptomLoadPts;
  const calibratedScore = Math.max(0, Math.min(100, Math.round(rawCombined)));
  const band = classifyStressBand(calibratedScore);

  return {
    calibratedScore,
    bandId: band.id,
    bandLabel: band.label,
    bandRange: band.range,
    pulseDeviationPts,
    pulseNote,
    ocularStrainPts,
    ocularNote,
    browTensionPts,
    browNote,
    symptomLoadPts,
    symptomNote,
    signalCoverageCount,
  };
}
