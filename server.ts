import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';
const FAST_CHAT_MODEL = 'gemini-3.1-flash-lite';
const TRIAGE_MODEL_NAME = 'gemini-2.5-flash';
const CHAT_MODEL_CANDIDATES = [FAST_CHAT_MODEL, MODEL_NAME, TRIAGE_MODEL_NAME] as const;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 20000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateWithFallback(
  ai: GoogleGenAI,
  contents: string,
  extraConfig: Record<string, unknown> = {},
  timeoutMs = 7000
) {
  let lastErr: unknown = null;
  for (const candidateModel of CHAT_MODEL_CANDIDATES) {
    try {
      const config: Record<string, unknown> = {
        ...extraConfig,
        abortSignal: AbortSignal.timeout(timeoutMs),
      };
      if (candidateModel === MODEL_NAME) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }
      const response = await ai.models.generateContent({
        model: candidateModel,
        contents,
        config,
      });
      if ((response.text ?? '').trim()) {
        return response;
      }
    } catch (err) {
      lastErr = err;
      console.error(`Gemini generateWithFallback (${candidateModel}) failed:`, err instanceof Error ? err.message : err);
    }
  }
  throw lastErr ?? new Error('All Gemini models returned empty responses.');
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '6mb' }));

  // Serve MediaPipe Tasks Vision WASM assets locally for reliable browser face framing
  const wasmDir = path.resolve(__dirname, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
  app.use('/mediapipe-wasm', express.static(wasmDir));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Literature Clock endpoint (minute-matched quotes from real literature with title & author)
  interface RawLitClockEntry {
    time?: string;
    quote_first?: string;
    quote_time_case?: string;
    quote_last?: string;
    title?: string;
    author?: string;
    sfw?: string;
  }

  interface FormattedLitClockQuote {
    time: string;
    quoteFirst: string;
    quoteTimeCase: string;
    quoteLast: string;
    title: string;
    author: string;
    isExactMinute: boolean;
  }

  const litClockCache = new Map<string, { quotes: FormattedLitClockQuote[]; cachedAt: number }>();
  const LIT_CLOCK_TTL_MS = 12 * 60 * 60 * 1000;
  const SENSITIVE_TEXT_REGEX = /\b(murder|corpse|dead body|suicide|kill|slaughter|execution|blood-soaked|hang himself)\b/i;

  const cleanQuoteFragment = (str: unknown): string => {
    if (typeof str !== 'string') return '';
    return str.replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ');
  };

  const fetchMinuteJson = async (
    targetMinuteOfDay: number,
    requestedMinuteOfDay: number
  ): Promise<FormattedLitClockQuote[]> => {
    const normalized = ((targetMinuteOfDay % 1440) + 1440) % 1440;
    const hh = String(Math.floor(normalized / 60)).padStart(2, '0');
    const mm = String(normalized % 60).padStart(2, '0');
    const url = `https://raw.githubusercontent.com/JohsEnevoldsen/literature-clock/master/docs/times/${hh}_${mm}.json`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    try {
      const resp = await fetch(url, { signal: controller.signal });
      if (!resp.ok) return [];
      const data = (await resp.json()) as RawLitClockEntry[];
      if (!Array.isArray(data)) return [];

      const sfwItems = data.filter(
        (item) =>
          item &&
          item.sfw !== 'no' &&
          typeof item.quote_time_case === 'string' &&
          item.quote_time_case.trim().length > 0 &&
          typeof item.title === 'string' &&
          item.title.trim().length > 0 &&
          typeof item.author === 'string' &&
          item.author.trim().length > 0
      );

      // Prefer student-friendly passages ahead of dark crime/thriller excerpts
      const cleanFirst = sfwItems.filter((item) => {
        const full = `${item.quote_first ?? ''} ${item.quote_time_case ?? ''} ${item.quote_last ?? ''} ${item.title ?? ''}`;
        return !SENSITIVE_TEXT_REGEX.test(full);
      });
      const prioritized = cleanFirst.length > 0 ? cleanFirst : sfwItems;

      const isExactMinute = normalized === requestedMinuteOfDay;
      return prioritized.slice(0, 10).map((item) => ({
        time: `${hh}:${mm}`,
        quoteFirst: cleanQuoteFragment(item.quote_first),
        quoteTimeCase: cleanQuoteFragment(item.quote_time_case).trim(),
        quoteLast: cleanQuoteFragment(item.quote_last),
        title: cleanQuoteFragment(item.title).trim(),
        author: cleanQuoteFragment(item.author).trim(),
        isExactMinute,
      }));
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  };

  app.get('/api/literature-clock', async (req, res) => {
    const rawHh = Number(req.query.hh);
    const rawMm = Number(req.query.mm);

    const now = new Date();
    const hhNum = Number.isInteger(rawHh) && rawHh >= 0 && rawHh <= 23 ? rawHh : now.getHours();
    const mmNum = Number.isInteger(rawMm) && rawMm >= 0 && rawMm <= 59 ? rawMm : now.getMinutes();

    const hhPad = String(hhNum).padStart(2, '0');
    const mmPad = String(mmNum).padStart(2, '0');
    const key = `${hhPad}:${mmPad}`;

    const cached = litClockCache.get(key);
    if (cached && Date.now() - cached.cachedAt < LIT_CLOCK_TTL_MS) {
      return res.json({
        time: key,
        quotes: cached.quotes,
        source: 'literature-clock',
      });
    }

    const baseMinute = hhNum * 60 + mmNum;
    const offsets = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5];

    let quotes: FormattedLitClockQuote[] = [];
    for (const offset of offsets) {
      quotes = await fetchMinuteJson(baseMinute + offset, baseMinute);
      if (quotes.length > 0) break;
    }

    if (quotes.length > 0) {
      litClockCache.set(key, { quotes, cachedAt: Date.now() });
      return res.json({
        time: key,
        quotes,
        source: 'literature-clock',
      });
    }

    return res.json({
      time: key,
      quotes: [],
      source: 'classic-fallback',
    });
  });

  // Multi-signal Wellness & Stress Triage Engine (ephemeral single JPEG + local telemetry + reported symptoms)
  app.post('/api/stress-checkin/triage', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'AI triage is currently unavailable because GEMINI_API_KEY is not configured.',
      });
    }

    const { imageBase64, mimeType, telemetry, symptoms, otherSymptoms, baseline, calibratedScale } = req.body ?? {};
    if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
      return res.status(400).json({ error: 'Missing image snapshot data.' });
    }

    const allowedMime = mimeType === 'image/png' || mimeType === 'image/webp' ? mimeType : 'image/jpeg';
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '').trim();

    if (!cleanBase64 || cleanBase64.length > 5_000_000) {
      return res.status(400).json({ error: 'Invalid or oversized image snapshot.' });
    }

    const safeSymptoms = Array.isArray(symptoms)
      ? symptoms.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).slice(0, 12)
      : [];
    const safeOther = typeof otherSymptoms === 'string' ? otherSymptoms.trim().slice(0, 300) : '';
    const safeBaseline = baseline === 'just_exercised' ? 'just_exercised' : 'at_rest';

    const t = telemetry && typeof telemetry === 'object' ? telemetry : {};
    const bpmText = typeof t.bpm === 'number' && Number.isFinite(t.bpm) ? `${Math.round(t.bpm)} BPM (confidence: ${t.bpmConfidence || 'medium'})` : 'Unavailable / still calibrating';
    const earText = typeof t.ear === 'number' && Number.isFinite(t.ear) ? `${t.ear.toFixed(2)}` : 'Unavailable';
    const blinkText = typeof t.blinkRate === 'number' && Number.isFinite(t.blinkRate) ? `${Math.round(t.blinkRate)} blinks/min` : 'Unavailable';
    const browText = typeof t.browTensionIndex === 'number' && Number.isFinite(t.browTensionIndex) ? `${Math.round(t.browTensionIndex)}/100` : 'Unavailable';
    const signalQualityText = typeof t.signalQuality === 'string' ? t.signalQuality : 'fair';

    const hasValidCalibrated =
      calibratedScale &&
      typeof calibratedScale === 'object' &&
      typeof calibratedScale.calibratedScore === 'number' &&
      Number.isFinite(calibratedScale.calibratedScore);

    const calibratedAnchorScore = hasValidCalibrated
      ? Math.max(0, Math.min(100, Math.round(calibratedScale.calibratedScore)))
      : null;

    const calibratedContextBlock = hasValidCalibrated
      ? `\nCALIBRATED MULTI-SIGNAL BASELINE (weighted 0-100 rubric):
- Weighted Baseline Score: ${calibratedAnchorScore}/100 (${calibratedScale.bandRange}: ${calibratedScale.bandLabel})
- Pulse vs. AHA 60-100 BPM Norm: +${calibratedScale.pulseDeviationPts}/25 (${calibratedScale.pulseNote})
- Ocular Strain (Soukupova & Cech EAR + Bentivoglio 12-20/min norm): +${calibratedScale.ocularStrainPts}/20 (${calibratedScale.ocularNote})
- Inner-Brow Tension (FACS AU4 ratio): +${calibratedScale.browTensionPts}/20 (${calibratedScale.browNote})
- Reported Symptom & Context Load: +${calibratedScale.symptomLoadPts}/35 (${calibratedScale.symptomNote})`
      : '';

    const imagePart = {
      inlineData: {
        mimeType: allowedMime,
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `Perform a non-diagnostic, multi-signal Wellness & Stress Triage synthesis by fusing the single webcam snapshot with the user's real-time client telemetry, calibrated physiological baseline, and self-reported context.

CLIENT BIOMETRIC TELEMETRY (computed locally):
- Estimated Pulse (rPPG forehead green channel): ${bpmText}
- Activity Baseline: ${safeBaseline === 'just_exercised' ? 'Just exercised (elevated pulse is expected from recent exertion — do NOT misclassify post-exercise BPM as acute stress)' : 'At rest (AHA normal resting norm: 60-100 BPM)'}
- Eye Aspect Ratio (EAR; alert >= 0.25, heavy eyelids < 0.24): ${earText}
- Blink Rate (spontaneous resting norm: 12-20 blinks/min): ${blinkText}
- Normalized Inner-Brow Tension Index (AU4 furrow, 0-100): ${browText}
- Local Signal Quality: ${signalQualityText}
${calibratedContextBlock}

SELF-REPORTED SYMPTOMS & CONTEXT:
- Selected Symptom Chips: ${safeSymptoms.length > 0 ? safeSymptoms.join(', ') : 'None selected'}
- User Notes ("Other symptoms or how you're feeling"): ${safeOther || 'None provided'}

CALIBRATED SCALE RUBRIC (strict 4-band stratification modeled on proportional PSS load bands):
- 0–25: Low Strain / Rested (signals within resting norms, low/no symptoms)
- 26–50: Mild Strain / Everyday Load (mild tension/fatigue or light workload/symptom cues)
- 51–75: Moderate-to-Elevated Strain (multiple converging biometric and symptom strain cues)
- 76–100: High Strain / Recovery Priority (strong multi-signal convergence needing rest or care check-in)

TRIAGE SYNTHESIS INSTRUCTIONS:
1. Evaluate how visual facial/posture cues in the snapshot align (or contrast) with the local telemetry (BPM vs AHA resting norm, EAR/blink norm, brow tension) and reported symptoms + activity baseline.
2. Assign overallStrainScore (integer 0 to 100) using the calibrated 4-band rubric above. Stay well-calibrated to the weighted baseline (${calibratedAnchorScore !== null ? `${calibratedAnchorScore}/100` : 'reported cues'}): only adjust up or down by at most ~15 points when clear visual posture/facial tension or reassuring relaxed appearance in the snapshot meaningfully shifts the picture.
3. Choose the single best-fitting primaryCategory from:
   - "Optimal / Rested"
   - "Acute Cognitive Stress"
   - "Physical Fatigue / Sleep Debt"
   - "Potential Illness / Recovery Needed"
4. Write signalCorrelation (1-3 clear, grounded sentences explaining specifically how visual cues, pulse/EAR/brow telemetry vs reference norms, and reported symptoms connect).
5. Provide actionableSteps: exactly 3 prioritized, practical, everyday wellness actions tailored to the category and context (e.g., hydration, screen pause, slow breathing, rest/sleep recovery, gentle stretch, or tracking temperature).
6. Set seekCareFlag (boolean) to true ONLY when reported symptoms or severe combinations (e.g., Feverish/Chills combined with Headache/Sore Throat, or user notes expressing severe persistent pain/distress) warrant checking in with a qualified healthcare professional or trusted adult, and provide a concise, calm seekCareNote. When seekCareFlag is false, set seekCareNote to an empty string or a brief reassuring note to continue normal self-care.

PRIVACY & SAFETY RULES:
- Never guess or mention age, gender, ethnicity, identity, or medical diagnoses.
- This is strictly a wellness & symptom-tracking summary, never a medical diagnosis.`,
    };

    const responseConfig = {
      systemInstruction:
        'You are a careful, non-diagnostic wellness & symptom triage engine. Synthesize visible facial/posture cues, local webcam biometric telemetry (BPM vs AHA 60-100 BPM resting zone, EAR & 12-20/min blink norm, AU4 brow tension), calibrated baseline rubric (0-25 Low, 26-50 Mild, 51-75 Elevated, 76-100 High), activity baseline, and reported symptoms into calm, practical structured JSON guidance. Respect privacy and never diagnose conditions or infer demographics.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallStrainScore: {
            type: Type.INTEGER,
            description: 'Calibrated strain score from 0 to 100 matching the 4-band rubric (0-25, 26-50, 51-75, 76-100).',
          },
          primaryCategory: {
            type: Type.STRING,
            enum: [
              'Optimal / Rested',
              'Acute Cognitive Stress',
              'Physical Fatigue / Sleep Debt',
              'Potential Illness / Recovery Needed',
            ],
          },
          signalCorrelation: {
            type: Type.STRING,
            description: 'Explanation of how visual cues, pulse/EAR/brow metrics vs norms, and symptoms align.',
          },
          actionableSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exactly 3 prioritized, practical wellness actions.',
          },
          seekCareFlag: {
            type: Type.BOOLEAN,
            description: 'True if symptom combination warrants consulting a healthcare professional.',
          },
          seekCareNote: {
            type: Type.STRING,
            description: 'Brief note when seekCareFlag is true (or empty string otherwise).',
          },
        },
        required: [
          'overallStrainScore',
          'primaryCategory',
          'signalCorrelation',
          'actionableSteps',
          'seekCareFlag',
          'seekCareNote',
        ],
      },
    };

    try {
      let response;
      try {
        response = await ai.models.generateContent({
          model: TRIAGE_MODEL_NAME,
          contents: { parts: [imagePart, textPart] },
          config: responseConfig,
        });
      } catch (primaryErr) {
        const msg = primaryErr instanceof Error ? primaryErr.message : '';
        if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
          response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: { parts: [imagePart, textPart] },
            config: responseConfig,
          });
        } else {
          throw primaryErr;
        }
      }

      const rawText = (response.text ?? '').trim();
      const parsed = JSON.parse(rawText);

      const allowedCategories = new Set([
        'Optimal / Rested',
        'Acute Cognitive Stress',
        'Physical Fatigue / Sleep Debt',
        'Potential Illness / Recovery Needed',
      ]);

      const rawScore = Number(parsed.overallStrainScore);
      let overallStrainScore = Number.isFinite(rawScore)
        ? Math.max(0, Math.min(100, Math.round(rawScore)))
        : calibratedAnchorScore ?? 32;

      // Soft guardrail: keep synthesized score within +/-18 pts of objective multi-signal calibrated anchor
      if (calibratedAnchorScore !== null) {
        const minBound = Math.max(0, calibratedAnchorScore - 18);
        const maxBound = Math.min(100, calibratedAnchorScore + 18);
        overallStrainScore = Math.max(minBound, Math.min(maxBound, overallStrainScore));
      }

      const primaryCategory = allowedCategories.has(parsed.primaryCategory)
        ? parsed.primaryCategory
        : 'Acute Cognitive Stress';

      const steps = Array.isArray(parsed.actionableSteps)
        ? parsed.actionableSteps
            .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
            .map((s: string) => s.trim())
            .slice(0, 3)
        : [];

      while (steps.length < 3) {
        const defaults = [
          'Take 3–5 slow, unhurried breaths and soften your shoulders.',
          'Drink a full glass of water and rest your eyes from screens for 5 minutes.',
          'Check in with how your energy feels later today and prioritize restful sleep.',
        ];
        steps.push(defaults[steps.length]);
      }

      return res.json({
        overallStrainScore,
        primaryCategory,
        signalCorrelation:
          typeof parsed.signalCorrelation === 'string' && parsed.signalCorrelation.trim()
            ? parsed.signalCorrelation.trim()
            : 'Combined snapshot cues, calibrated biometric norms, and your selected context were reviewed together.',
        actionableSteps: steps,
        seekCareFlag: Boolean(parsed.seekCareFlag),
        seekCareNote:
          typeof parsed.seekCareNote === 'string' ? parsed.seekCareNote.trim() : '',
        disclaimer:
          'Wellness & symptom-tracking tool only—not a medical diagnosis. Consult a doctor for medical advice.',
        ...(hasValidCalibrated ? { calibratedScale } : {}),
      });
    } catch (error) {
      console.error('Error running wellness triage:', error instanceof Error ? error.message : 'Unknown error');
      return res.status(502).json({
        error: 'Could not complete the triage assessment right now. Please try again in clear lighting.',
      });
    }
  });

  // Stress Check-In: Single-frame non-diagnostic visible cue analysis
  // Image data is processed in memory for this single request and immediately discarded.
  app.post('/api/stress-checkin/analyze-frame', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'AI analysis is currently unavailable because GEMINI_API_KEY is not configured.',
      });
    }

    const { imageBase64, mimeType } = req.body ?? {};
    if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
      return res.status(400).json({ error: 'Missing image frame data.' });
    }

    const allowedMime = mimeType === 'image/png' || mimeType === 'image/webp' ? mimeType : 'image/jpeg';
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '').trim();

    if (!cleanBase64 || cleanBase64.length > 5_000_000) {
      return res.status(400).json({ error: 'Invalid or oversized image frame.' });
    }

    try {
      const imagePart = {
        inlineData: {
          mimeType: allowedMime,
          data: cleanBase64,
        },
      };

      const textPart = {
        text: `Look at this single webcam snapshot for a gentle, non-diagnostic stress and wellness check-in.

Describe ONLY clearly visible surface cues across these three categories:
1. emotional_cues: visible facial expression cues (for example: calm/relaxed expression, strained or worried look, tired/low-energy expression, concentrated/furrowed look, forced/tense smile). Describe these strictly as observable surface expressions, never as clinical labels.
2. posture_cues: visible head, neck, and upper-shoulder alignment (for example: upright and relaxed shoulders, raised or hunched shoulders, head tilted forward or slumped, stiff neck alignment).
3. facial_factors: specific facial muscle factors (for example: brow tension or furrowing, jaw clenching or pressed lips, eye fatigue, squinting, heavy eyelids, forehead lines from tension).
4. visible_cues: 3-5 concise combined phrases summarizing the strongest cues across emotions, posture, and facial factors.

Synthesize these visible emotional, posture, and facial cues into estimated_tension_level ("low", "moderate", "high", or "unclear") and confidence ("low", "medium", or "high").

STRICT RULES:
1. Do NOT guess, state, or infer the person's age, gender, ethnicity, identity, or any medical/mental health condition.
2. Do NOT claim to diagnose stress, anxiety, depression, or any health disorder.
3. If the image is dark, blurry, obstructed, or has no clear face in frame, clearly report that in image_quality, set estimated_tension_level to "unclear", set confidence to "low", and write a gentle message_to_user explaining why (e.g., "The snapshot was a bit too dark or blurry to read cues clearly").
4. Keep message_to_user warm, brief, and supportive.
5. Provide 2-3 simple everyday wellness suggestions (e.g., slow breathing, rolling shoulders, drinking water, short walk).
6. Set disclaimer to: "This is a rough estimate, not a medical assessment."

Return JSON only matching the required schema.`,
      };

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction:
            'You are a careful, privacy-respecting wellness assistant. You only describe neutral, visible surface cues—emotional expression cues, head/shoulder posture cues, and facial muscle factors (brow, jaw/lips, eyes, forehead)—from a single photo without guessing personal demographics, identity, or diagnosing health conditions. Always output valid JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              image_quality: {
                type: Type.STRING,
                description: 'Brief assessment of photo clarity: "clear", "dark", "blurry", "no_face", or "obstructed".',
              },
              emotional_cues: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Visible surface emotional expression cues (e.g., calm, strained, fatigued, focused).',
              },
              posture_cues: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Visible head, neck, and upper-shoulder posture cues.',
              },
              facial_factors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Visible facial tension cues (brow, jaw/lips, eye fatigue, forehead).',
              },
              visible_cues: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Concise combined summary of key visible cues.',
              },
              estimated_tension_level: {
                type: Type.STRING,
                enum: ['low', 'moderate', 'high', 'unclear'],
              },
              confidence: {
                type: Type.STRING,
                enum: ['low', 'medium', 'high'],
              },
              message_to_user: {
                type: Type.STRING,
              },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              disclaimer: {
                type: Type.STRING,
              },
            },
            required: [
              'image_quality',
              'emotional_cues',
              'posture_cues',
              'facial_factors',
              'visible_cues',
              'estimated_tension_level',
              'confidence',
              'message_to_user',
              'suggestions',
              'disclaimer',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      const parsed = JSON.parse(rawText);

      // Normalize fields safely
      const allowedLevels = new Set(['low', 'moderate', 'high', 'unclear']);
      const allowedConfidence = new Set(['low', 'medium', 'high']);
      const level = allowedLevels.has(parsed.estimated_tension_level)
        ? parsed.estimated_tension_level
        : 'unclear';
      const confidence = allowedConfidence.has(parsed.confidence)
        ? parsed.confidence
        : 'low';

      const cleanList = (val: unknown, max = 4): string[] =>
        Array.isArray(val)
          ? val
              .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
              .map((item) => item.trim())
              .slice(0, max)
          : [];

      const emotionalCues = cleanList(parsed.emotional_cues);
      const postureCues = cleanList(parsed.posture_cues);
      const facialFactors = cleanList(parsed.facial_factors);
      const visibleCues = cleanList(parsed.visible_cues, 6);

      return res.json({
        image_quality: typeof parsed.image_quality === 'string' ? parsed.image_quality : 'unclear',
        emotional_cues: emotionalCues,
        posture_cues: postureCues,
        facial_factors: facialFactors,
        visible_cues:
          visibleCues.length > 0
            ? visibleCues
            : [...emotionalCues, ...postureCues, ...facialFactors].slice(0, 5),
        estimated_tension_level: level,
        confidence,
        message_to_user:
          typeof parsed.message_to_user === 'string'
            ? parsed.message_to_user
            : 'Thank you for taking a moment to check in with yourself today.',
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions.slice(0, 3)
          : [
              'Take three slow, deep breaths.',
              'Sip a glass of water and relax your shoulders.',
            ],
        disclaimer: 'This is a rough estimate, not a medical assessment.',
      });
    } catch (error) {
      console.error('Error analyzing check-in frame:', error instanceof Error ? error.message : 'Unknown error');
      return res.status(502).json({
        error: 'Could not analyze the camera snapshot right now. Please try again in clear lighting.',
      });
    }
  });

  // Wellness routine
  app.post('/api/gemini/wellness-routine', async (req, res) => {
    const ai = getGeminiClient();
    const { activityType } = req.body ?? {};
    let prompt = '';
    if (activityType === 'meditation') {
      prompt = 'Generate a short 5-step guided meditation script for academic anxiety.';
    } else if (activityType === 'affirmations') {
      prompt = 'Generate 5 short, powerful motivational affirmations for a student.';
    } else {
      return res.status(400).json({ error: 'Invalid activity type.' });
    }

    if (!ai) {
      return res.json({ text: "Sorry, I couldn't generate a routine right now. Take a deep breath!" });
    }
    try {
      const response = await generateWithFallback(ai, prompt);
      return res.json({ text: response.text ?? '' });
    } catch {
      return res.json({ text: "Sorry, I couldn't generate a routine right now. Take a deep breath!" });
    }
  });

  // Mentor greeting
  app.post('/api/gemini/mentor-greeting', async (req, res) => {
    const ai = getGeminiClient();
    const { role, context, userName } = req.body ?? {};
    const cleanName = typeof userName === 'string' && userName.trim() ? userName.trim() : '';
    const fallback =
      role === 'student'
        ? cleanName
          ? `Hi ${cleanName}! I'm Mindy. How are you feeling today?`
          : "Hi there! I'm Mindy. How can I help you feel your best today?"
        : "Hello, I'm Dr. Aris. How can I assist you with your child's wellness journey?";

    if (!ai) return res.json({ text: fallback });

    const nameInstruction = cleanName
      ? `Address the ${role} warmly by their name: ${cleanName}.`
      : 'Do NOT use any bracketed placeholders like [Student Name] or [Name].';
    const prompt = `Generate a warm, supportive, concise greeting for a ${role} from ${
      role === 'student' ? 'Mindy, an AI wellness mentor' : 'Dr. Aris, a family advisor'
    }. ${nameInstruction} Context: ${typeof context === 'string' ? context : 'Starting a check-in'}. Keep it under 2 sentences and end with a gentle question.`;

    try {
      const response = await generateWithFallback(ai, prompt, {}, 4500);
      const text = (response.text ?? '')
        .replace(/\[(?:Student|Parent|User)?\s*Name\]/gi, cleanName || 'friend')
        .trim();
      return res.json({ text: text || fallback });
    } catch {
      return res.json({ text: fallback });
    }
  });

  // Quick replies
  app.post('/api/gemini/quick-replies', async (req, res) => {
    const ai = getGeminiClient();
    const fallback = ['Tell me more', 'I need a break', 'Help me plan'];
    if (!ai) return res.json({ replies: fallback });

    try {
      const history = Array.isArray(req.body?.history) ? req.body.history : [];
      const lastMessages = history
        .filter((m: { text?: unknown }) => typeof m?.text === 'string' && m.text.trim().length > 0)
        .slice(-3)
        .map((m: { role: string; text: string }) => `${m.role}: ${m.text}`)
        .join('\n');
      const prompt = `Based on the conversation history below, generate exactly 3 short (max 5 words) follow-up suggestions for the user to tap.
Ensure variety:
- One for venting/emotion (e.g., "I'm still feeling low")
- One for action/tips (e.g., "Give me a study hack")
- One for reflection/explanation (e.g., "Why do I feel this way?")

Return as a JSON array of 3 strings.
History: ${lastMessages || 'Greeting only'}`;

      const response = await generateWithFallback(
        ai,
        prompt,
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        4500
      );
      const raw = (response.text ?? '[]')
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '');
      const parsed = JSON.parse(raw);
      const cleaned = Array.isArray(parsed)
        ? parsed
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .map((item) => item.trim())
            .slice(0, 3)
        : [];
      return res.json({ replies: cleaned.length > 0 ? cleaned : fallback });
    } catch {
      return res.json({ replies: fallback });
    }
  });

  // Daily motivation
  app.post('/api/gemini/daily-motivation', async (_req, res) => {
    const ai = getGeminiClient();
    const fallback = 'You are doing your best, and that is enough. ✨';
    if (!ai) return res.json({ text: fallback });
    try {
      const response = await generateWithFallback(
        ai,
        'Generate a single, unique, and deeply encouraging sentence to inspire a student.'
      );
      return res.json({ text: (response.text ?? fallback).trim() });
    } catch {
      return res.json({ text: fallback });
    }
  });

  // Personalized daily affirmation
  app.post('/api/gemini/personalized-affirmation', async (req, res) => {
    const ai = getGeminiClient();
    const { studentName, theme, recentMood } = req.body ?? {};
    const name = typeof studentName === 'string' && studentName.trim() ? studentName.trim() : 'Student';
    const fallback = {
      quote: `${name}, your mind is capable of incredible growth, one patient breath and one focused step at a time.`,
      author: 'Mindy & MindGuard',
      reflectionPrompt: 'What is one thing about yourself that you appreciate today?',
      themeLabel: 'Self-Belief',
    };
    if (!ai) return res.json(fallback);

    try {
      const themeContext = theme && theme !== 'all' ? `Focus theme: ${theme}.` : 'General student encouragement.';
      const moodContext = recentMood ? `Student's recent feeling or mood: ${recentMood}.` : '';
      const prompt = `You are a mindful, compassionate student mental wellness coach.
Generate a deeply inspiring, uplifting, personalized daily affirmation for a student named ${name}.
${themeContext}
${moodContext}

Requirements:
- Quote: 1 to 2 sentences max. Warm, empowering, addressing ${name} naturally or subtly, focusing on resilience, self-worth, calm, or academic balance without toxic positivity.
- Author: e.g. "Mindy & MindGuard" or an appropriate mindful persona.
- ReflectionPrompt: 1 reflective journal question for ${name} to ponder today.
- ThemeLabel: 1-2 words summarizing the core theme (e.g., "Inner Strength", "Study Flow", "Grace & Growth", "Deep Calm").

Return as valid JSON object matching the schema.`;

      const response = await generateWithFallback(ai, prompt, {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING },
            author: { type: Type.STRING },
            reflectionPrompt: { type: Type.STRING },
            themeLabel: { type: Type.STRING },
          },
          required: ['quote', 'author', 'reflectionPrompt', 'themeLabel'],
        },
      });
      return res.json(JSON.parse((response.text ?? '{}').trim()));
    } catch {
      return res.json(fallback);
    }
  });

  // Parental advice
  app.post('/api/gemini/parental-advice', async (req, res) => {
    const ai = getGeminiClient();
    const fallback = [{ title: 'Stay Close', content: 'Just being present helps more than you know.', icon: '💙' }];
    if (!ai) return res.json({ advice: fallback });

    try {
      const stressData = req.body?.stressData ?? [];
      const response = await generateWithFallback(
        ai,
        `Based on child stress data: ${JSON.stringify(stressData)}, provide 3 empathetic tips for a parent. Return JSON array with title, content, icon.`,
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                icon: { type: Type.STRING },
              },
              required: ['title', 'content', 'icon'],
            },
          },
        }
      );
      return res.json({ advice: JSON.parse((response.text ?? '[]').trim()) });
    } catch {
      return res.json({ advice: fallback });
    }
  });

  // Analyze journal entry
  app.post('/api/gemini/analyze-journal', async (req, res) => {
    const ai = getGeminiClient();
    const fallback = { sentiment: 'Neutral', themes: [] };
    if (!ai) return res.json(fallback);

    try {
      const text = typeof req.body?.text === 'string' ? req.body.text : '';
      const response = await generateWithFallback(
        ai,
        `Analyze sentiment and themes in JSON: "${text}"`,
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sentiment: { type: Type.STRING },
              themes: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['sentiment', 'themes'],
          },
        }
      );
      return res.json(JSON.parse((response.text ?? '{}').trim()));
    } catch {
      return res.json(fallback);
    }
  });

  // Parent summary
  app.post('/api/gemini/parent-summary', async (req, res) => {
    const ai = getGeminiClient();
    const fallback = 'Monitoring progress normally.';
    if (!ai) return res.json({ text: fallback });
    try {
      const data = req.body?.data ?? [];
      const response = await generateWithFallback(
        ai,
        `Analyze child stress data and give a 2-sentence summary for a parent: ${JSON.stringify(data)}`
      );
      return res.json({ text: response.text ?? fallback });
    } catch {
      return res.json({ text: fallback });
    }
  });

  // Parent action plan
  app.post('/api/gemini/parent-action-plan', async (req, res) => {
    const ai = getGeminiClient();
    const fallback = [
      'Encourage a 5-minute break.',
      'Listen without judgment today.',
      'Check on their sleep tonight.',
    ];
    if (!ai) return res.json({ steps: fallback });
    try {
      const { stressData = [], activities = [] } = req.body ?? {};
      const response = await generateWithFallback(
        ai,
        `Generate 3 practical action steps for a parent in JSON array format based on: Stress: ${JSON.stringify(stressData)}, Activities: ${Array.isArray(activities) ? activities.join(', ') : ''}`,
        {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        }
      );
      return res.json({ steps: JSON.parse((response.text ?? '[]').trim()) });
    } catch {
      return res.json({ steps: fallback });
    }
  });

  // Recommend music category
  app.post('/api/gemini/recommend-music', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) return res.json({ category: 'Relax' });
    try {
      const feeling = typeof req.body?.feeling === 'string' ? req.body.feeling : '';
      const response = await generateWithFallback(
        ai,
        `Based on: "${feeling}", recommend 'Relax', 'Focus', 'Sleep', or 'Happy'. One word only.`
      );
      return res.json({ category: (response.text ?? 'Relax').trim() });
    } catch {
      return res.json({ category: 'Relax' });
    }
  });

  // Mentor chat streaming endpoint (SSE)
  app.post('/api/gemini/mentor-chat', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Mindy is unavailable right now: Gemini API key is not configured in Settings > Secrets.',
      });
    }

    const { systemInstruction, history = [], message } = req.body ?? {};
    const trimmedMessage = typeof message === 'string' ? message.trim() : '';
    if (!trimmedMessage) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const safeSystemInstruction =
      typeof systemInstruction === 'string' && systemInstruction.trim().length > 0
        ? systemInstruction.trim()
        : undefined;

    // Normalize multi-turn history for Gemini:
    // 1. Keep only valid non-empty user/model entries.
    // 2. Drop leading 'model' messages (e.g., initial greeting) so contents always starts with 'user'.
    // 3. Merge consecutive same-role messages so roles strictly alternate user -> model -> user.
    const rawTurns = Array.isArray(history)
      ? history.filter(
          (m: { role?: unknown; text?: unknown; isError?: unknown }) =>
            !m?.isError &&
            typeof m?.text === 'string' &&
            m.text.trim().length > 0 &&
            (m.role === 'user' || m.role === 'model')
        )
      : [];

    const normalizedContents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const turn of rawTurns) {
      const role = turn.role as 'user' | 'model';
      const text = (turn.text as string).trim();
      if (normalizedContents.length === 0 && role !== 'user') {
        // Skip leading model greeting — Gemini requires first turn to be 'user'
        continue;
      }
      const prev = normalizedContents[normalizedContents.length - 1];
      if (prev && prev.role === role) {
        prev.parts[0].text += `\n\n${text}`;
      } else {
        normalizedContents.push({ role, parts: [{ text }] });
      }
    }

    const lastTurn = normalizedContents[normalizedContents.length - 1];
    if (lastTurn && lastTurn.role === 'user') {
      lastTurn.parts[0].text += `\n\n${trimmedMessage}`;
    } else {
      normalizedContents.push({ role: 'user', parts: [{ text: trimmedMessage }] });
    }

    const formatGeminiError = (err: unknown): string => {
      const raw = err instanceof Error ? err.message : String(err ?? '');
      const lower = raw.toLowerCase();
      if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')) {
        return 'Hit a Gemini API rate or quota limit (429). Please wait a moment and try again, or check billing in Settings > Secrets.';
      }
      if (
        lower.includes('403') ||
        lower.includes('permission_denied') ||
        lower.includes('api_key_invalid') ||
        lower.includes('api key not valid')
      ) {
        return 'Cannot connect right now because the Gemini API key is invalid or lacks permission. Please check Settings > Secrets.';
      }
      if (lower.includes('404') || lower.includes('not_found')) {
        return 'The selected AI model is currently unavailable. Please try again.';
      }
      if (lower.includes('abort') || lower.includes('timeout')) {
        return 'The response took longer than expected. Please tap Retry message to try again.';
      }
      return 'Connection flickered. Please try again.';
    };

    let clientClosed = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        clientClosed = true;
      }
    });

    try {
      let emittedChars = 0;
      let lastError: unknown = null;

      for (const candidateModel of CHAT_MODEL_CANDIDATES) {
        if (emittedChars > 0 || clientClosed) break;

        const attemptController = new AbortController();
        const firstChunkTimer = setTimeout(() => {
          attemptController.abort(new Error(`Timeout waiting for ${candidateModel} response`));
        }, 9000);

        const buildModelConfig = () => {
          const cfg: Record<string, unknown> = {
            abortSignal: attemptController.signal,
          };
          if (safeSystemInstruction) {
            cfg.systemInstruction = safeSystemInstruction;
          }
          if (candidateModel === MODEL_NAME) {
            cfg.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
          }
          return cfg;
        };

        try {
          const stream = await ai.models.generateContentStream({
            model: candidateModel,
            contents: normalizedContents,
            config: buildModelConfig(),
          });

          for await (const chunk of stream) {
            if (clientClosed) break;
            if (chunk.text) {
              if (emittedChars === 0) {
                clearTimeout(firstChunkTimer);
              }
              emittedChars += chunk.text.length;
              res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
            }
          }
          clearTimeout(firstChunkTimer);
          if (emittedChars > 0) break;
        } catch (streamErr) {
          clearTimeout(firstChunkTimer);
          lastError = streamErr;
          const errMsg = streamErr instanceof Error ? streamErr.message : String(streamErr);
          console.error(`Mentor chat stream attempt (${candidateModel}) failed:`, errMsg);

          const lower = errMsg.toLowerCase();
          const isAuthError =
            lower.includes('403') ||
            lower.includes('permission_denied') ||
            lower.includes('api_key_invalid') ||
            lower.includes('api key not valid');

          if (isAuthError) {
            throw streamErr;
          }

          // If streaming failed cleanly (not timeout/quota/missing) before emitting chunks, try non-streaming once on this model
          const isSkipFallback =
            lower.includes('429') ||
            lower.includes('resource_exhausted') ||
            lower.includes('quota') ||
            lower.includes('404') ||
            lower.includes('not_found') ||
            lower.includes('timeout') ||
            lower.includes('abort');

          if (emittedChars === 0 && !isSkipFallback && !clientClosed) {
            try {
              const fallbackConfig: Record<string, unknown> = {
                abortSignal: AbortSignal.timeout(8000),
              };
              if (safeSystemInstruction) fallbackConfig.systemInstruction = safeSystemInstruction;
              if (candidateModel === MODEL_NAME) {
                fallbackConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
              }
              const singleResp = await ai.models.generateContent({
                model: candidateModel,
                contents: normalizedContents,
                config: fallbackConfig,
              });
              const fullText = (singleResp.text ?? '').trim();
              if (fullText) {
                emittedChars += fullText.length;
                res.write(`data: ${JSON.stringify({ text: fullText })}\n\n`);
                break;
              }
            } catch (singleErr) {
              lastError = singleErr;
            }
          }
        }
      }

      if (clientClosed) {
        if (!res.writableEnded) res.end();
        return;
      }

      if (emittedChars === 0) {
        if (lastError) {
          throw lastError;
        }
        res.write(
          `data: ${JSON.stringify({ error: 'Returned an empty response. Please try again.' })}\n\n`
        );
      } else {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      }
      res.end();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Mentor chat final error:', msg);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: formatGeminiError(error) })}\n\n`);
        res.end();
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(distDir, 'index.html'));
      } else {
        next();
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MindGuard server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
