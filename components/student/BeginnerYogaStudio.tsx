import React, { useState, useEffect, useCallback, useMemo } from 'react';
import yogaHeroImg from '../../src/assets/images/yoga_beginners_hero_1794918208586.jpg';
import yogaStandingImg from '../../src/assets/images/yoga_standing_flow_1794918208685.jpg';
import yogaSeatedImg from '../../src/assets/images/yoga_restorative_calm_1794918208731.jpg';
import {
  ChevronLeftIcon,
  PlayIcon,
  RefreshIcon,
  CheckIcon,
  ClockIcon,
} from '../icons';

type PoseId =
  | 'tadasana'
  | 'vrikshasana'
  | 'trikonasana'
  | 'uttanasana'
  | 'bhujangasana'
  | 'balasana'
  | 'cat-cow'
  | 'vajrasana'
  | 'sukhasana'
  | 'shavasana';

interface YogaPose {
  id: PoseId;
  guideIndex: number;
  sanskrit: string;
  english: string;
  category: 'Standing' | 'Floor & Spine' | 'Seated & Rest';
  durationLabel: string;
  timerSeconds: number;
  steps: string[];
  nameOrigin: string;
  benefit: string;
  tintClass: string;
  borderClass: string;
  accentClass: string;
  strokeColor: string;
}

const YOGA_POSES: YogaPose[] = [
  {
    id: 'tadasana',
    guideIndex: 1,
    sanskrit: 'Tadasana',
    english: 'Mountain Pose',
    category: 'Standing',
    durationLabel: '5 to 8 breaths',
    timerSeconds: 45,
    steps: [
      'Stand with feet together or hip-width apart, weight even on both feet.',
      'Let your arms hang by your sides, palms facing forward.',
      'Lift your chest, relax your shoulders, and keep your chin level.',
      'Breathe slowly for 5 to 8 breaths.',
    ],
    nameOrigin:
      '"Tada" is commonly translated as "mountain" (it also means palm tree). The pose is meant to be steady and tall like a mountain.',
    benefit:
      'Improves posture and body awareness, and strengthens the legs and core. In Vedic tradition it is the base from which all standing poses begin.',
    tintClass: 'from-[#eefbf8] via-[#ffffff] to-[#e2f5f2]',
    borderClass: 'border-[#b7e4dc]',
    accentClass: 'text-[#0f766e]',
    strokeColor: '#0d9488',
  },
  {
    id: 'vrikshasana',
    guideIndex: 2,
    sanskrit: 'Vrikshasana',
    english: 'Tree Pose',
    category: 'Standing',
    durationLabel: '5 to 8 breaths each side',
    timerSeconds: 45,
    steps: [
      'Start in Tadasana and shift your weight onto your left foot.',
      'Place the sole of your right foot on your left calf or inner thigh (never on the knee).',
      'Bring your palms together at your chest, then slowly raise them overhead.',
      'Fix your eyes on one point, hold 5 to 8 breaths, and repeat on the other side.',
    ],
    nameOrigin: '"Vriksha" means tree. You stand rooted in one leg, like a tree.',
    benefit:
      'Balance poses train concentration and improve balance and leg strength. Traditionally it is said to calm the mind.',
    tintClass: 'from-[#f0fdf4] via-[#ffffff] to-[#dcfce7]',
    borderClass: 'border-[#b8ebc8]',
    accentClass: 'text-[#15803d]',
    strokeColor: '#16a34a',
  },
  {
    id: 'trikonasana',
    guideIndex: 3,
    sanskrit: 'Trikonasana',
    english: 'Triangle Pose',
    category: 'Standing',
    durationLabel: '5 breaths each side',
    timerSeconds: 40,
    steps: [
      'Stand with feet about 3 feet apart, right foot turned out 90°.',
      'Raise both arms to shoulder height.',
      'Reach to the right, then lower your right hand to your shin or a block, and extend your left arm upward.',
      'Look up if comfortable, hold 5 breaths, and switch sides.',
    ],
    nameOrigin: '"Trikona" means triangle, which is the shape your legs and torso form.',
    benefit:
      'Stretches the hamstrings, hips, and spine, and strengthens the legs. Traditionally used to improve flexibility and digestion.',
    tintClass: 'from-[#f0f9ff] via-[#ffffff] to-[#e0f2fe]',
    borderClass: 'border-[#bae6fd]',
    accentClass: 'text-[#0369a1]',
    strokeColor: '#0284c7',
  },
  {
    id: 'uttanasana',
    guideIndex: 4,
    sanskrit: 'Uttanasana',
    english: 'Standing Forward Fold',
    category: 'Standing',
    durationLabel: '5 breaths',
    timerSeconds: 35,
    steps: [
      'Stand in Tadasana with feet hip-width apart.',
      'Inhale and lift your arms up, then exhale and fold forward from the hips.',
      'Bend your knees as much as needed, and let your head and neck hang heavy.',
      'Hold for 5 breaths, then rise slowly.',
    ],
    nameOrigin:
      '"Ut" means intense and "tan" means stretch, so it is an intense stretch of the back of the body.',
    benefit:
      'Stretches the hamstrings and lower back, and the head-down position is relaxing and may reduce stress. Avoid it if you have a serious back problem or very low blood pressure.',
    tintClass: 'from-[#eef2ff] via-[#ffffff] to-[#e0e7ff]',
    borderClass: 'border-[#c7d2fe]',
    accentClass: 'text-[#4338ca]',
    strokeColor: '#4f46e5',
  },
  {
    id: 'bhujangasana',
    guideIndex: 5,
    sanskrit: 'Bhujangasana',
    english: 'Cobra Pose',
    category: 'Floor & Spine',
    durationLabel: '3 to 5 breaths',
    timerSeconds: 30,
    steps: [
      'Lie on your stomach with legs together and palms beside your chest.',
      'Press the tops of your feet and pelvis into the floor.',
      'Inhale and lift your chest using your back muscles, keeping elbows slightly bent.',
      'Hold for 3 to 5 breaths, then lower slowly.',
    ],
    nameOrigin: '"Bhujanga" means serpent. The raised chest resembles a cobra with its hood up.',
    benefit:
      'Strengthens the back muscles and opens the chest, which helps counter the slouching from long desk hours.',
    tintClass: 'from-[#fff8f1] via-[#ffffff] to-[#ffedd5]',
    borderClass: 'border-[#fed7aa]',
    accentClass: 'text-[#c2410c]',
    strokeColor: '#ea580c',
  },
  {
    id: 'balasana',
    guideIndex: 6,
    sanskrit: 'Balasana',
    english: "Child's Pose",
    category: 'Floor & Spine',
    durationLabel: '1 minute or more',
    timerSeconds: 60,
    steps: [
      'Kneel and sit back on your heels, knees apart.',
      'Fold forward and rest your forehead on the mat.',
      'Stretch your arms forward or keep them alongside your body.',
      'Breathe slowly for 1 minute or more.',
    ],
    nameOrigin: '"Bala" means child. The folded position resembles a resting child.',
    benefit:
      'A gentle stretch for the back and hips that encourages slow breathing and relaxation. It is a common rest pose between harder poses.',
    tintClass: 'from-[#fff1f2] via-[#ffffff] to-[#ffe4e6]',
    borderClass: 'border-[#fecdd3]',
    accentClass: 'text-[#be123c]',
    strokeColor: '#e11d48',
  },
  {
    id: 'cat-cow',
    guideIndex: 7,
    sanskrit: 'Marjaryasana-Bitilasana',
    english: 'Cat-Cow Pose',
    category: 'Floor & Spine',
    durationLabel: '8 to 10 rounds',
    timerSeconds: 60,
    steps: [
      'Come onto hands and knees, wrists under shoulders and knees under hips.',
      'Inhale, drop your belly, and lift your chest and tailbone (Cow).',
      'Exhale, round your spine, and tuck your chin (Cat).',
      'Flow between the two for 8 to 10 rounds.',
    ],
    nameOrigin:
      '"Marjari" means cat and "Bitila" means cow. The spine shapes resemble a stretching cat and a cow with a dipped back.',
    benefit:
      'Increases spinal mobility and links movement with breath, which warms up the back and relieves stiffness.',
    tintClass: 'from-[#ecfeff] via-[#ffffff] to-[#cffafe]',
    borderClass: 'border-[#a5f3fc]',
    accentClass: 'text-[#0e7490]',
    strokeColor: '#0891b2',
  },
  {
    id: 'vajrasana',
    guideIndex: 8,
    sanskrit: 'Vajrasana',
    english: 'Thunderbolt/Diamond Pose',
    category: 'Seated & Rest',
    durationLabel: '2 to 5 minutes',
    timerSeconds: 120,
    steps: [
      'Kneel down with knees together and big toes touching.',
      'Sit back on your heels.',
      'Place your hands on your thighs, keep your spine straight, and close your eyes.',
      'Breathe calmly for 2 to 5 minutes.',
    ],
    nameOrigin: '"Vajra" means thunderbolt or diamond, symbolising strength and firmness.',
    benefit:
      'It is the one pose traditionally recommended after meals, and it is said to aid digestion. It is also a stable seat for breathing practice. Skip it if you have knee pain.',
    tintClass: 'from-[#fefce8] via-[#ffffff] to-[#fef3c7]',
    borderClass: 'border-[#fde68a]',
    accentClass: 'text-[#a16207]',
    strokeColor: '#d97706',
  },
  {
    id: 'sukhasana',
    guideIndex: 9,
    sanskrit: 'Sukhasana',
    english: 'Easy Pose',
    category: 'Seated & Rest',
    durationLabel: 'A few minutes',
    timerSeconds: 120,
    steps: [
      'Sit on the floor and cross your legs comfortably.',
      'Rest your hands on your knees.',
      'Lengthen your spine, relax your shoulders, and sit on a folded blanket if your hips are tight.',
      'Close your eyes and breathe naturally for a few minutes.',
    ],
    nameOrigin: '"Sukha" means ease or comfort.',
    benefit:
      'Supports good sitting posture and is the usual seat for meditation and breathing exercises, such as the one from your last question.',
    tintClass: 'from-[#f0fdfa] via-[#ffffff] to-[#e6faf6]',
    borderClass: 'border-[#99e2d8]',
    accentClass: 'text-[#0f766e]',
    strokeColor: '#0d9488',
  },
  {
    id: 'shavasana',
    guideIndex: 10,
    sanskrit: 'Shavasana',
    english: 'Corpse Pose',
    category: 'Seated & Rest',
    durationLabel: '3 to 5 minutes',
    timerSeconds: 180,
    steps: [
      'Lie flat on your back with feet slightly apart and arms a little away from your body, palms up.',
      'Close your eyes and let your whole body go heavy.',
      'Relax each body part in turn, from toes to head.',
      'Stay for 3 to 5 minutes, then roll to one side before sitting up.',
    ],
    nameOrigin: '"Shava" means corpse. The body lies completely still and relaxed.',
    benefit:
      'Lowers physical tension and helps the body settle after exercise. Traditionally it is the final pose of every session.',
    tintClass: 'from-[#f5f3ff] via-[#ffffff] to-[#ede9fe]',
    borderClass: 'border-[#ddd6fe]',
    accentClass: 'text-[#6d28d9]',
    strokeColor: '#7c3aed',
  },
];

const SUGGESTED_ORDER_IDS: PoseId[] = [
  'sukhasana',
  'cat-cow',
  'tadasana',
  'vrikshasana',
  'trikonasana',
  'uttanasana',
  'bhujangasana',
  'balasana',
  'vajrasana',
  'shavasana',
];

const getTodayYogaKey = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `mindguard_yoga_poses_${y}-${m}-${d}`;
};

const PoseIllustrationSVG: React.FC<{
  poseId: PoseId;
  color: string;
  catCowVariant?: 'cow' | 'cat';
  className?: string;
}> = ({ poseId, color, catCowVariant = 'cow', className = 'w-24 h-24' }) => {
  const stroke = {
    stroke: color,
    strokeWidth: '2.4',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className}>
      {/* Ground mat line */}
      <line x1="14" y1="104" x2="106" y2="104" stroke="#bfe5de" strokeWidth="2.5" strokeLinecap="round" />

      {poseId === 'tadasana' && (
        <g {...stroke}>
          <circle cx="60" cy="24" r="7" />
          <path d="M60 31V64" />
          <path d="M48 39L44 63M72 39L76 63" />
          <path d="M48 39H72" />
          <path d="M55 64L53 102M65 64L67 102" />
        </g>
      )}

      {poseId === 'vrikshasana' && (
        <g {...stroke}>
          <circle cx="60" cy="24" r="6.5" />
          <path d="M60 31V64" />
          <path d="M50 40L60 29L70 40" />
          <path d="M60 64V102" />
          <path d="M60 66L77 77L61 84" />
        </g>
      )}

      {poseId === 'trikonasana' && (
        <g {...stroke}>
          <circle cx="77" cy="48" r="6" />
          <path d="M53 68L72 52" />
          <path d="M53 68L36 102M53 68L79 102" />
          <path d="M72 52L76 82M72 52L69 24" />
        </g>
      )}

      {poseId === 'uttanasana' && (
        <g {...stroke}>
          <path d="M56 102L52 60C52 46 69 44 74 58L77 82" />
          <circle cx="77" cy="90" r="5.5" />
          <path d="M69 57L65 95" />
        </g>
      )}

      {poseId === 'bhujangasana' && (
        <g {...stroke}>
          <circle cx="84" cy="54" r="6" />
          <path d="M22 100H62C71 100 77 78 81 61" />
          <path d="M75 74L71 100" />
        </g>
      )}

      {poseId === 'balasana' && (
        <g {...stroke}>
          <path d="M44 101C36 101 34 86 43 81C54 75 70 79 81 91" />
          <circle cx="87" cy="95" r="5.5" />
          <path d="M72 86L99 101" />
          <path d="M42 101H56" />
        </g>
      )}

      {poseId === 'cat-cow' &&
        (catCowVariant === 'cat' ? (
          <g {...stroke}>
            <circle cx="84" cy="70" r="5.5" />
            <path d="M38 102V74C47 54 67 54 78 69" />
            <path d="M79 73V102" />
          </g>
        ) : (
          <g {...stroke}>
            <circle cx="86" cy="57" r="5.5" />
            <path d="M38 102V72C50 84 68 84 79 65" />
            <path d="M79 70V102" />
          </g>
        ))}

      {poseId === 'vajrasana' && (
        <g {...stroke}>
          <circle cx="62" cy="34" r="6.5" />
          <path d="M62 41V78" />
          <path d="M62 78H43L40 100H66" />
          <path d="M62 49L72 72L56 76" />
        </g>
      )}

      {poseId === 'sukhasana' && (
        <g {...stroke}>
          <circle cx="60" cy="36" r="6.5" />
          <path d="M60 43V79" />
          <path d="M60 51L44 74L51 86M60 51L76 74L69 86" />
          <path d="M37 97C46 88 74 88 83 97" />
          <path d="M39 97H81" />
        </g>
      )}

      {poseId === 'shavasana' && (
        <g {...stroke}>
          <circle cx="25" cy="94" r="5.5" />
          <path d="M32 96H96" />
          <path d="M46 96L57 88M88 96L99 91" />
        </g>
      )}
    </svg>
  );
};

interface ResilientArtworkProps {
  src: string;
  alt: string;
  fallbackTitle: string;
  aspectClass?: string;
}

const ResilientArtwork: React.FC<ResilientArtworkProps> = ({
  src,
  alt,
  fallbackTitle,
  aspectClass = 'aspect-[4/3]',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`${aspectClass} w-full rounded-2xl bg-gradient-to-br from-[#dff6f0] via-[#eef8ff] to-[#f4efe6] border border-[#bfe5de] flex flex-col items-center justify-center p-6 text-center`}
      >
        <PoseIllustrationSVG poseId="sukhasana" color="#0d9488" className="w-20 h-20 mb-2" />
        <p className="font-serif-elegant text-base font-semibold text-[#0f3d3e]">{fallbackTitle}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${aspectClass} w-full object-cover rounded-2xl border border-[#cde8e3]`}
    />
  );
};

const BeginnerYogaStudio: React.FC = () => {
  const [orderMode, setOrderMode] = useState<'guide' | 'suggested'>('guide');
  const [activePoseId, setActivePoseId] = useState<PoseId>('tadasana');
  const [practicedIds, setPracticedIds] = useState<PoseId[]>(() => {
    try {
      const raw = localStorage.getItem(getTodayYogaKey());
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [catCowPreview, setCatCowPreview] = useState<'cow' | 'cat'>('cow');
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(45);

  const orderedPoses = useMemo(() => {
    if (orderMode === 'guide') return YOGA_POSES;
    return SUGGESTED_ORDER_IDS.map((id) => YOGA_POSES.find((p) => p.id === id)!);
  }, [orderMode]);

  const activeIndex = orderedPoses.findIndex((p) => p.id === activePoseId);
  const activePose = activeIndex >= 0 ? orderedPoses[activeIndex] : orderedPoses[0];

  useEffect(() => {
    setTimerRunning(false);
    setSecondsLeft(activePose.timerSeconds);
  }, [activePose.id, activePose.timerSeconds]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const togglePracticed = useCallback((id: PoseId) => {
    setPracticedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(getTodayYogaKey(), JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }, []);

  const handleOrderSwitch = (mode: 'guide' | 'suggested') => {
    setOrderMode(mode);
    if (mode === 'suggested') {
      setActivePoseId('sukhasana');
    } else {
      setActivePoseId('tadasana');
    }
  };

  const handlePrevPose = () => {
    const idx = activeIndex >= 0 ? activeIndex : 0;
    const prevIdx = (idx - 1 + orderedPoses.length) % orderedPoses.length;
    setActivePoseId(orderedPoses[prevIdx].id);
  };

  const handleNextPose = () => {
    const idx = activeIndex >= 0 ? activeIndex : 0;
    const nextIdx = (idx + 1) % orderedPoses.length;
    setActivePoseId(orderedPoses[nextIdx].id);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const isPracticed = practicedIds.includes(activePose.id);
  const progressPercent = Math.round((practicedIds.length / YOGA_POSES.length) * 100);

  return (
    <div className="space-y-8">
      {/* Hero Banner with Generated Sanctuary Artwork */}
      <section className="rounded-3xl border border-[#bfe5de] bg-gradient-to-br from-[#eefbf8] via-[#ffffff] to-[#f7f4ec] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#0f766e] mb-2">
              <span>Beginner Yoga Sequence</span>
              <span aria-hidden="true" className="text-[#9cc7c1]">
                ·
              </span>
              <span className="font-mono-num">10 Poses</span>
            </div>

            <h2 className="font-serif-elegant text-2xl sm:text-4xl font-bold text-[#0f3d3e] leading-tight text-balance">
              10 Easy Yoga Poses for Beginners
            </h2>

            <p className="mt-3 text-sm sm:text-base text-[#2c5253] leading-relaxed">
              Practise on a mat, on an empty or light stomach, and breathe slowly through the nose. Stop if you feel pain (mild stretching is fine, sharp pain is not).
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex p-1 rounded-xl bg-[#eaf6f4] border border-[#cde8e3]">
                <button
                  type="button"
                  onClick={() => handleOrderSwitch('guide')}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                    orderMode === 'guide'
                      ? 'bg-white text-[#0f3d3e] shadow-xs'
                      : 'text-[#4b7476] hover:text-[#0f3d3e]'
                  }`}
                >
                  Poses 1–10
                </button>
                <button
                  type="button"
                  onClick={() => handleOrderSwitch('suggested')}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                    orderMode === 'suggested'
                      ? 'bg-white text-[#0f3d3e] shadow-xs'
                      : 'text-[#4b7476] hover:text-[#0f3d3e]'
                  }`}
                >
                  Suggested Session Order
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-4 sm:p-5 lg:p-6 flex items-center">
            <ResilientArtwork
              src={yogaHeroImg}
              alt="Peaceful yoga studio mat, warm tea, folded blanket, and eucalyptus beside a sunlit window"
              fallbackTitle="Your Calm Practice Space"
              aspectClass="aspect-[16/10] lg:h-full"
            />
          </div>
        </div>
      </section>

      {/* Interactive Spotlight Pose Stage */}
      <section aria-label="Interactive pose practice deck">
        <div
          className={`rounded-3xl p-2 border bg-gradient-to-br transition-colors duration-300 ${activePose.tintClass} ${activePose.borderClass}`}
        >
          <div className="rounded-2xl bg-white/85 backdrop-blur-xs border border-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className={`font-mono-num ${activePose.accentClass}`}>
                  {orderMode === 'suggested'
                    ? `Step ${String(activeIndex + 1).padStart(2, '0')} of 10`
                    : `Pose ${String(activePose.guideIndex).padStart(2, '0')} of 10`}
                </span>
                <span aria-hidden="true" className="text-[#9cc7c1]">
                  ·
                </span>
                <span className={activePose.accentClass}>{activePose.category}</span>
                <span aria-hidden="true" className="text-[#9cc7c1]">
                  ·
                </span>
                <span className="text-[#4b7476]">{activePose.durationLabel}</span>
              </div>

              <span className="text-xs font-mono-num font-semibold text-[#0f766e]">
                {practicedIds.length} / 10 practiced today
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Visual Pose Diagram & Hold Timer */}
              <div className="md:col-span-4 rounded-2xl border border-[#dcefed] bg-[#f8fcfb] p-5 flex flex-col items-center text-center">
                <PoseIllustrationSVG
                  poseId={activePose.id}
                  color={activePose.strokeColor}
                  catCowVariant={catCowPreview}
                  className="w-32 h-32"
                />

                {activePose.id === 'cat-cow' && (
                  <div className="mt-2 inline-flex p-1 rounded-lg bg-[#e6f5f3] border border-[#cde8e3]">
                    <button
                      type="button"
                      onClick={() => setCatCowPreview('cow')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                        catCowPreview === 'cow' ? 'bg-white text-[#0e7490]' : 'text-[#4b7476]'
                      }`}
                    >
                      Cow (Inhale)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatCowPreview('cat')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                        catCowPreview === 'cat' ? 'bg-white text-[#0e7490]' : 'text-[#4b7476]'
                      }`}
                    >
                      Cat (Exhale)
                    </button>
                  </div>
                )}

                {/* Hold / Breath Countdown Helper */}
                <div className="mt-4 w-full pt-4 border-t border-[#e1f1ee]">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#4b7476] mb-1">
                    <ClockIcon className="w-3.5 h-3.5 text-[#0d9488]" />
                    <span>Pose Timer</span>
                  </div>
                  <div className="font-mono-num text-2xl font-bold text-[#0f3d3e]">
                    {secondsLeft === 0 ? 'Complete' : formatDuration(secondsLeft)}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (secondsLeft === 0) setSecondsLeft(activePose.timerSeconds);
                        setTimerRunning((r) => !r);
                      }}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
                    >
                      <PlayIcon className="w-3.5 h-3.5" />
                      <span>{timerRunning ? 'Pause' : secondsLeft === 0 ? 'Restart' : 'Start Hold'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTimerRunning(false);
                        setSecondsLeft(activePose.timerSeconds);
                      }}
                      aria-label="Reset pose timer"
                      className="min-w-[40px] min-h-[40px] px-2.5 rounded-xl bg-white border border-[#cce7e3] hover:bg-[#eaf6f4] text-[#0f3d3e] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
                    >
                      <RefreshIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Detailed Steps, Etymology & Benefit */}
              <div className="md:col-span-8 space-y-5">
                <div>
                  <h3 className="font-serif-elegant text-2xl sm:text-3xl font-bold text-[#0f3d3e]">
                    {activePose.guideIndex}. {activePose.sanskrit}{' '}
                    <span className="font-normal text-[#335c5d]">({activePose.english})</span>
                  </h3>
                </div>

                <ol className="space-y-2.5">
                  {activePose.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 w-6 h-6 rounded-lg text-xs font-mono-num font-bold text-white flex items-center justify-center shrink-0"
                        style={{ backgroundColor: activePose.strokeColor }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm sm:text-base text-[#234849] leading-relaxed">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl bg-[#f7fcfb] border border-[#dcefed] p-4">
                    <p className="text-xs font-bold text-[#0f766e] mb-1">Name</p>
                    <p className="text-xs sm:text-sm text-[#2c5253] leading-relaxed">
                      {activePose.nameOrigin}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#f7fcfb] border border-[#dcefed] p-4">
                    <p className="text-xs font-bold text-[#0f766e] mb-1">Benefit</p>
                    <p className="text-xs sm:text-sm text-[#2c5253] leading-relaxed">
                      {activePose.benefit}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage Navigation & Checkoff */}
            <div className="mt-6 pt-5 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevPose}
                  aria-label="Previous pose"
                  className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-white border border-[#cce7e3] hover:bg-[#eaf6f4] text-[#0f3d3e] flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPose}
                  aria-label="Next pose"
                  className="min-w-[44px] min-h-[44px] px-4 rounded-xl bg-white border border-[#cce7e3] hover:bg-[#eaf6f4] text-[#0f3d3e] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
                >
                  <span>Next Pose</span>
                  <ChevronLeftIcon className="w-4 h-4 rotate-180" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => togglePracticed(activePose.id)}
                className={`min-h-[44px] px-5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                  isPracticed
                    ? 'bg-[#0d9488] text-white'
                    : 'bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white hover:brightness-105'
                }`}
              >
                <CheckIcon className="w-4 h-4" />
                <span>{isPracticed ? 'Practiced Today' : 'Mark Pose Complete'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Bar */}
      <div className="px-1">
        <div className="flex items-center justify-between text-xs text-[#4b7476] mb-2">
          <span className="font-semibold text-[#0f3d3e]">
            {orderMode === 'suggested'
              ? 'Suggested Practice Flow (Sukhasana → Shavasana)'
              : 'All 10 Beginner Poses'}
          </span>
          <span className="font-mono-num">{progressPercent}% completed today</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#e6f4f1] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0d9488] to-[#0891b2] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* All 10 Illustrated Pose Cards */}
      <section aria-label="Complete beginner yoga pose guide" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orderedPoses.map((pose, idx) => {
          const isSelected = pose.id === activePose.id;
          const poseDone = practicedIds.includes(pose.id);

          return (
            <article
              key={pose.id}
              onClick={() => setActivePoseId(pose.id)}
              className={`rounded-2xl border p-5 sm:p-6 bg-gradient-to-br transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                pose.tintClass
              } ${pose.borderClass} ${
                isSelected ? 'ring-2 ring-[#0d9488]/65 shadow-sm' : 'hover:shadow-sm hover:-translate-y-0.5'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className={`font-mono-num ${pose.accentClass}`}>
                        {orderMode === 'suggested'
                          ? `Flow ${String(idx + 1).padStart(2, '0')}`
                          : `${String(pose.guideIndex).padStart(2, '0')}`}
                      </span>
                      <span aria-hidden="true" className="text-[#9cc7c1]">
                        ·
                      </span>
                      <span className="text-[#4b7476]">{pose.durationLabel}</span>
                    </div>
                    <h4 className="font-serif-elegant text-xl font-bold text-[#0f3d3e] mt-1">
                      {pose.guideIndex}. {pose.sanskrit}
                    </h4>
                    <p className="text-xs font-semibold text-[#4b7476]">{pose.english}</p>
                  </div>

                  <div className="shrink-0 rounded-xl bg-white/80 border border-black/[0.06] p-1.5">
                    <PoseIllustrationSVG
                      poseId={pose.id}
                      color={pose.strokeColor}
                      className="w-16 h-16"
                    />
                  </div>
                </div>

                <ol className="space-y-1.5 text-xs sm:text-sm text-[#2c5253] leading-relaxed mt-3">
                  {pose.steps.map((s, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2">
                      <span className="font-mono-num font-bold text-[#4b7476] shrink-0">
                        {sIdx + 1}.
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-4 pt-3 border-t border-black/[0.06] space-y-1.5 text-xs text-[#335c5d] leading-relaxed">
                  <p>
                    <strong className="text-[#0f3d3e]">Name:</strong> {pose.nameOrigin}
                  </p>
                  <p>
                    <strong className="text-[#0f3d3e]">Benefit:</strong> {pose.benefit}
                  </p>
                </div>
              </div>

              <div
                className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => togglePracticed(pose.id)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488] ${
                    poseDone
                      ? 'bg-[#0d9488] text-white'
                      : 'bg-white/90 text-[#0f3d3e] border border-[#cce7e3] hover:bg-white'
                  }`}
                >
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>{poseDone ? 'Practiced' : 'Mark Done'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePoseId(pose.id)}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0f766e] hover:bg-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
                >
                  {isSelected ? 'Active in Stage' : 'Focus in Stage'}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {/* Two Illustrated Reference Plates */}
      <section aria-label="Visual yoga posture plates" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#cce7e3] bg-[#f8fdfc] p-4 space-y-3">
          <ResilientArtwork
            src={yogaStandingImg}
            alt="Minimalist watercolor illustration of Tree Pose balance posture on a sage green yoga mat"
            fallbackTitle="Standing Balance · Vrikshasana"
          />
          <div>
            <p className="text-xs font-semibold text-[#0f766e]">Standing &amp; Balance Focus</p>
            <p className="text-sm text-[#2c5253] mt-0.5">
              Fix your gaze on a steady point during Tadasana, Vrikshasana, Trikonasana, and Uttanasana.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#cce7e3] bg-[#f8fdfc] p-4 space-y-3">
          <ResilientArtwork
            src={yogaSeatedImg}
            alt="Minimalist watercolor illustration of Sukhasana seated cross-legged pose on a folded blanket"
            fallbackTitle="Seated Ease · Sukhasana"
          />
          <div>
            <p className="text-xs font-semibold text-[#0f766e]">Seated Breath &amp; Rest</p>
            <p className="text-sm text-[#2c5253] mt-0.5">
              Use a folded blanket under your hips in Sukhasana to keep the spine tall and comfortable.
            </p>
          </div>
        </div>
      </section>

      {/* Suggested Order & Safety Note */}
      <section className="space-y-4">
        <div className="rounded-2xl border border-[#bfe5de] bg-gradient-to-r from-[#eefbf8] to-[#eef2ff] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#0f766e]">Complete Session Flow</p>
            <p className="text-sm sm:text-base text-[#0f3d3e] font-medium leading-relaxed">
              <strong className="font-semibold">Suggested order:</strong> Sukhasana, Cat-Cow, Tadasana, Vrikshasana, Trikonasana, Uttanasana, Bhujangasana, Balasana, Vajrasana, then Shavasana to finish.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOrderSwitch(orderMode === 'suggested' ? 'guide' : 'suggested')}
            className="shrink-0 min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#99e2d8] hover:bg-[#e6faf6] text-xs font-semibold text-[#0f3d3e] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]"
          >
            {orderMode === 'suggested' ? 'Show Poses 1–10' : 'Follow Suggested Flow'}
          </button>
        </div>

        <div className="rounded-2xl border border-[#fde68a] bg-gradient-to-br from-[#fefce8] via-[#ffffff] to-[#fff7ed] p-6">
          <p className="text-xs font-semibold text-[#a16207] mb-1">Safety &amp; Evidence Note</p>
          <p className="text-sm sm:text-base text-[#2c5253] leading-relaxed">
            <strong className="text-[#0f3d3e]">Note:</strong> Research shows regular yoga can modestly improve flexibility, balance, stress, and mood, but it is not a cure for any condition. If a student has an injury, back or knee problems, or a health condition, check with a doctor or trained instructor first.
          </p>
        </div>
      </section>
    </div>
  );
};

export default BeginnerYogaStudio;
