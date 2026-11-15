import {
  StressReportData,
  StressCheckInCameraAnalysis,
  TriageAssessmentPayload,
  TriageAssessmentResult,
} from "../types";

export const runWellnessTriageAssessment = async (
  payload: TriageAssessmentPayload
): Promise<TriageAssessmentResult> => {
  const response = await fetch('/api/stress-checkin/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = 'Unable to complete wellness triage right now.';
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
};

export const analyzeStressCheckInFrame = async (
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<StressCheckInCameraAnalysis> => {
  const response = await fetch('/api/stress-checkin/analyze-frame', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  if (!response.ok) {
    let errorMsg = 'Unable to analyze camera frame right now.';
    try {
      const errData = await response.json();
      if (errData?.error) errorMsg = errData.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
};

export const streamMentorChat = async (
  systemInstruction: string,
  history: { role: 'user' | 'model'; text: string }[],
  message: string,
  onChunk: (partialText: string) => void
): Promise<string> => {
  const response = await fetch('/api/gemini/mentor-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemInstruction, history, message }),
  });

  if (!response.ok || !response.body) {
    throw new Error('Failed to reach mentor chat service.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const evt of events) {
      const line = evt.trim();
      if (!line.startsWith('data:')) continue;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr) continue;
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        if (parsed.text) {
          accumulated += parsed.text;
          onChunk(accumulated);
        }
      } catch (e) {
        if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
          throw e;
        }
      }
    }
  }

  return accumulated;
};

export const generateWellnessRoutine = async (activityType: 'breathing' | 'yoga' | 'meditation' | 'affirmations'): Promise<string> => {
  if (activityType === 'breathing') {
    return `**Pursed Lip Breathing**
Relax your neck and shoulders. Inhale slowly through your nose for 2 counts. Exhale slowly through pursed lips for a count of 4.

**Diaphragmatic Breathing**
Lie on your back. Place one hand on your belly. Inhale slowly, feeling your stomach move against your hand. Exhale through pursed lips.

**Breath Focus**
Combine deep breathing with a focus word like "Peace" or "Calm".`;
  }

  if (activityType === 'yoga') {
    return `**1. Tadasana (Mountain Pose)**
**How to do it:** Stand straight with feet together. Keep your arms by your sides. Stretch your body upward. Take deep breaths.
**Benefits:** Improves posture, builds balance and confidence.

---

**2. Vrikshasana (Tree Pose)**
**How to do it:** Stand on one leg. Place the other foot on your thigh. Join your hands above your head. Balance and breathe.
**Benefits:** Improves concentration, strengthens legs, improves balance.

---

**3. Bhujangasana (Cobra Pose)**
**How to do it:** Lie on your stomach. Place your hands near your shoulders. Slowly lift your chest. Keep your elbows slightly bent.
**Benefits:** Strengthens the spine, reduces back pain, improves breathing.

---

**4. Sukhasana (Easy Pose)**
**How to do it:** Sit cross-legged. Keep your back straight. Place hands on knees. Close your eyes and breathe.
**Benefits:** Calms the mind, reduces stress, improves focus.`;
  }

  try {
    const response = await fetch('/api/gemini/wellness-routine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityType }),
    });
    const data = await response.json();
    return data.text || "Sorry, I couldn't generate a routine right now. Take a deep breath!";
  } catch {
    return "Sorry, I couldn't generate a routine right now. Take a deep breath!";
  }
};

export const getMentorGreeting = async (role: 'student' | 'parent', context: string): Promise<string> => {
  const fallback =
    role === 'student'
      ? "Hi there! I'm Mindy. How can I help you feel your best today?"
      : "Hello, I'm Dr. Aris. How can I assist you with your child's wellness journey?";
  try {
    const response = await fetch('/api/gemini/mentor-greeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, context }),
    });
    const data = await response.json();
    return data.text || fallback;
  } catch {
    return fallback;
  }
};

export const generateQuickReplies = async (history: { role: string; text: string }[]): Promise<string[]> => {
  try {
    const response = await fetch('/api/gemini/quick-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history }),
    });
    const data = await response.json();
    return Array.isArray(data.replies) ? data.replies : ["Tell me more", "I need a break", "Help me plan"];
  } catch {
    return ["Tell me more", "I need a break", "Help me plan"];
  }
};

export const getDailyMotivation = async (): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/daily-motivation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return data.text || "You are doing your best, and that is enough. ✨";
  } catch {
    return "You are doing your best, and that is enough. ✨";
  }
};

export interface PersonalizedAffirmationResponse {
  quote: string;
  author: string;
  reflectionPrompt: string;
  themeLabel: string;
}

export const generatePersonalizedDailyAffirmation = async (
  studentName?: string,
  theme?: string,
  recentMood?: string
): Promise<PersonalizedAffirmationResponse> => {
  const name = studentName?.trim() || "Student";
  const fallback: PersonalizedAffirmationResponse = {
    quote: `${name}, your mind is capable of incredible growth, one patient breath and one focused step at a time.`,
    author: "Mindy & MindGuard",
    reflectionPrompt: "What is one thing about yourself that you appreciate today?",
    themeLabel: "Self-Belief",
  };
  try {
    const response = await fetch('/api/gemini/personalized-affirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName, theme, recentMood }),
    });
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
};

export const generateParentalAdvice = async (stressData: StressReportData[]): Promise<{ title: string; content: string; icon: string }[]> => {
  try {
    const response = await fetch('/api/gemini/parental-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stressData }),
    });
    const data = await response.json();
    return Array.isArray(data.advice)
      ? data.advice
      : [{ title: "Stay Close", content: "Just being present helps more than you know.", icon: "💙" }];
  } catch {
    return [{ title: "Stay Close", content: "Just being present helps more than you know.", icon: "💙" }];
  }
};

export const analyzeJournalEntry = async (text: string): Promise<{ sentiment: string; themes: string[] }> => {
  try {
    const response = await fetch('/api/gemini/analyze-journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return await response.json();
  } catch {
    return { sentiment: 'Neutral', themes: [] };
  }
};

export const generateParentSummary = async (data: StressReportData[]): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/parent-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    const json = await response.json();
    return json.text || "Monitoring progress normally.";
  } catch {
    return "Monitoring progress normally.";
  }
};

export const generateParentActionPlan = async (stressData: StressReportData[], activities: string[]): Promise<string[]> => {
  try {
    const response = await fetch('/api/gemini/parent-action-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stressData, activities }),
    });
    const data = await response.json();
    return Array.isArray(data.steps)
      ? data.steps
      : ["Encourage a 5-minute break.", "Listen without judgment today.", "Check on their sleep tonight."];
  } catch {
    return ["Encourage a 5-minute break.", "Listen without judgment today.", "Check on their sleep tonight."];
  }
};

export const recommendMusicCategory = async (feeling: string): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/recommend-music', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feeling }),
    });
    const data = await response.json();
    return data.category || 'Relax';
  } catch {
    return 'Relax';
  }
};