import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import Card from '../common/Card';
import {
  ChevronLeftIcon,
  CameraIcon,
  ShieldCheckIcon,
  InfoCircleIcon,
  SparklesIcon,
  HeartPulseIcon,
  CheckIcon,
  RefreshIcon,
} from '../icons';
import {
  FaceFitEvaluation,
  LocalBiometricTelemetry,
  PrimaryTriageCategory,
  SignalQualityStatus,
  StressCheckInAgeGroup,
  TriageAssessmentResult,
  TriageBaseline,
} from '../../types';
import {
  AUTHORITATIVE_SOURCES,
  TRIAGE_SYMPTOM_CHIPS,
} from '../../services/stressCheckInHelpers';
import {
  BlinkTracker,
  ForeheadRoiNormalized,
  RppgPulseEstimator,
  computeBrowTensionIndex,
  computeEyeAspectRatio,
  deriveSignalQuality,
  evaluateFaceFit,
  extractForeheadGreenSample,
} from '../../services/triageSignalEngine';
import {
  STRESS_SCALE_BANDS,
  classifyStressBand,
  computeCalibratedStressScale,
} from '../../services/stressScaleCalibration';
import { runWellnessTriageAssessment } from '../../services/geminiService';
import { recordAutoMoodFromScore } from '../../services/moodCalendarService';

interface StressCheckInProps {
  onBack: () => void;
  defaultAgeGroup?: StressCheckInAgeGroup;
  onLaunchBreathing?: () => void;
  onOpenMentor?: () => void;
}

const MEDIAPIPE_FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const AUTO_CAPTURE_HOLD_MS = 1800;

const INITIAL_TELEMETRY: LocalBiometricTelemetry = {
  bpm: null,
  bpmConfidence: 'low',
  ear: null,
  blinkRate: 0,
  eyeFatigueLabel: 'Pending',
  browTensionIndex: null,
  signalQuality: 'calibrating',
  motionArtifact: false,
  faceDetected: false,
  bufferProgress: 0,
};

const INITIAL_FACE_FIT: FaceFitEvaluation = {
  status: 'no_face',
  isFit: false,
  fitScore: 0,
  guidance: 'Position your face inside the oval outline',
  faceBox: null,
};

const DISTRESS_PATTERN =
  /\b(suicide|kill myself|end my life|hurt myself|self[- ]?harm|don'?t want to live|want to die)\b/i;

const SIGNAL_QUALITY_META: Record<
  SignalQualityStatus,
  { label: string; toneClass: string; badgeClass: string }
> = {
  good: {
    label: 'Good Lock',
    toneClass: 'text-[#047857]',
    badgeClass: 'bg-[#d1fae5] text-[#065f46] border-[#6ee7b7]',
  },
  fair: {
    label: 'Fair Signal',
    toneClass: 'text-[#0369a1]',
    badgeClass: 'bg-[#e0f2fe] text-[#075985] border-[#7dd3fc]',
  },
  calibrating: {
    label: 'Calibrating',
    toneClass: 'text-[#0f766e]',
    badgeClass: 'bg-[#ccfbf1] text-[#115e59] border-[#5eead4]',
  },
  hold_still: {
    label: 'Hold Still',
    toneClass: 'text-amber-800',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  no_face: {
    label: 'No Face',
    toneClass: 'text-rose-700',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
};

const CATEGORY_STYLES: Record<
  PrimaryTriageCategory,
  { bg: string; border: string; text: string; bar: string }
> = {
  'Optimal / Rested': {
    bg: 'bg-[#e6faf6]',
    border: 'border-[#5eead4]',
    text: 'text-[#065f46]',
    bar: 'from-[#10b981] to-[#0d9488]',
  },
  'Acute Cognitive Stress': {
    bg: 'bg-[#fff7ed]',
    border: 'border-[#fdba74]',
    text: 'text-[#9a3412]',
    bar: 'from-[#f59e0b] to-[#ea580c]',
  },
  'Physical Fatigue / Sleep Debt': {
    bg: 'bg-[#eef2ff]',
    border: 'border-[#a5b4fc]',
    text: 'text-[#3730a3]',
    bar: 'from-[#0284c7] to-[#4f46e5]',
  },
  'Potential Illness / Recovery Needed': {
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-900',
    bar: 'from-[#f97316] to-[#e11d48]',
  },
};

const StressCheckIn: React.FC<StressCheckInProps> = ({
  onBack,
  defaultAgeGroup = 'youth',
  onLaunchBreathing,
  onOpenMentor,
}) => {
  const [hasEnteredStudio, setHasEnteredStudio] = useState(false);
  const [hasConsentedCamera, setHasConsentedCamera] = useState(false);
  const [ageGroup, setAgeGroup] = useState<StressCheckInAgeGroup>(defaultAgeGroup);
  const [showSources, setShowSources] = useState(false);

  // Camera & local MediaPipe telemetry state
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [mediapipeReady, setMediapipeReady] = useState(false);
  const [guidanceText, setGuidanceText] = useState('Starting local camera & landmark engine...');
  const [telemetry, setTelemetry] = useState<LocalBiometricTelemetry>(INITIAL_TELEMETRY);
  const [faceFit, setFaceFit] = useState<FaceFitEvaluation>(INITIAL_FACE_FIT);
  const [foreheadRoi, setForeheadRoi] = useState<ForeheadRoiNormalized | null>(null);

  // Symptom & context fusion inputs
  const [baseline, setBaseline] = useState<TriageBaseline>('at_rest');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [otherSymptoms, setOtherSymptoms] = useState('');

  // Auto-snapshot on outline fit (enabled by default; captures once per arming)
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true);
  const [autoCaptureProgress, setAutoCaptureProgress] = useState(0); // 0-100 hold progress inside outline
  const [autoCaptureCompleted, setAutoCaptureCompleted] = useState(false);
  const [snapshotFlash, setSnapshotFlash] = useState(false);

  // API assessment state
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<TriageAssessmentResult | null>(null);
  const [safetyCrisisTriggered, setSafetyCrisisTriggered] = useState(false);

  // Live hardware & signal processing refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const lumaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const roiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastUiSyncRef = useRef<number>(0);
  const fitStartMsRef = useRef<number | null>(null);

  const blinkTrackerRef = useRef<BlinkTracker>(new BlinkTracker());
  const rppgEstimatorRef = useRef<RppgPulseEstimator>(new RppgPulseEstimator());
  const latestTelemetryRef = useRef<LocalBiometricTelemetry>(INITIAL_TELEMETRY);
  const resultsAnchorRef = useRef<HTMLDivElement | null>(null);
  const autoCaptureArmedRef = useRef<{ enabled: boolean; completed: boolean; assessing: boolean }>({
    enabled: true,
    completed: false,
    assessing: false,
  });

  const stopCameraResources = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (faceLandmarkerRef.current) {
      try {
        faceLandmarkerRef.current.close();
      } catch {
        // ignore cleanup error
      }
      faceLandmarkerRef.current = null;
    }
    blinkTrackerRef.current.reset();
    rppgEstimatorRef.current.reset();
    fitStartMsRef.current = null;
    setCameraReady(false);
    setMediapipeReady(false);
    setForeheadRoi(null);
    setFaceFit(INITIAL_FACE_FIT);
    setAutoCaptureProgress(0);
  }, []);

  useEffect(() => {
    autoCaptureArmedRef.current = {
      enabled: autoCaptureEnabled,
      completed: autoCaptureCompleted,
      assessing: isAssessing,
    };
  }, [autoCaptureEnabled, autoCaptureCompleted, isAssessing]);

  useEffect(() => {
    return () => {
      stopCameraResources();
    };
  }, [stopCameraResources]);

  const estimateBrightness = (video: HTMLVideoElement): number => {
    if (!lumaCanvasRef.current) {
      lumaCanvasRef.current = document.createElement('canvas');
      lumaCanvasRef.current.width = 64;
      lumaCanvasRef.current.height = 48;
    }
    const ctx = lumaCanvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 128;
    ctx.drawImage(video, 0, 0, 64, 48);
    const data = ctx.getImageData(0, 0, 64, 48).data;
    let totalLuma = 0;
    const pixelCount = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return totalLuma / pixelCount;
  };

  // Start client-side MediaPipe + rPPG loop once the user enters the studio
  useEffect(() => {
    if (!hasEnteredStudio) {
      stopCameraResources();
      return;
    }

    let cancelled = false;

    const startEngine = async () => {
      setCameraError(null);
      setCameraReady(false);
      setGuidanceText('Requesting webcam access...');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Your browser does not support webcam access here. Please try another browser or device with a camera.'
        );
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setCameraError(
            'Camera permission was declined. Enable camera access in your browser settings and retry.'
          );
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setCameraError('No camera was detected on this device.');
        } else {
          setCameraError('Could not open your webcam right now. Check browser permissions and try again.');
        }
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        // playsInline + muted handles autoplay
      }
      setCameraReady(true);
      setGuidanceText('Loading 478-point FaceLandmarker locally...');

      try {
        const vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');
        if (cancelled) return;
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MEDIAPIPE_FACE_MODEL_URL,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
        });
        if (cancelled) {
          landmarker.close();
          return;
        }
        faceLandmarkerRef.current = landmarker;
        setMediapipeReady(true);
        setGuidanceText('Face lock active — hold steady for pulse & tension readout');
      } catch {
        if (!cancelled) {
          setMediapipeReady(false);
          setGuidanceText('Local landmark model unavailable — snapshot + symptom triage still works');
        }
      }

      if (!roiCanvasRef.current) {
        roiCanvasRef.current = document.createElement('canvas');
      }

      const detectLoop = () => {
        if (cancelled || !videoRef.current) return;
        const vid = videoRef.current;
        const nowMs = performance.now();

        if (vid.readyState >= 2 && vid.videoWidth > 0 && vid.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = vid.currentTime;
          const avgBrightness = estimateBrightness(vid);

          if (faceLandmarkerRef.current) {
            try {
              const results = faceLandmarkerRef.current.detectForVideo(vid, nowMs);
              const landmarks = results.faceLandmarks?.[0];

              if (!landmarks || landmarks.length === 0) {
                const rppg = rppgEstimatorRef.current.pushFrame(null, null, nowMs);
                const blink = blinkTrackerRef.current.update(null, nowMs);

                const nextTelemetry: LocalBiometricTelemetry = {
                  bpm: rppg.bpm,
                  bpmConfidence: rppg.confidence,
                  ear: blink.avgEar,
                  blinkRate: blink.blinkRate,
                  eyeFatigueLabel: blink.eyeFatigueLabel,
                  browTensionIndex: null,
                  signalQuality: 'no_face',
                  motionArtifact: false,
                  faceDetected: false,
                  bufferProgress: rppg.bufferProgress,
                };
                latestTelemetryRef.current = nextTelemetry;
                const noFaceFit = evaluateFaceFit(null, avgBrightness, false);
                fitStartMsRef.current = null;

                if (nowMs - lastUiSyncRef.current >= 320) {
                  lastUiSyncRef.current = nowMs;
                  setTelemetry(nextTelemetry);
                  setFaceFit(noFaceFit);
                  setAutoCaptureProgress(0);
                  setForeheadRoi(null);
                  setGuidanceText(noFaceFit.guidance);
                }
              } else {
                const ear = computeEyeAspectRatio(landmarks);
                const blink = blinkTrackerRef.current.update(ear, nowMs);
                const browTensionIndex = computeBrowTensionIndex(landmarks);

                const roiSample = roiCanvasRef.current
                  ? extractForeheadGreenSample(vid, landmarks, roiCanvasRef.current)
                  : null;
                const rppg = rppgEstimatorRef.current.pushFrame(
                  roiSample ? roiSample.greenMean : null,
                  landmarks,
                  nowMs
                );

                const signalQuality = deriveSignalQuality(
                  true,
                  rppg.motionArtifact,
                  rppg.bufferProgress,
                  rppg.confidence,
                  avgBrightness
                );

                const nextTelemetry: LocalBiometricTelemetry = {
                  bpm: rppg.bpm,
                  bpmConfidence: rppg.confidence,
                  ear: blink.avgEar,
                  blinkRate: blink.blinkRate,
                  eyeFatigueLabel: blink.eyeFatigueLabel,
                  browTensionIndex,
                  signalQuality,
                  motionArtifact: rppg.motionArtifact,
                  faceDetected: true,
                  bufferProgress: rppg.bufferProgress,
                };
                latestTelemetryRef.current = nextTelemetry;

                const fitEval = evaluateFaceFit(landmarks, avgBrightness, rppg.motionArtifact);
                const armed = autoCaptureArmedRef.current;

                let holdPct = 0;
                let shouldFireAutoSnapshot = false;

                if (fitEval.isFit && armed.enabled && !armed.completed && !armed.assessing) {
                  if (fitStartMsRef.current === null) {
                    fitStartMsRef.current = nowMs;
                  }
                  const heldMs = nowMs - fitStartMsRef.current;
                  holdPct = Math.min(100, Math.round((heldMs / AUTO_CAPTURE_HOLD_MS) * 100));
                  if (heldMs >= AUTO_CAPTURE_HOLD_MS) {
                    shouldFireAutoSnapshot = true;
                    fitStartMsRef.current = null;
                  }
                } else if (!fitEval.isFit) {
                  fitStartMsRef.current = null;
                }

                if (shouldFireAutoSnapshot) {
                  lastUiSyncRef.current = nowMs;
                  setTelemetry(nextTelemetry);
                  setFaceFit(fitEval);
                  setAutoCaptureProgress(100);
                  setForeheadRoi(roiSample ? roiSample.roiNorm : null);
                  setAutoCaptureCompleted(true);
                  setSnapshotFlash(true);
                  window.setTimeout(() => setSnapshotFlash(false), 260);
                  setGuidanceText('Face fitted — snapshot captured automatically');
                  runAssessmentRef.current();
                } else if (nowMs - lastUiSyncRef.current >= 320) {
                  lastUiSyncRef.current = nowMs;
                  setTelemetry(nextTelemetry);
                  setFaceFit(fitEval);
                  setAutoCaptureProgress(holdPct);
                  setForeheadRoi(roiSample ? roiSample.roiNorm : null);

                  if (!fitEval.isFit) {
                    setGuidanceText(fitEval.guidance);
                  } else if (armed.enabled && !armed.completed && !armed.assessing) {
                    const remainingSec = Math.max(0.2, ((100 - holdPct) / 100) * (AUTO_CAPTURE_HOLD_MS / 1000));
                    setGuidanceText(`Face fitted — capturing snapshot in ${remainingSec.toFixed(1)}s`);
                  } else if (armed.assessing) {
                    setGuidanceText('Synthesizing snapshot + calibrated metrics...');
                  } else {
                    setGuidanceText('Face aligned in outline — ready to run assessment');
                  }
                }
              }
            } catch {
              // Resilient against transient frame decode issues
            }
          }
        }

        rafRef.current = requestAnimationFrame(detectLoop);
      };

      rafRef.current = requestAnimationFrame(detectLoop);
    };

    startEngine();

    return () => {
      cancelled = true;
      stopCameraResources();
    };
  }, [hasEnteredStudio, stopCameraResources]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleRunAssessment = useCallback(async () => {
    if (isAssessing) return;

    // Crisis safety check on typed context before making any camera/API call
    if (DISTRESS_PATTERN.test(otherSymptoms)) {
      setSafetyCrisisTriggered(true);
      setAssessmentResult(null);
      setAssessmentError(null);
      setAutoCaptureCompleted(true);
      return;
    }

    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth <= 0) {
      setAssessmentError('Webcam preview is still warming up. Please wait a second and try again.');
      return;
    }

    setSafetyCrisisTriggered(false);
    setAssessmentError(null);
    setIsAssessing(true);
    setAutoCaptureCompleted(true);
    fitStartMsRef.current = null;
    setAutoCaptureProgress(0);

    // Capture a single compressed JPEG snapshot (max 480px wide)
    const canvas = document.createElement('canvas');
    const targetWidth = Math.min(video.videoWidth, 480);
    const targetHeight = Math.round((video.videoHeight / video.videoWidth) * targetWidth);
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    let compressedDataUrl: string | null = null;
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not capture snapshot frame right now.');
      }
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      compressedDataUrl = canvas.toDataURL('image/jpeg', 0.78);

      const snap = latestTelemetryRef.current;
      const calibratedScaleSnapshot = computeCalibratedStressScale(
        snap,
        baseline,
        selectedSymptoms,
        otherSymptoms.trim()
      );

      const result = await runWellnessTriageAssessment({
        imageBase64: compressedDataUrl,
        mimeType: 'image/jpeg',
        telemetry: {
          bpm: snap.bpm,
          bpmConfidence: snap.bpmConfidence,
          ear: snap.ear,
          blinkRate: snap.blinkRate,
          browTensionIndex: snap.browTensionIndex,
          signalQuality: snap.signalQuality,
        },
        symptoms: selectedSymptoms,
        otherSymptoms: otherSymptoms.trim(),
        baseline,
        calibratedScale: calibratedScaleSnapshot,
      });

      setAssessmentResult({
        ...result,
        calibratedScale: result.calibratedScale ?? calibratedScaleSnapshot,
      });
      try {
        localStorage.setItem(
          'mindguard_latest_stress_score',
          String(Math.round(result.overallStrainScore))
        );
        recordAutoMoodFromScore(result.overallStrainScore, result.primaryCategory || 'Stress Check-In');
      } catch {
        // ignore storage quota errors
      }
      requestAnimationFrame(() => {
        resultsAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    } catch (err) {
      setAssessmentError(
        err instanceof Error
          ? err.message
          : 'Could not complete the triage assessment right now. Please try again.'
      );
    } finally {
      // Immediately wipe ephemeral image buffer
      compressedDataUrl = null;
      canvas.width = 0;
      canvas.height = 0;
      setIsAssessing(false);
    }
  }, [baseline, isAssessing, otherSymptoms, selectedSymptoms]);

  const runAssessmentRef = useRef(handleRunAssessment);
  runAssessmentRef.current = handleRunAssessment;

  const handleRearmAutoCapture = () => {
    fitStartMsRef.current = null;
    setAutoCaptureProgress(0);
    setAutoCaptureCompleted(false);
    setAutoCaptureEnabled(true);
    setAssessmentError(null);
  };

  const handleStartTriage = () => {
    if (!hasConsentedCamera) return;
    setAssessmentResult(null);
    setAssessmentError(null);
    setSafetyCrisisTriggered(false);
    setTelemetry(INITIAL_TELEMETRY);
    setFaceFit(INITIAL_FACE_FIT);
    fitStartMsRef.current = null;
    setAutoCaptureProgress(0);
    setAutoCaptureCompleted(false);
    setAutoCaptureEnabled(true);
    setHasEnteredStudio(true);
  };

  const browLevelLabel =
    telemetry.browTensionIndex === null
      ? 'Pending'
      : telemetry.browTensionIndex < 30
      ? 'Relaxed'
      : telemetry.browTensionIndex < 62
      ? 'Moderate'
      : 'Furrowed';

  const qualityMeta = SIGNAL_QUALITY_META[telemetry.signalQuality];
  const liveCalibratedScale = computeCalibratedStressScale(
    telemetry,
    baseline,
    selectedSymptoms,
    otherSymptoms.trim()
  );

  return (
    <div className="bg-gradient-to-b from-[#eefaf7] via-[#f4fbff] to-[#fff8f4] h-full flex flex-col overflow-y-auto">
      {/* Sticky Header */}
      <header className="px-4 sm:px-6 py-3.5 bg-white/95 backdrop-blur-md border-b border-[#bde6de] flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              stopCameraResources();
              onBack();
            }}
            aria-label="Go back"
            className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl hover:bg-[#e3f7f3] text-[#4b7476] hover:text-[#0f3d3e] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-[#0f3d3e] font-serif-elegant leading-tight truncate">
              Wellness &amp; Stress Triage
            </h1>
            <p className="text-xs font-medium text-[#0f766e] truncate" aria-live="polite">
              {!hasEnteredStudio
                ? 'Privacy & Consent'
                : mediapipeReady
                ? 'Live local telemetry + multi-modal check'
                : 'Live preview + symptom context'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSources((prev) => !prev)}
          aria-expanded={showSources}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#0284c7] bg-[#e0f2fe] hover:bg-[#bae6fd] px-3.5 py-2 rounded-xl border border-[#bae6fd] transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
        >
          <InfoCircleIcon className="w-4 h-4 text-[#0284c7]" />
          <span>How it works</span>
        </button>
      </header>

      <div className="w-full max-w-5xl mx-auto flex-grow flex flex-col px-4 sm:px-6 py-4 sm:py-5 space-y-4">
        {/* Prominent Safety Disclaimer Banner */}
        <div
          role="note"
          className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center space-x-2.5"
        >
          <InfoCircleIcon className="w-5 h-5 text-amber-800 shrink-0" />
          <p className="text-xs sm:text-sm font-semibold text-amber-950 leading-snug">
            Wellness &amp; symptom-tracking tool only—not a medical diagnosis. Consult a doctor for medical advice.
          </p>
        </div>

        {/* Expandable Sources Drawer */}
        {showSources && (
          <section
            aria-label="Sources and how this works"
            className="p-5 rounded-2xl bg-white border border-[#cce7e3] space-y-3 text-left"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0f3d3e] font-serif-elegant">
                Sources &amp; Hybrid Pipeline Overview
              </h2>
              <button
                type="button"
                onClick={() => setShowSources(false)}
                aria-label="Close sources"
                className="text-xs font-semibold text-[#0f766e] hover:underline px-2 py-1"
              >
                Close
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#335c5d] leading-relaxed">
              <strong>Zero-streaming local processing:</strong> Your browser runs MediaPipe FaceLandmarker locally to
              compute blink rate (EAR), brow tension, and forehead green-channel pulse estimates without sending video.
              Only a single compressed JPEG snapshot + telemetry + symptoms is analyzed when you click{' '}
              <strong>Run Full Assessment</strong>. Facial cues alone are unreliable indicators of stress.
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {AUTHORITATIVE_SOURCES.map((src) => (
                <li
                  key={src.title}
                  className="text-xs text-[#335c5d] bg-[#f4fbfa] p-3 rounded-xl border border-[#dcefeb]"
                >
                  <p className="font-bold text-[#0f3d3e]">{src.title}</p>
                  <p className="mt-0.5 leading-relaxed">{src.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CONSENT GATE */}
        {!hasEnteredStudio ? (
          <div className="max-w-2xl mx-auto w-full pt-1">
            <Card className="rounded-3xl border border-[#bde6de] p-5 sm:p-7 space-y-5 bg-white">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#ccf7ef] to-[#e0f2fe] text-[#0f766e] shrink-0">
                  <ShieldCheckIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0f3d3e] font-serif-elegant text-balance">
                    Private, Hybrid Wellness &amp; Stress Triage
                  </h2>
                  <p className="text-sm text-[#335c5d] mt-1 leading-relaxed">
                    Measures local facial signals (pulse trend, blink rate, brow tension) in your browser at zero cost,
                    then combines a single snapshot with your symptoms when you choose to run an assessment.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#335c5d] mb-2" id="age-group-label">
                  Who is checking in today?
                </p>
                <div
                  role="radiogroup"
                  aria-labelledby="age-group-label"
                  className="grid grid-cols-2 gap-2.5"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={ageGroup === 'youth'}
                    onClick={() => setAgeGroup('youth')}
                    className={`py-3 px-3 rounded-xl text-xs font-semibold border transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                      ageGroup === 'youth'
                        ? 'bg-gradient-to-r from-[#e6faf6] to-[#e0f2fe] border-[#0d9488] text-[#0f3d3e]'
                        : 'bg-white border-[#cce7e3] text-[#4b7476] hover:border-[#8cd3ca]'
                    }`}
                  >
                    🎒 Student / Younger User
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={ageGroup === 'adult'}
                    onClick={() => setAgeGroup('adult')}
                    className={`py-3 px-3 rounded-xl text-xs font-semibold border transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                      ageGroup === 'adult'
                        ? 'bg-gradient-to-r from-[#eef2ff] to-[#e0f2fe] border-[#4f46e5] text-[#0f3d3e]'
                        : 'bg-white border-[#cce7e3] text-[#4b7476] hover:border-[#8cd3ca]'
                    }`}
                  >
                    💼 Working Adult
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#e6faf6] to-[#eff9ff] border border-[#99e2d8] rounded-2xl p-4 space-y-1.5">
                <p className="text-xs font-bold text-[#0f766e]">Simple Privacy Promise</p>
                <p className="text-xs sm:text-sm text-[#335c5d] leading-relaxed">
                  Video frames stay strictly inside your browser for live pulse, blink, and brow metrics. Only one
                  compressed photo is sent when you click <strong>Run Full Assessment</strong>, and it is discarded right
                  away.
                </p>
              </div>

              <label className="flex items-start space-x-3 p-4 rounded-2xl bg-[#f4fbfa] border border-[#cce7e3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConsentedCamera}
                  onChange={(e) => setHasConsentedCamera(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-[#8cd3ca] text-[#0d9488] accent-[#0d9488] focus:ring-[#0d9488]"
                />
                <span className="text-xs sm:text-sm font-medium text-[#0f3d3e] leading-snug">
                  I agree to use my camera locally for live wellness signals and send a single temporary snapshot when I
                  run an assessment.
                </span>
              </label>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleStartTriage}
                  disabled={!hasConsentedCamera}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0d9488] to-[#0891b2] hover:brightness-105 text-white font-semibold text-sm transition-all disabled:from-[#cce7e3] disabled:to-[#cce7e3] disabled:text-[#4b7476] disabled:cursor-not-allowed flex items-center justify-center space-x-2 min-h-[48px]"
                >
                  <CameraIcon className="w-5 h-5" />
                  <span>I agree — Open Live Triage Engine</span>
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#eaf6f4] text-[#335c5d] font-semibold text-xs border border-[#cce7e3] transition-colors min-h-[44px]"
                >
                  Cancel &amp; Go Back
                </button>
              </div>
            </Card>
          </div>
        ) : (
          /* LIVE MULTI-SIGNAL TRIAGE STUDIO */
          <div className="space-y-5 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT COLUMN: Webcam Feed + Real-Time Local Telemetry */}
              <div className="lg:col-span-6 space-y-4">
                <Card className="rounded-3xl border border-[#bde6de] p-4 sm:p-5 space-y-3.5 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-[#0f3d3e] font-serif-elegant">
                        Live Local Biometrics
                      </h2>
                      <p className="text-xs text-[#4b7476]">
                        Browser-only 478-landmark tracking &amp; forehead rPPG
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border whitespace-nowrap ${qualityMeta.badgeClass}`}
                    >
                      {qualityMeta.label}
                    </span>
                  </div>

                  {cameraError ? (
                    <div role="alert" className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                      <p className="text-sm font-medium text-amber-950 leading-relaxed">{cameraError}</p>
                      <div className="flex space-x-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setHasEnteredStudio(false);
                            setCameraError(null);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-[#0d9488] text-white font-semibold text-xs hover:bg-[#0f766e] transition-colors min-h-[44px]"
                        >
                          Retry Camera Setup
                        </button>
                        <button
                          type="button"
                          onClick={onBack}
                          className="flex-1 py-2.5 rounded-xl bg-white text-[#335c5d] font-semibold text-xs border border-[#cce7e3] hover:bg-[#eaf6f4] transition-colors min-h-[44px]"
                        >
                          Go Back
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Webcam Viewport with Face-Fit Outline, Auto-Capture Ring & Forehead ROI */}
                      <div className="relative rounded-2xl overflow-hidden bg-[#0f3d3e] aspect-[4/3] w-full flex items-center justify-center">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          aria-label="Live webcam preview with face-fit outline guide"
                          className="w-full h-full object-cover transform -scale-x-100"
                        />

                        {/* Vignette & Precision Face-Fit Outline Overlay */}
                        <svg
                          viewBox="0 0 400 300"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 w-full h-full"
                        >
                          <defs>
                            <mask id="face-fit-vignette-mask">
                              <rect x="0" y="0" width="400" height="300" fill="white" />
                              <ellipse cx="200" cy="142" rx="84" ry="102" fill="black" />
                            </mask>
                          </defs>

                          {/* Soft outer scrim outside the face outline */}
                          <rect
                            x="0"
                            y="0"
                            width="400"
                            height="300"
                            fill="rgba(6, 28, 30, 0.34)"
                            mask="url(#face-fit-vignette-mask)"
                          />

                          {/* Guide dashed base oval */}
                          <ellipse
                            cx="200"
                            cy="142"
                            rx="84"
                            ry="102"
                            fill="none"
                            stroke={
                              faceFit.isFit
                                ? '#34d399'
                                : faceFit.status === 'no_face'
                                ? 'rgba(204, 251, 241, 0.65)'
                                : '#fbbf24'
                            }
                            strokeWidth={faceFit.isFit ? '2.5' : '2'}
                            strokeDasharray={faceFit.isFit ? undefined : '7 6'}
                            className="transition-colors duration-200"
                          />

                          {/* Auto-snapshot countdown progress ring along oval perimeter (~586px) */}
                          {faceFit.isFit && autoCaptureEnabled && !autoCaptureCompleted && (
                            <ellipse
                              cx="200"
                              cy="142"
                              rx="84"
                              ry="102"
                              fill="none"
                              stroke="#2dd4bf"
                              strokeWidth="5"
                              strokeLinecap="round"
                              strokeDasharray="586"
                              strokeDashoffset={586 - (586 * autoCaptureProgress) / 100}
                              transform="rotate(-90 200 142)"
                              style={{ transition: 'stroke-dashoffset 280ms linear' }}
                            />
                          )}

                          {/* Corner reticle ticks framing the face outline */}
                          <path
                            d="M110 62 L110 42 L130 42 M290 62 L290 42 L270 42 M110 222 L110 242 L130 242 M290 222 L290 242 L270 242"
                            fill="none"
                            stroke={faceFit.isFit ? '#6ee7b7' : 'rgba(255,255,255,0.6)'}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                          />
                        </svg>

                        {/* Top Face-Fit Alignment Chip */}
                        <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          <div
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border backdrop-blur-md flex items-center space-x-1.5 ${
                              autoCaptureCompleted && isAssessing
                                ? 'bg-[#065f46]/90 border-[#6ee7b7] text-[#ecfdf5]'
                                : faceFit.isFit
                                ? 'bg-[#065f46]/90 border-[#34d399] text-[#ecfdf5]'
                                : faceFit.status === 'no_face'
                                ? 'bg-slate-950/75 border-white/20 text-white'
                                : 'bg-amber-950/85 border-amber-300/80 text-amber-100'
                            }`}
                          >
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${
                                faceFit.isFit
                                  ? 'bg-[#34d399]'
                                  : faceFit.status === 'no_face'
                                  ? 'bg-slate-300'
                                  : 'bg-amber-300'
                              }`}
                            />
                            <span>
                              {isAssessing
                                ? 'Snapshot Taken'
                                : faceFit.isFit
                                ? autoCaptureEnabled && !autoCaptureCompleted
                                  ? `Face Fitted · ${autoCaptureProgress}%`
                                  : 'Face Fitted in Outline'
                                : faceFit.status === 'moving'
                                ? 'Hold Still'
                                : faceFit.status === 'too_far'
                                ? 'Move Closer'
                                : faceFit.status === 'too_close'
                                ? 'Move Back'
                                : faceFit.status === 'low_light'
                                ? 'More Light Needed'
                                : faceFit.status === 'off_center'
                                ? 'Center Face'
                                : 'Fit Face Inside Outline'}
                            </span>
                          </div>

                          {telemetry.faceDetected && (
                            <span className="px-2 py-1 rounded-lg bg-slate-950/75 border border-white/15 text-[11px] font-mono-num font-semibold text-[#99f6e4] backdrop-blur-md">
                              Fit {faceFit.fitScore}%
                            </span>
                          )}
                        </div>

                        {/* Forehead rPPG ROI indicator (mirrored horizontally to match -scale-x-100 video) */}
                        {foreheadRoi && (
                          <div
                            aria-hidden="true"
                            style={{
                              left: `${(1 - (foreheadRoi.x + foreheadRoi.width)) * 100}%`,
                              top: `${foreheadRoi.y * 100}%`,
                              width: `${foreheadRoi.width * 100}%`,
                              height: `${foreheadRoi.height * 100}%`,
                            }}
                            className={`pointer-events-none absolute rounded-lg border-2 transition-all duration-150 ${
                              telemetry.motionArtifact
                                ? 'border-amber-300 bg-amber-400/15'
                                : 'border-[#5eead4] bg-[#2dd4bf]/15'
                            }`}
                          >
                            <span className="absolute -top-5 left-0 text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#0f3d3e]/85 text-[#99f6e4] whitespace-nowrap">
                              rPPG ROI
                            </span>
                          </div>
                        )}

                        {/* Brief Snapshot Camera Flash Overlay */}
                        {snapshotFlash && (
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 bg-white/75 transition-opacity duration-200"
                          />
                        )}

                        <div
                          aria-live="polite"
                          className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-xl bg-slate-950/80 text-white border border-white/15 text-center text-xs font-medium backdrop-blur-md"
                        >
                          {guidanceText}
                        </div>
                      </div>

                      {/* Auto-Snapshot Control Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-[#f4fbfa] border border-[#cce7e3]">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0f3d3e]">
                            Auto-Snapshot on Outline Fit
                          </p>
                          <p className="text-[11px] text-[#4b7476]">
                            {autoCaptureCompleted
                              ? 'Captured once when face fitted — re-arm anytime for a new scan.'
                              : autoCaptureEnabled
                              ? 'Captures automatically after holding fitted inside the outline (~1.8s).'
                              : 'Paused — capture manually with Run Full Assessment.'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          {autoCaptureCompleted && (
                            <button
                              type="button"
                              onClick={handleRearmAutoCapture}
                              disabled={isAssessing}
                              className="px-3 py-1.5 rounded-xl bg-white border border-[#8cd3ca] text-[#0f766e] hover:bg-[#e6faf6] text-xs font-semibold min-h-[38px]"
                            >
                              Re-arm Auto-Scan
                            </button>
                          )}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={autoCaptureEnabled}
                            onClick={() => {
                              fitStartMsRef.current = null;
                              setAutoCaptureProgress(0);
                              setAutoCaptureCompleted(false);
                              setAutoCaptureEnabled((prev) => !prev);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors min-h-[38px] ${
                              autoCaptureEnabled
                                ? 'bg-[#0d9488] border-[#0d9488] text-white'
                                : 'bg-white border-[#bde6de] text-[#0f766e] hover:bg-[#e6faf6]'
                            }`}
                          >
                            {autoCaptureEnabled ? 'Auto On' : 'Auto Off'}
                          </button>
                        </div>
                      </div>

                      {/* 2x2 Real-Time Telemetry Readout Grid (Zero API Cost) */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Live BPM */}
                        <div className="p-3 rounded-2xl bg-[#eefaf7] border border-[#bde6de] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wide text-[#0f766e]">
                              Live Pulse
                            </span>
                            <HeartPulseIcon className="w-4 h-4 text-[#0d9488]" />
                          </div>
                          <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-bold text-[#0f3d3e] font-mono-num">
                              {telemetry.bpm !== null ? telemetry.bpm : '--'}
                            </span>
                            <span className="text-xs font-semibold text-[#4b7476]">BPM</span>
                          </div>
                          {telemetry.bufferProgress < 100 ? (
                            <div className="w-full h-1.5 rounded-full bg-[#cce7e3] overflow-hidden">
                              <div
                                className="h-full bg-[#0d9488] transition-all duration-300"
                                style={{ width: `${telemetry.bufferProgress}%` }}
                              />
                            </div>
                          ) : (
                            <p className="text-[11px] font-medium text-[#3d6b6d]">
                              {baseline === 'just_exercised' ? 'Post-exercise' : 'AHA 60–100 ref'} ·{' '}
                              {telemetry.bpmConfidence} conf.
                            </p>
                          )}
                        </div>

                        {/* Blink Rate & EAR */}
                        <div className="p-3 rounded-2xl bg-[#eff8ff] border border-[#bae6fd] space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-[#0369a1]">
                            Blink &amp; EAR
                          </span>
                          <div className="flex items-baseline space-x-1.5">
                            <span className="text-2xl font-bold text-[#0f3d3e] font-mono-num">
                              {telemetry.blinkRate}
                            </span>
                            <span className="text-xs font-semibold text-[#4b7476]">/min</span>
                          </div>
                          <p className="text-[11px] font-medium text-[#075985] font-mono-num">
                            EAR {telemetry.ear !== null ? telemetry.ear.toFixed(2) : '--'} ·{' '}
                            {telemetry.eyeFatigueLabel}
                          </p>
                        </div>

                        {/* Brow Tension Index */}
                        <div className="p-3 rounded-2xl bg-[#fff7ed] border border-[#fed7aa] space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-[#9a3412]">
                            Brow Tension
                          </span>
                          <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-bold text-[#0f3d3e] font-mono-num">
                              {telemetry.browTensionIndex !== null ? telemetry.browTensionIndex : '--'}
                            </span>
                            <span className="text-xs font-semibold text-[#4b7476]">/100</span>
                          </div>
                          <p className="text-[11px] font-medium text-[#9a3412]">{browLevelLabel}</p>
                        </div>

                        {/* Calibrated Pre-Check Baseline Preview */}
                        <div className="p-3 rounded-2xl bg-[#f4fbfa] border border-[#cce7e3] space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-[#3d6b6d]">
                            Calibrated Index
                          </span>
                          <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-bold text-[#0f3d3e] font-mono-num">
                              {liveCalibratedScale.calibratedScore}
                            </span>
                            <span className="text-xs font-semibold text-[#4b7476]">/100</span>
                          </div>
                          <p className="text-[11px] font-medium text-[#0f766e] truncate">
                            {liveCalibratedScale.bandRange} · {liveCalibratedScale.bandLabel.split(' / ')[0]}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </div>

              {/* RIGHT COLUMN: Current Symptoms & Context + Assessment Trigger */}
              <div className="lg:col-span-6 space-y-4">
                <Card className="rounded-3xl border border-[#bde6de] p-4 sm:p-5 space-y-4 bg-white">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#0f3d3e] font-serif-elegant">
                      Current Symptoms &amp; Context
                    </h2>
                    <p className="text-xs text-[#4b7476] mt-0.5">
                      Add what you feel physically so the triage does not rely on visual guesswork alone.
                    </p>
                  </div>

                  {/* Activity Baseline Toggle */}
                  <div>
                    <p className="text-xs font-semibold text-[#335c5d] mb-2" id="baseline-label">
                      Activity Baseline
                    </p>
                    <div
                      role="radiogroup"
                      aria-labelledby="baseline-label"
                      className="grid grid-cols-2 gap-2"
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={baseline === 'at_rest'}
                        onClick={() => setBaseline('at_rest')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors min-h-[44px] flex items-center justify-center space-x-1.5 ${
                          baseline === 'at_rest'
                            ? 'bg-[#e6faf6] border-[#0d9488] text-[#0f3d3e]'
                            : 'bg-white border-[#cce7e3] text-[#4b7476] hover:border-[#8cd3ca]'
                        }`}
                      >
                        <span>🪑 At rest</span>
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={baseline === 'just_exercised'}
                        onClick={() => setBaseline('just_exercised')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors min-h-[44px] flex items-center justify-center space-x-1.5 ${
                          baseline === 'just_exercised'
                            ? 'bg-[#eef2ff] border-[#4f46e5] text-[#0f3d3e]'
                            : 'bg-white border-[#cce7e3] text-[#4b7476] hover:border-[#8cd3ca]'
                        }`}
                      >
                        <span>🏃 Just exercised</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick-select Symptom Toggle Buttons */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-[#335c5d]">
                        Quick Symptom Check (select any)
                      </p>
                      {selectedSymptoms.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedSymptoms([])}
                          className="text-xs font-semibold text-[#0f766e] hover:underline"
                        >
                          Clear ({selectedSymptoms.length})
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {TRIAGE_SYMPTOM_CHIPS.map((symptom) => {
                        const active = selectedSymptoms.includes(symptom);
                        return (
                          <button
                            key={symptom}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleSymptom(symptom)}
                            className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-left transition-all min-h-[44px] flex items-center justify-between gap-2 ${
                              active
                                ? 'bg-gradient-to-r from-[#0d9488] to-[#0891b2] border-[#0d9488] text-white shadow-sm'
                                : 'bg-[#f8fdfc] border-[#cce7e3] text-[#285254] hover:border-[#7dd3fc] hover:bg-[#eff8ff]'
                            }`}
                          >
                            <span className="leading-snug">{symptom}</span>
                            {active && <CheckIcon className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Short Text Note */}
                  <div>
                    <label
                      htmlFor="other-symptoms-input"
                      className="block text-xs font-semibold text-[#335c5d] mb-1.5"
                    >
                      Other symptoms or how you&apos;re feeling (optional)
                    </label>
                    <input
                      id="other-symptoms-input"
                      type="text"
                      maxLength={240}
                      value={otherSymptoms}
                      onChange={(e) => setOtherSymptoms(e.target.value)}
                      placeholder="e.g., Big exam tomorrow, eyes feel dry, slight cough..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#cce7e3] bg-[#f8fdfc] text-xs sm:text-sm text-[#0f3d3e] placeholder:text-[#7ca4a6] focus:outline-none focus:ring-2 focus:ring-[#0d9488] min-h-[44px]"
                    />
                  </div>

                  {/* Calibrated Live Scale Preview Card */}
                  <div className="p-3.5 rounded-2xl bg-[#f4fbfa] border border-[#cce7e3] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#0f3d3e]">
                        Evidence-Calibrated Scale Preview
                      </p>
                      <span className="text-xs font-bold font-mono-num text-[#0f766e]">
                        {liveCalibratedScale.calibratedScore}/100 · {liveCalibratedScale.bandRange}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-2">
                      {STRESS_SCALE_BANDS.map((band) => {
                        const isActiveBand = liveCalibratedScale.bandId === band.id;
                        return (
                          <div
                            key={band.id}
                            className={`rounded-full transition-opacity ${band.barSegmentClass} ${
                              isActiveBand ? 'opacity-100 ring-1 ring-[#0f3d3e]' : 'opacity-30'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono-num text-[#4b7476]">
                      <span>0–25 Low</span>
                      <span>26–50 Mild</span>
                      <span>51–75 Elevated</span>
                      <span>76–100 High</span>
                    </div>
                  </div>

                  {/* Single-API-call Action CTA */}
                  <button
                    type="button"
                    onClick={handleRunAssessment}
                    disabled={!cameraReady || isAssessing}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#0d9488] via-[#0891b2] to-[#4f46e5] hover:brightness-105 text-white font-semibold text-sm transition-all disabled:from-[#cce7e3] disabled:to-[#cce7e3] disabled:text-[#4b7476] disabled:cursor-not-allowed flex items-center justify-center space-x-2 min-h-[48px] shadow-sm"
                  >
                    {isAssessing ? (
                      <>
                        <RefreshIcon className="w-4 h-4 animate-spin" />
                        <span>Synthesizing Snapshot, Telemetry &amp; Symptoms...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-5 h-5" />
                        <span>Run Full Assessment</span>
                      </>
                    )}
                  </button>
                </Card>
              </div>
            </div>

            {/* DISTRESS SAFEGUARD CARD (triggered cleanly without sending image) */}
            {safetyCrisisTriggered && (
              <div ref={resultsAnchorRef}>
                <Card className="rounded-3xl border border-rose-300 bg-rose-50 p-5 sm:p-6 space-y-3">
                <h3 className="text-lg font-bold text-rose-950 font-serif-elegant">
                  We care about your safety right now
                </h3>
                <p className="text-sm text-rose-900 leading-relaxed">
                  It sounds like you may be carrying heavy distress. You don&apos;t have to handle this alone—please
                  reach out to a parent, teacher, counselor, or someone you trust, or connect with free confidential
                  support right away:
                </p>
                <div className="p-3.5 rounded-2xl bg-white border border-rose-200 text-xs sm:text-sm text-rose-950 space-y-1">
                  <p>
                    <strong>US &amp; Canada:</strong> Call or text <strong>988</strong> (Suicide &amp; Crisis Lifeline)
                  </p>
                  <p>
                    <strong>International:</strong> Visit{' '}
                    <a
                      href="https://findahelpline.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold"
                    >
                      findahelpline.com
                    </a>
                  </p>
                </div>
              </Card>
              </div>
            )}

            {/* ASSESSMENT ERROR CARD */}
            {assessmentError && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3"
              >
                <p className="text-xs sm:text-sm font-medium text-amber-950">{assessmentError}</p>
                <button
                  type="button"
                  onClick={handleRunAssessment}
                  disabled={!cameraReady || isAssessing}
                  className="px-3.5 py-2 rounded-xl bg-[#0d9488] text-white text-xs font-semibold whitespace-nowrap min-h-[40px]"
                >
                  Retry
                </button>
              </div>
            )}

            {/* STRUCTURED AI SYNTHESIS RESULTS CARD */}
            {assessmentResult && (
              <div ref={resultsAnchorRef}>
                <Card className="rounded-3xl border border-[#bde6de] p-5 sm:p-7 space-y-5 bg-white">
                  {(() => {
                    const catStyle = CATEGORY_STYLES[assessmentResult.primaryCategory];
                    const scoreBand = classifyStressBand(assessmentResult.overallStrainScore);
                    const breakdown = assessmentResult.calibratedScale ?? liveCalibratedScale;
                    return (
                      <>
                        {/* Score & Category Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-xl border text-xs font-bold ${catStyle.bg} ${catStyle.border} ${catStyle.text}`}
                              >
                                {assessmentResult.primaryCategory}
                              </span>
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-xl border text-xs font-bold ${scoreBand.pillClass}`}
                              >
                                Band {scoreBand.range}: {scoreBand.shortLabel}
                              </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-[#0f3d3e] font-serif-elegant">
                              Multi-Signal Wellness Synthesis
                            </h3>
                            <p className="text-xs text-[#4b7476]">
                              Snapshot discarded immediately · Calibrated to AHA, EAR &amp; PSS benchmarks
                            </p>
                          </div>

                          {/* Overall Strain Score Block */}
                          <div className="p-4 rounded-2xl bg-[#f4fbfa] border border-[#cce7e3] min-w-[200px]">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#0f766e]">
                              Calibrated Strain Score
                            </p>
                            <div className="flex items-baseline space-x-1 mt-0.5">
                              <span className="text-3xl font-bold text-[#0f3d3e] font-mono-num">
                                {assessmentResult.overallStrainScore}
                              </span>
                              <span className="text-xs font-semibold text-[#4b7476]">/ 100</span>
                            </div>
                            <p className="text-[11px] font-semibold text-[#335c5d] mt-0.5">
                              {scoreBand.label}
                            </p>
                          </div>
                        </div>

                        {/* Reworked 4-Band Authentic Scale Ruler + Sub-Signal Attribution */}
                        <div className="p-4 rounded-2xl bg-[#f8fdfc] border border-[#cce7e3] space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#0f766e]">
                              4-Tier Calibrated Reference Scale
                            </p>
                            <span className="text-[11px] font-medium text-[#4b7476]">
                              {scoreBand.summary}
                            </span>
                          </div>

                          <div className="relative pt-1 pb-4">
                            <div className="grid grid-cols-4 gap-1.5 h-3">
                              {STRESS_SCALE_BANDS.map((band) => (
                                <div
                                  key={band.id}
                                  className={`rounded-full ${band.barSegmentClass} ${
                                    scoreBand.id === band.id ? 'opacity-100' : 'opacity-30'
                                  }`}
                                />
                              ))}
                            </div>
                            {/* Marker Dot */}
                            <div
                              aria-hidden="true"
                              style={{
                                left: `calc(${Math.max(2, Math.min(98, assessmentResult.overallStrainScore))}% - 8px)`,
                              }}
                              className="absolute top-0.5 w-4 h-4 rounded-full bg-white border-[3px] border-[#0f3d3e] shadow-sm transition-all"
                            />
                            <div className="grid grid-cols-4 gap-1.5 mt-2 text-[10px] sm:text-[11px] font-mono-num text-[#335c5d]">
                              {STRESS_SCALE_BANDS.map((band) => (
                                <div
                                  key={band.id}
                                  className={scoreBand.id === band.id ? 'font-bold text-[#0f3d3e]' : 'opacity-75'}
                                >
                                  {band.range} · {band.shortLabel}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Per-Channel Sub-Score Breakdown */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                            <div className="p-2.5 rounded-xl bg-white border border-[#dcefeb]">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#0f766e]">Pulse (AHA Ref)</span>
                                <span className="text-xs font-bold font-mono-num text-[#0f3d3e]">
                                  +{breakdown.pulseDeviationPts}/25
                                </span>
                              </div>
                              <p className="text-[11px] text-[#4b7476] mt-0.5 leading-snug">
                                {breakdown.pulseNote}
                              </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white border border-[#dcefeb]">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#0369a1]">Ocular (EAR/Blink)</span>
                                <span className="text-xs font-bold font-mono-num text-[#0f3d3e]">
                                  +{breakdown.ocularStrainPts}/20
                                </span>
                              </div>
                              <p className="text-[11px] text-[#4b7476] mt-0.5 leading-snug">
                                {breakdown.ocularNote}
                              </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white border border-[#dcefeb]">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#9a3412]">Brow (AU4)</span>
                                <span className="text-xs font-bold font-mono-num text-[#0f3d3e]">
                                  +{breakdown.browTensionPts}/20
                                </span>
                              </div>
                              <p className="text-[11px] text-[#4b7476] mt-0.5 leading-snug">
                                {breakdown.browNote}
                              </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white border border-[#dcefeb]">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#4f46e5]">Symptoms &amp; Load</span>
                                <span className="text-xs font-bold font-mono-num text-[#0f3d3e]">
                                  +{breakdown.symptomLoadPts}/35
                                </span>
                              </div>
                              <p className="text-[11px] text-[#4b7476] mt-0.5 leading-snug">
                                {breakdown.symptomNote}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Signal Correlation */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#eefaf7] to-[#eff8ff] border border-[#bde6de] space-y-1">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#0f766e]">
                            Signal Correlation
                          </p>
                          <p className="text-sm text-[#0f3d3e] leading-relaxed">
                            {assessmentResult.signalCorrelation}
                          </p>
                        </div>

                        {/* Seek Care Advisory if flagged */}
                        {assessmentResult.seekCareFlag && (
                          <div
                            role="alert"
                            className="p-4 rounded-2xl bg-rose-50 border border-rose-300 flex items-start space-x-3"
                          >
                            <InfoCircleIcon className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                                Consider Consulting a Healthcare Professional
                              </p>
                              <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
                                {assessmentResult.seekCareNote ||
                                  'The combination of physical symptoms and strain signals suggests checking in with a healthcare provider or campus clinic.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 3 Prioritized Actionable Steps */}
                        <div className="space-y-2.5">
                          <h4 className="text-sm font-bold text-[#0f3d3e] font-serif-elegant">
                            3 Prioritized Practical Steps
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {assessmentResult.actionableSteps.map((stepText, idx) => {
                              const stepAccents = [
                                'bg-[#e6faf6] border-[#99e2d8] text-[#0f766e]',
                                'bg-[#eff8ff] border-[#bae6fd] text-[#0369a1]',
                                'bg-[#fff7ed] border-[#fed7aa] text-[#9a3412]',
                              ];
                              return (
                                <div
                                  key={idx}
                                  className="p-4 rounded-2xl bg-white border border-[#cce7e3] space-y-2 flex flex-col justify-between"
                                >
                                  <div className="space-y-1.5">
                                    <span
                                      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg border text-xs font-bold font-mono-num ${
                                        stepAccents[idx % stepAccents.length]
                                      }`}
                                    >
                                      {idx + 1}
                                    </span>
                                    <p className="text-xs sm:text-sm text-[#0f3d3e] leading-relaxed font-medium">
                                      {stepText}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Youth Support & Quick Follow-Up Actions */}
                        {ageGroup === 'youth' && (
                          <div className="p-3.5 rounded-2xl bg-[#f4fbfa] border border-[#cce7e3] flex items-start space-x-2.5">
                            <span className="text-base shrink-0" aria-hidden="true">
                              🤝
                            </span>
                            <p className="text-xs text-[#335c5d] leading-relaxed">
                              <strong>For students &amp; younger users:</strong> If symptoms or stress feel heavy today,
                              checking in with a parent, teacher, or school nurse/counselor helps right away.
                            </p>
                          </div>
                        )}

                        {assessmentResult.overallStrainScore >= 75 && (
                          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
                            Feeling severely overwhelmed right now? Free confidential support is available anytime: US/Canada{' '}
                            <strong>988</strong> or{' '}
                            <a
                              href="https://findahelpline.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline font-bold"
                            >
                              findahelpline.com
                            </a>
                            .
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2.5 pt-1">
                          {onLaunchBreathing && (
                            <button
                              type="button"
                              onClick={onLaunchBreathing}
                              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#e6faf6] hover:bg-[#ccf7ef] border border-[#99e2d8] text-xs font-semibold text-[#0f766e] min-h-[44px]"
                            >
                              <HeartPulseIcon className="w-4 h-4 text-[#0d9488]" />
                              <span>Open Guided Breathing</span>
                            </button>
                          )}
                          {onOpenMentor && (
                            <button
                              type="button"
                              onClick={onOpenMentor}
                              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#eef2ff] hover:bg-[#e0e7ff] border border-[#c7d2fe] text-xs font-semibold text-[#3730a3] min-h-[44px]"
                            >
                              <SparklesIcon className="w-4 h-4 text-[#4f46e5]" />
                              <span>Talk with Mindy AI Mentor</span>
                            </button>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StressCheckIn;
