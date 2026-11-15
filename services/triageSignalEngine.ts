import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type {
  FaceBoxNormalized,
  FaceFitEvaluation,
  SignalQualityStatus,
} from '../types';

export interface ForeheadRoiNormalized {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RppgEstimate {
  bpm: number | null;
  confidence: 'low' | 'medium' | 'high';
  bufferProgress: number;
  motionArtifact: boolean;
}

const dist2D = (a: NormalizedLandmark, b: NormalizedLandmark): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
};

/**
 * Computes average Eye Aspect Ratio (EAR) from 478 MediaPipe Face Landmarks.
 * Left eye indices: [33, 160, 158, 133, 153, 144]
 * Right eye indices: [362, 385, 387, 263, 373, 380]
 */
export function computeEyeAspectRatio(landmarks: NormalizedLandmark[]): number | null {
  if (landmarks.length < 400) return null;

  const leftV1 = dist2D(landmarks[160], landmarks[144]);
  const leftV2 = dist2D(landmarks[158], landmarks[153]);
  const leftH = dist2D(landmarks[33], landmarks[133]);

  const rightV1 = dist2D(landmarks[385], landmarks[373]);
  const rightV2 = dist2D(landmarks[387], landmarks[380]);
  const rightH = dist2D(landmarks[362], landmarks[263]);

  if (leftH < 1e-4 || rightH < 1e-4) return null;

  const leftEar = (leftV1 + leftV2) / (2 * leftH);
  const rightEar = (rightV1 + rightV2) / (2 * rightH);
  const avgEar = (leftEar + rightEar) / 2;

  return Math.max(0.05, Math.min(0.6, avgEar));
}

/**
 * Computes normalized Brow Tension Index (0-100) from inner brow furrow distance
 * and vertical brow-to-eyelid compression, scaled by inter-ocular face width.
 */
export function computeBrowTensionIndex(landmarks: NormalizedLandmark[]): number | null {
  if (landmarks.length < 400) return null;

  const outerEyeWidth = dist2D(landmarks[33], landmarks[263]);
  if (outerEyeWidth < 1e-4) return null;

  // Inner brow horizontal proximity (107 right inner brow, 336 left inner brow)
  const innerBrowDistNorm = dist2D(landmarks[107], landmarks[336]) / outerEyeWidth;

  // Brow-to-lid vertical clearance (105->159 right, 334->386 left)
  const rightClearance = dist2D(landmarks[105], landmarks[159]) / outerEyeWidth;
  const leftClearance = dist2D(landmarks[334], landmarks[386]) / outerEyeWidth;
  const avgClearance = (rightClearance + leftClearance) / 2;

  // Typical relaxed inner-brow ratio ~0.34-0.42; furrowed drops toward ~0.22-0.28
  const furrowScore = Math.max(0, Math.min(1, (0.37 - innerBrowDistNorm) / 0.14));
  // Typical relaxed brow clearance ~0.18-0.25; compressed drops toward ~0.10-0.14
  const compressScore = Math.max(0, Math.min(1, (0.21 - avgClearance) / 0.1));

  const combined = 0.62 * furrowScore + 0.38 * compressScore;
  return Math.round(Math.max(0, Math.min(100, combined * 100)));
}

/**
 * Tracks blink rate (blinks/min) over a rolling 60s window plus eyelid droopiness.
 */
export class BlinkTracker {
  private blinkTimestamps: number[] = [];
  private earSamples: { ear: number; t: number }[] = [];
  private eyesClosed = false;
  private closedStartTime = 0;

  private readonly closeThreshold = 0.205;
  private readonly openThreshold = 0.235;
  private readonly windowMs = 60_000;

  update(ear: number | null, nowMs: number): {
    blinkRate: number;
    avgEar: number | null;
    eyeFatigueLabel: 'Alert' | 'Heavy / Tired' | 'Pending';
  } {
    if (ear !== null) {
      this.earSamples.push({ ear, t: nowMs });
      if (!this.eyesClosed && ear < this.closeThreshold) {
        this.eyesClosed = true;
        this.closedStartTime = nowMs;
      } else if (this.eyesClosed && ear > this.openThreshold) {
        const blinkDuration = nowMs - this.closedStartTime;
        this.eyesClosed = false;
        // Normal blink lasts 60ms-650ms
        if (blinkDuration >= 50 && blinkDuration <= 800) {
          this.blinkTimestamps.push(nowMs);
        }
      }
    }

    // Prune older than 60s
    const cutoff = nowMs - this.windowMs;
    while (this.blinkTimestamps.length > 0 && this.blinkTimestamps[0] < cutoff) {
      this.blinkTimestamps.shift();
    }
    const earCutoff = nowMs - 8_000;
    while (this.earSamples.length > 0 && this.earSamples[0].t < earCutoff) {
      this.earSamples.shift();
    }

    const avgEar =
      this.earSamples.length > 0
        ? this.earSamples.reduce((acc, s) => acc + s.ear, 0) / this.earSamples.length
        : null;

    // Extrapolate gracefully during first 60s once at least 10s of data exist
    let blinkRate = this.blinkTimestamps.length;
    if (this.earSamples.length > 0) {
      const oldest = this.earSamples[0].t;
      const elapsedSec = Math.max(10, (nowMs - oldest) / 1000);
      if (elapsedSec < 60 && this.blinkTimestamps.length > 0) {
        blinkRate = Math.round((this.blinkTimestamps.length / elapsedSec) * 60);
      }
    }

    let eyeFatigueLabel: 'Alert' | 'Heavy / Tired' | 'Pending' = 'Pending';
    if (avgEar !== null) {
      eyeFatigueLabel = avgEar < 0.245 || blinkRate >= 26 ? 'Heavy / Tired' : 'Alert';
    }

    return {
      blinkRate: Math.min(60, blinkRate),
      avgEar: avgEar !== null ? Number(avgEar.toFixed(2)) : null,
      eyeFatigueLabel,
    };
  }

  reset(): void {
    this.blinkTimestamps = [];
    this.earSamples = [];
    this.eyesClosed = false;
    this.closedStartTime = 0;
  }
}

/**
 * Extracts dynamic Forehead ROI bounded above eyebrows/temples and averages the Green RGB channel.
 */
export function extractForeheadGreenSample(
  video: HTMLVideoElement,
  landmarks: NormalizedLandmark[],
  roiCanvas: HTMLCanvasElement
): { greenMean: number; roiNorm: ForeheadRoiNormalized } | null {
  if (landmarks.length < 400 || video.videoWidth <= 0 || video.videoHeight <= 0) {
    return null;
  }

  // Temple / mid-brow horizontal bounds: 103 (right forehead) to 332 (left forehead)
  // Vertical bounds: top hairline ~10, eyebrow ridge ~105 / 334
  const leftX = Math.min(landmarks[103].x, landmarks[332].x);
  const rightX = Math.max(landmarks[103].x, landmarks[332].x);
  const browY = Math.min(landmarks[105].y, landmarks[334].y);
  const topY = landmarks[10].y;

  const rawWidth = rightX - leftX;
  const rawHeight = browY - topY;
  if (rawWidth < 0.04 || rawHeight < 0.02) return null;

  // Inset slightly horizontally to avoid hair/edges
  const normX = Math.max(0, Math.min(0.95, leftX + rawWidth * 0.16));
  const normW = Math.max(0.03, Math.min(1 - normX, rawWidth * 0.68));
  const normY = Math.max(0, Math.min(0.95, topY + rawHeight * 0.18));
  const normH = Math.max(0.025, Math.min(1 - normY, rawHeight * 0.62));

  const sx = Math.floor(normX * video.videoWidth);
  const sy = Math.floor(normY * video.videoHeight);
  const sw = Math.max(8, Math.floor(normW * video.videoWidth));
  const sh = Math.max(8, Math.floor(normH * video.videoHeight));

  const targetW = 32;
  const targetH = 24;
  if (roiCanvas.width !== targetW) roiCanvas.width = targetW;
  if (roiCanvas.height !== targetH) roiCanvas.height = targetH;

  const ctx = roiCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);
  const pixels = ctx.getImageData(0, 0, targetW, targetH).data;

  let greenSum = 0;
  let validCount = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    // Skip saturated/black clipped pixels
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (g > 15 && g < 252 && r > 10 && b > 10) {
      greenSum += g;
      validCount++;
    }
  }

  if (validCount < 32) return null;

  return {
    greenMean: greenSum / validCount,
    roiNorm: {
      x: normX,
      y: normY,
      width: normW,
      height: normH,
    },
  };
}

/**
 * Rolling 300-frame rPPG Pulse Estimator using temporal detrending,
 * bandpass frequency-domain spectral peak search (0.75 Hz - 4.0 Hz => 45 - 240 BPM),
 * and head-motion artifact detection.
 */
export class RppgPulseEstimator {
  private readonly maxFrames = 300;
  private greenBuffer: { g: number; t: number }[] = [];
  private headPositions: { x: number; y: number; faceW: number }[] = [];
  private smoothedBpm: number | null = null;

  pushFrame(
    greenMean: number | null,
    landmarks: NormalizedLandmark[] | null,
    nowMs: number
  ): RppgEstimate {
    let motionArtifact = false;

    if (landmarks && landmarks.length > 454) {
      const nose = landmarks[1];
      const faceW = Math.max(0.08, dist2D(landmarks[234], landmarks[454]));
      this.headPositions.push({ x: nose.x, y: nose.y, faceW });
      if (this.headPositions.length > 18) {
        this.headPositions.shift();
      }

      if (this.headPositions.length >= 8) {
        let maxStep = 0;
        let sumDisp = 0;
        for (let i = 1; i < this.headPositions.length; i++) {
          const prev = this.headPositions[i - 1];
          const curr = this.headPositions[i];
          const step = Math.hypot(curr.x - prev.x, curr.y - prev.y) / curr.faceW;
          sumDisp += step;
          if (step > maxStep) maxStep = step;
        }
        const meanDisp = sumDisp / (this.headPositions.length - 1);
        if (meanDisp > 0.016 || maxStep > 0.042) {
          motionArtifact = true;
        }
      }
    } else {
      this.headPositions = [];
    }

    if (greenMean !== null && !motionArtifact) {
      this.greenBuffer.push({ g: greenMean, t: nowMs });
      if (this.greenBuffer.length > this.maxFrames) {
        this.greenBuffer.shift();
      }
    } else if (motionArtifact && this.greenBuffer.length > 120) {
      // Trim oldest half if severe motion disturbed tracking, avoiding corrupted peak
      this.greenBuffer = this.greenBuffer.slice(-90);
    }

    const bufferProgress = Math.min(
      100,
      Math.round((this.greenBuffer.length / 180) * 100)
    );

    if (this.greenBuffer.length < 90) {
      return {
        bpm: this.smoothedBpm,
        confidence: 'low',
        bufferProgress,
        motionArtifact,
      };
    }

    const durationSec =
      (this.greenBuffer[this.greenBuffer.length - 1].t - this.greenBuffer[0].t) / 1000;
    if (durationSec < 2.8) {
      return {
        bpm: this.smoothedBpm,
        confidence: 'low',
        bufferProgress,
        motionArtifact,
      };
    }

    const sampleRate = (this.greenBuffer.length - 1) / durationSec;
    if (sampleRate < 8 || sampleRate > 90) {
      return {
        bpm: this.smoothedBpm,
        confidence: 'low',
        bufferProgress,
        motionArtifact,
      };
    }

    const n = this.greenBuffer.length;
    const raw = this.greenBuffer.map((item) => item.g);

    // 1. Moving average detrend (~0.85s window) to remove slow lighting drift (<0.75 Hz)
    const detrendHalfWin = Math.max(3, Math.round(sampleRate * 0.42));
    const detrended = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - detrendHalfWin);
      const end = Math.min(n - 1, i + detrendHalfWin);
      let sum = 0;
      for (let j = start; j <= end; j++) sum += raw[j];
      detrended[i] = raw[i] - sum / (end - start + 1);
    }

    // 2. Short smoothing pass (~0.12s) + Hann window to suppress >4 Hz high-freq camera noise
    const smoothHalfWin = Math.max(1, Math.floor(sampleRate * 0.06));
    const filtered = new Float64Array(n);
    let signalEnergy = 0;
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - smoothHalfWin);
      const end = Math.min(n - 1, i + smoothHalfWin);
      let sum = 0;
      for (let j = start; j <= end; j++) sum += detrended[j];
      const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
      const val = (sum / (end - start + 1)) * hann;
      filtered[i] = val;
      signalEnergy += val * val;
    }

    if (signalEnergy < 1e-6) {
      return {
        bpm: this.smoothedBpm,
        confidence: 'low',
        bufferProgress,
        motionArtifact,
      };
    }

    // 3. Bandpass frequency-domain spectral peak search: 0.75 Hz - 4.0 Hz (45 - 240 BPM)
    const minFreq = 0.75;
    const maxFreq = 4.0;
    const freqStep = 0.025; // 1.5 BPM resolution

    let bestFreq = 1.25;
    let maxPower = -1;
    let totalBandPower = 0;
    let binCount = 0;

    for (let f = minFreq; f <= maxFreq + 1e-6; f += freqStep) {
      let real = 0;
      let imag = 0;
      const omega = (2 * Math.PI * f) / sampleRate;
      for (let i = 0; i < n; i++) {
        const angle = omega * i;
        real += filtered[i] * Math.cos(angle);
        imag -= filtered[i] * Math.sin(angle);
      }
      const power = real * real + imag * imag;
      totalBandPower += power;
      binCount++;

      // Gentle physiological prior favoring 55-145 BPM if two harmonics tie closely
      const bpmCand = f * 60;
      const weight = bpmCand >= 52 && bpmCand <= 145 ? 1.0 : 0.85;
      if (power * weight > maxPower) {
        maxPower = power * weight;
        bestFreq = f;
      }
    }

    const avgPower = totalBandPower / Math.max(1, binCount);
    const snr = avgPower > 0 ? maxPower / avgPower : 0;
    const rawBpm = Math.round(bestFreq * 60);

    // Smooth BPM transitions so the readout stays steady and legible
    if (this.smoothedBpm === null) {
      this.smoothedBpm = rawBpm;
    } else if (!motionArtifact) {
      const delta = Math.abs(rawBpm - this.smoothedBpm);
      const alpha = delta > 25 ? 0.22 : 0.35;
      this.smoothedBpm = Math.round(this.smoothedBpm * (1 - alpha) + rawBpm * alpha);
    }

    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (!motionArtifact && this.greenBuffer.length >= 160 && snr >= 3.2) {
      confidence = 'high';
    } else if (!motionArtifact && snr >= 2.1) {
      confidence = 'medium';
    }

    return {
      bpm: this.smoothedBpm,
      confidence,
      bufferProgress,
      motionArtifact,
    };
  }

  reset(): void {
    this.greenBuffer = [];
    this.headPositions = [];
    this.smoothedBpm = null;
  }
}

export function deriveSignalQuality(
  faceDetected: boolean,
  motionArtifact: boolean,
  bufferProgress: number,
  bpmConfidence: 'low' | 'medium' | 'high',
  avgBrightness: number
): SignalQualityStatus {
  if (!faceDetected) return 'no_face';
  if (motionArtifact) return 'hold_still';
  if (bufferProgress < 50) return 'calibrating';
  if (avgBrightness >= 55 && bpmConfidence === 'high') return 'good';
  return 'fair';
}

/**
 * Computes normalized facial bounding box & evaluates alignment inside the target face-fit outline.
 * Note: The webcam preview is mirrored horizontally, so target centers symmetrically at X = 0.50.
 */
export function evaluateFaceFit(
  landmarks: NormalizedLandmark[] | null | undefined,
  avgBrightness: number,
  motionArtifact: boolean
): FaceFitEvaluation {
  if (!landmarks || landmarks.length < 400) {
    return {
      status: 'no_face',
      isFit: false,
      fitScore: 0,
      guidance:
        avgBrightness < 50
          ? 'Brighten room lighting & center your face inside the outline'
          : 'Position your face inside the oval outline',
      faceBox: null,
    };
  }

  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;

  for (let i = 0; i < landmarks.length; i++) {
    const pt = landmarks[i];
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  const width = Math.max(0.01, maxX - minX);
  const height = Math.max(0.01, maxY - minY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const faceBox: FaceBoxNormalized = {
    minX,
    maxX,
    minY,
    maxY,
    width,
    height,
    centerX,
    centerY,
  };

  // Continuous alignment score (0-100) comparing against ideal oval geometry:
  // Target face center: (0.50, 0.47), target face width ~0.34, target height ~0.50
  const dx = Math.abs(centerX - 0.5);
  const dy = Math.abs(centerY - 0.47);
  const centerPenalty = Math.min(1, (dx / 0.22 + dy / 0.24) / 2);

  let sizePenalty = 0;
  if (width < 0.21 || height < 0.30) {
    sizePenalty = Math.min(1, Math.max((0.21 - width) / 0.12, (0.30 - height) / 0.16));
  } else if (width > 0.50 || height > 0.74) {
    sizePenalty = Math.min(1, Math.max((width - 0.50) / 0.16, (height - 0.74) / 0.18));
  }

  const rawFitScore = Math.round(Math.max(0, Math.min(100, (1 - 0.58 * centerPenalty - 0.42 * sizePenalty) * 100)));

  if (avgBrightness < 50) {
    return {
      status: 'low_light',
      isFit: false,
      fitScore: Math.min(rawFitScore, 55),
      guidance: 'Low light — face a window or soft lamp inside the outline',
      faceBox,
    };
  }

  if (width < 0.21 || height < 0.30) {
    return {
      status: 'too_far',
      isFit: false,
      fitScore: rawFitScore,
      guidance: 'Move closer so your face fills the outline',
      faceBox,
    };
  }

  if (width > 0.50 || height > 0.74) {
    return {
      status: 'too_close',
      isFit: false,
      fitScore: rawFitScore,
      guidance: 'Move back slightly so your full face fits inside',
      faceBox,
    };
  }

  if (centerX < 0.38 || centerX > 0.62 || centerY < 0.31 || centerY > 0.63) {
    let hint = 'Center your face inside the oval outline';
    if (centerY < 0.31) {
      hint = 'Lower your chin or tilt camera up slightly';
    } else if (centerY > 0.63) {
      hint = 'Raise your head slightly into the outline';
    }
    return {
      status: 'off_center',
      isFit: false,
      fitScore: rawFitScore,
      guidance: hint,
      faceBox,
    };
  }

  if (motionArtifact) {
    return {
      status: 'moving',
      isFit: false,
      fitScore: Math.max(70, rawFitScore),
      guidance: 'Outline aligned — hold still for auto-snapshot',
      faceBox,
    };
  }

  return {
    status: 'fitted',
    isFit: true,
    fitScore: Math.max(85, rawFitScore),
    guidance: 'Face fitted — hold steady for automatic snapshot',
    faceBox,
  };
}

