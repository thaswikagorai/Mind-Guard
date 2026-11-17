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
  history: { role: 'user' | 'model'; text: string; isError?: boolean }[],
  message: string,
  onChunk: (partialText: string) => void
): Promise<string> => {
  const controller = new AbortController();
  let timeoutId: number | undefined;
  const resetWatchdog = (ms: number) => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      controller.abort();
    }, ms);
  };

  resetWatchdog(22000);

  let response: Response;
  try {
    response = await fetch('/api/gemini/mentor-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction,
        history: history.filter((m) => !m.isError && m.text.trim().length > 0),
        message,
      }),
    });
  } catch (fetchErr) {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    if (controller.signal.aborted) {
      throw new Error('The mentor response timed out. Please tap Retry message.');
    }
    throw fetchErr;
  }

  if (!response.ok || !response.body) {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    let errMsg = 'Failed to reach mentor chat service.';
    try {
      const errData = await response.json();
      if (typeof errData?.error === 'string' && errData.error.trim()) {
        errMsg = errData.error;
      }
    } catch {
      // ignore non-JSON error body
    }
    throw new Error(errMsg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  const processEventBlock = (block: string) => {
    const lines = block.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;
      let parsed: { error?: string; text?: string; done?: boolean } | null = null;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        continue;
      }
      if (parsed?.error) {
        throw new Error(parsed.error);
      }
      if (parsed?.text) {
        accumulated += parsed.text;
        onChunk(accumulated);
      }
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      resetWatchdog(15000);
      if (value) {
        buffer += decoder.decode(value, { stream: !done });
      } else if (done) {
        buffer += decoder.decode();
      }

      const events = buffer.split(/\r?\n\r?\n/);
      buffer = done ? '' : (events.pop() || '');

      for (const evt of events) {
        if (evt.trim()) {
          processEventBlock(evt);
        }
      }

      if (done) break;
    }

    if (buffer.trim()) {
      processEventBlock(buffer);
    }
  } catch (streamErr) {
    if (controller.signal.aborted) {
      throw new Error('The mentor response timed out. Please tap Retry message.');
    }
    throw streamErr;
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }

  if (!accumulated.trim()) {
    throw new Error('Did not receive a reply. Please try again.');
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
    return `**10 Easy Yoga Poses for Beginners**
Practise on a mat, on an empty or light stomach, and breathe slowly through the nose. Stop if you feel pain (mild stretching is fine, sharp pain is not).

---

**1. Tadasana (Mountain Pose)**
1. Stand with feet together or hip-width apart, weight even on both feet.
2. Let your arms hang by your sides, palms facing forward.
3. Lift your chest, relax your shoulders, and keep your chin level.
4. Breathe slowly for 5 to 8 breaths.
Name: "Tada" is commonly translated as "mountain" (it also means palm tree). The pose is meant to be steady and tall like a mountain.
Benefit: Improves posture and body awareness, and strengthens the legs and core. In Vedic tradition it is the base from which all standing poses begin.

**2. Vrikshasana (Tree Pose)**
1. Start in Tadasana and shift your weight onto your left foot.
2. Place the sole of your right foot on your left calf or inner thigh (never on the knee).
3. Bring your palms together at your chest, then slowly raise them overhead.
4. Fix your eyes on one point, hold 5 to 8 breaths, and repeat on the other side.
Name: "Vriksha" means tree. You stand rooted in one leg, like a tree.
Benefit: Balance poses train concentration and improve balance and leg strength. Traditionally it is said to calm the mind.

**3. Trikonasana (Triangle Pose)**
1. Stand with feet about 3 feet apart, right foot turned out 90°.
2. Raise both arms to shoulder height.
3. Reach to the right, then lower your right hand to your shin or a block, and extend your left arm upward.
4. Look up if comfortable, hold 5 breaths, and switch sides.
Name: "Trikona" means triangle, which is the shape your legs and torso form.
Benefit: Stretches the hamstrings, hips, and spine, and strengthens the legs. Traditionally used to improve flexibility and digestion.

**4. Uttanasana (Standing Forward Fold)**
1. Stand in Tadasana with feet hip-width apart.
2. Inhale and lift your arms up, then exhale and fold forward from the hips.
3. Bend your knees as much as needed, and let your head and neck hang heavy.
4. Hold for 5 breaths, then rise slowly.
Name: "Ut" means intense and "tan" means stretch, so it is an intense stretch of the back of the body.
Benefit: Stretches the hamstrings and lower back, and the head-down position is relaxing and may reduce stress. Avoid it if you have a serious back problem or very low blood pressure.

**5. Bhujangasana (Cobra Pose)**
1. Lie on your stomach with legs together and palms beside your chest.
2. Press the tops of your feet and pelvis into the floor.
3. Inhale and lift your chest using your back muscles, keeping elbows slightly bent.
4. Hold for 3 to 5 breaths, then lower slowly.
Name: "Bhujanga" means serpent. The raised chest resembles a cobra with its hood up.
Benefit: Strengthens the back muscles and opens the chest, which helps counter the slouching from long desk hours.

**6. Balasana (Child's Pose)**
1. Kneel and sit back on your heels, knees apart.
2. Fold forward and rest your forehead on the mat.
3. Stretch your arms forward or keep them alongside your body.
4. Breathe slowly for 1 minute or more.
Name: "Bala" means child. The folded position resembles a resting child.
Benefit: A gentle stretch for the back and hips that encourages slow breathing and relaxation. It is a common rest pose between harder poses.

**7. Marjaryasana-Bitilasana (Cat-Cow Pose)**
1. Come onto hands and knees, wrists under shoulders and knees under hips.
2. Inhale, drop your belly, and lift your chest and tailbone (Cow).
3. Exhale, round your spine, and tuck your chin (Cat).
4. Flow between the two for 8 to 10 rounds.
Name: "Marjari" means cat and "Bitila" means cow. The spine shapes resemble a stretching cat and a cow with a dipped back.
Benefit: Increases spinal mobility and links movement with breath, which warms up the back and relieves stiffness.

**8. Vajrasana (Thunderbolt/Diamond Pose)**
1. Kneel down with knees together and big toes touching.
2. Sit back on your heels.
3. Place your hands on your thighs, keep your spine straight, and close your eyes.
4. Breathe calmly for 2 to 5 minutes.
Name: "Vajra" means thunderbolt or diamond, symbolising strength and firmness.
Benefit: It is the one pose traditionally recommended after meals, and it is said to aid digestion. It is also a stable seat for breathing practice. Skip it if you have knee pain.

**9. Sukhasana (Easy Pose)**
1. Sit on the floor and cross your legs comfortably.
2. Rest your hands on your knees.
3. Lengthen your spine, relax your shoulders, and sit on a folded blanket if your hips are tight.
4. Close your eyes and breathe naturally for a few minutes.
Name: "Sukha" means ease or comfort.
Benefit: Supports good sitting posture and is the usual seat for meditation and breathing exercises, such as the one from your last question.

**10. Shavasana (Corpse Pose)**
1. Lie flat on your back with feet slightly apart and arms a little away from your body, palms up.
2. Close your eyes and let your whole body go heavy.
3. Relax each body part in turn, from toes to head.
4. Stay for 3 to 5 minutes, then roll to one side before sitting up.
Name: "Shava" means corpse. The body lies completely still and relaxed.
Benefit: Lowers physical tension and helps the body settle after exercise. Traditionally it is the final pose of every session.

---

Suggested order: Sukhasana, Cat-Cow, Tadasana, Vrikshasana, Trikonasana, Uttanasana, Bhujangasana, Balasana, Vajrasana, then Shavasana to finish.

Note: Research shows regular yoga can modestly improve flexibility, balance, stress, and mood, but it is not a cure for any condition. If a student has an injury, back or knee problems, or a health condition, check with a doctor or trained instructor first.`;
  }

  if (activityType === 'meditation') {
    return `**A 6-minute breathing meditation for students**
This is mindfulness of breathing, the core technique used in most school-based mindfulness programs.

**Before you start**
1. Sit upright on a chair or the floor, with your back fairly straight but not stiff.
2. Rest your hands on your lap and close your eyes, or look softly at the floor.
3. Silence your phone and set a timer for 6 minutes.

**Minute 0-1: Settle**
Take three slow breaths. Breathe in through your nose and out through your mouth. Notice your feet on the floor and your body's weight on the seat.

**Minute 1-5: Follow your breath**
1. Breathe normally through your nose.
2. Pick one spot to focus on: the air at your nostrils, or your belly rising and falling.
3. Silently count each out-breath from 1 to 10, then start over. If you lose count, just begin again at 1.
4. Your mind will wander. That is normal and part of the practice. When you notice, gently bring your attention back to the breath without scolding yourself. Each time you notice and return, you are strengthening your attention.

**Minute 5-6: Widen and close**
Let go of the counting. Notice the sounds in the room and how your body feels. Then open your eyes slowly.

**Optional slow-breathing variation**
If you feel anxious, such as before an exam, breathe in for about 4 seconds and out for about 6. A slow rate of roughly 6 breaths per minute is linked to calmer heart-rate patterns and reduced stress.

**What the research says**
1. Reviews and meta-analyses of school-based mindfulness programs generally find small to moderate benefits for stress, anxiety, attention, and emotional regulation.
2. Slow, controlled breathing is associated with increased heart rate variability and a calmer physiological state.
3. Results are modest and vary between people. Regular short practice, such as 5 to 10 minutes most days, works better than occasional long sessions. Meditation is a helpful habit, not a cure-all.

**Tips for beginners**
Practice at the same time daily, such as before study or before bed. Don't aim for a "blank mind," because the goal is simply noticing where your attention is. If you feel persistently overwhelmed or very anxious, talk to a school counselor or a trusted adult as well.`;
  }

  if (activityType === 'affirmations') {
    return [
      'I am capable of learning anything I put my mind to.',
      'Mistakes are part of learning, and every one helps me grow.',
      'I do not need to be perfect. I only need to keep trying.',
      'My effort matters more than my marks.',
      'I can handle challenges one step at a time.',
      'I am proud of how far I have come.',
      'It is okay to ask for help. Asking questions makes me stronger.',
      'I believe in my ideas, and my voice deserves to be heard.',
      'I am more than a grade or a test result.',
      'Today I will do my best, and that is enough.',
    ].join('\n');
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

export const getMentorGreeting = async (
  role: 'student' | 'parent',
  context: string,
  userName?: string
): Promise<string> => {
  const cleanName = userName?.trim() || '';
  const fallback =
    role === 'student'
      ? cleanName
        ? `Hi ${cleanName}! I'm Mindy. How can I help you feel your best today?`
        : "Hi there! I'm Mindy. How can I help you feel your best today?"
      : "Hello, I'm Dr. Aris. How can I assist you with your child's wellness journey?";
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch('/api/gemini/mentor-greeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ role, context, userName: cleanName }),
    });
    const data = await response.json();
    return data.text || fallback;
  } catch {
    return fallback;
  } finally {
    window.clearTimeout(timer);
  }
};

export const generateQuickReplies = async (history: { role: string; text: string }[]): Promise<string[]> => {
  const fallback = ["Tell me more", "I need a break", "Help me plan"];
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch('/api/gemini/quick-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ history }),
    });
    const data = await response.json();
    return Array.isArray(data.replies) ? data.replies : fallback;
  } catch {
    return fallback;
  } finally {
    window.clearTimeout(timer);
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