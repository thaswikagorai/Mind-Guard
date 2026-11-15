import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { STUDENT_DATA } from '../../constants';
import { generateParentSummary, generateParentActionPlan } from '../../services/geminiService';
import Card from '../common/Card';
import LiteratureClockCard from '../common/LiteratureClockCard';
import { BellIcon, CheckCircleIcon, LightbulbIcon, SparklesIcon } from '../icons';

interface WellnessReportProps {
  childsEmail: string;
}

const WellnessReport: React.FC<WellnessReportProps> = ({ childsEmail }) => {
  const [summary, setSummary] = useState<string>('');
  const [actionPlan, setActionPlan] = useState<string[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [dailyStressScore, setDailyStressScore] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('mindguard_latest_stress_score');
    if (raw !== null) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        setDailyStressScore(Math.max(0, Math.min(100, Math.round(parsed))));
      }
    }
  }, []);

  const studentData = STUDENT_DATA[childsEmail] || STUDENT_DATA['default'];
  const { stressReport: reportData, alerts, activityLog } = studentData;

  const stressDelta = useMemo(() => {
    const validScores = reportData.filter((d) => d.stressLevel !== null);
    if (validScores.length < 2) return null;
    const current = validScores[validScores.length - 1].stressLevel!;
    const previous = validScores[validScores.length - 2].stressLevel!;
    return {
      value: current - previous,
      percentage: Math.abs(Math.round(((current - previous) / (previous || 1)) * 100)),
    };
  }, [reportData]);

  const milestones = useMemo(() => {
    const counts = activityLog.length;
    return [
      { id: 1, name: 'Consistency Pro', unlocked: counts >= 5, emoji: '🔥', desc: '5+ activities logged' },
      {
        id: 2,
        name: 'Zen Master',
        unlocked: activityLog.some((l) => l.activity.includes('Meditation')),
        emoji: '🧘',
        desc: 'First meditation',
      },
      {
        id: 3,
        name: 'Stress Fighter',
        unlocked: stressDelta && stressDelta.value < 0,
        emoji: '🛡️',
        desc: 'Lowered stress levels',
      },
      { id: 4, name: 'Morning Spark', unlocked: true, emoji: '✨', desc: 'Consistent check-ins' },
    ];
  }, [activityLog, stressDelta]);

  useEffect(() => {
    if (studentData) {
      const fetchData = async () => {
        setIsLoadingSummary(true);
        setIsLoadingPlan(true);

        const [genSummary, genPlan] = await Promise.all([
          generateParentSummary(studentData.stressReport),
          generateParentActionPlan(
            studentData.stressReport,
            studentData.activityLog.map((l) => l.activity)
          ),
        ]);

        setSummary(genSummary);
        setActionPlan(genPlan);
        setIsLoadingSummary(false);
        setIsLoadingPlan(false);
      };
      fetchData();
    }
  }, [studentData, childsEmail]);

  const alertSeverityClasses = {
    high: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-900',
      label: 'Attention',
      icon: <BellIcon className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    },
    medium: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      label: 'Note',
      icon: <BellIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    },
    low: {
      bg: 'bg-[#eaf6f4]',
      border: 'border-[#bfe3dd]',
      text: 'text-[#0f3d3e]',
      label: 'Positive',
      icon: <CheckCircleIcon className="w-5 h-5 text-[#0d9488] flex-shrink-0" />,
    },
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-16">
      {/* Daily Stress Notification Banner when student has checked in */}
      {dailyStressScore !== null && (
        <Card
          className={`p-4 border flex flex-wrap items-center justify-between gap-3 ${
            dailyStressScore >= 65
              ? 'bg-rose-50 border-rose-200'
              : dailyStressScore >= 40
              ? 'bg-amber-50 border-amber-200'
              : 'bg-[#e6faf6] border-[#99e2d8]'
          }`}
        >
          <div className="flex items-center space-x-3">
            <BellIcon
              className={`w-5 h-5 shrink-0 ${
                dailyStressScore >= 65
                  ? 'text-rose-600'
                  : dailyStressScore >= 40
                  ? 'text-amber-600'
                  : 'text-[#0d9488]'
              }`}
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#0f3d3e]">
                Latest Daily Stress Notification
              </p>
              <p className="text-xs sm:text-sm text-[#335c5d]">
                Most recent student check-in level:{' '}
                <strong className="font-mono-num text-[#0f3d3e]">{dailyStressScore}/100</strong>{' '}
                ({dailyStressScore >= 65 ? 'High — consider a gentle check-in' : dailyStressScore >= 40 ? 'Moderate load' : 'Low / Calm'}).
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold font-mono-num text-[#4b7476]">
            Updated Early Nov
          </span>
        </Card>
      )}

      {/* Top Grid: AI Insight + Monthly Delta */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <h2 className="text-lg font-bold text-[#0f3d3e] mb-3 font-serif-elegant flex items-center">
            <SparklesIcon className="w-5 h-5 text-[#0d9488] mr-2" />
            AI Wellness Insight
          </h2>
          <Card className="bg-gradient-to-br from-[#0d9488] via-[#0284c7] to-[#4f46e5] text-white border-none p-6 flex-grow flex items-center shadow-sm">
            {isLoadingSummary ? (
              <div className="space-y-3 animate-pulse w-full">
                <div className="h-4 bg-white/25 rounded w-full" />
                <div className="h-4 bg-white/25 rounded w-3/4" />
              </div>
            ) : (
              <p className="text-base sm:text-lg font-medium leading-relaxed">"{summary}"</p>
            )}
          </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col">
          <h2 className="text-lg font-bold text-[#0f3d3e] mb-3 font-serif-elegant">
            Monthly Stress Change
          </h2>
          <Card className="flex flex-col items-center justify-center py-6 border border-[#cce7e3] bg-white flex-grow">
            <span className="text-3xl mb-1.5">
              {stressDelta && stressDelta.value < 0 ? '📉' : '📈'}
            </span>
            <span
              className={`text-3xl font-bold font-mono-num ${
                stressDelta && stressDelta.value < 0 ? 'text-[#047857]' : 'text-rose-600'
              }`}
            >
              {stressDelta ? `${stressDelta.value < 0 ? '-' : '+'}${stressDelta.percentage}%` : '--'}
            </span>
            <span className="text-xs text-[#4b7476] font-medium mt-1">Compared to prior month</span>
          </Card>
        </div>
      </div>

      {/* Middle Grid: Trend Chart + Action Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <section className="lg:col-span-7 flex flex-col">
          <div className="flex items-baseline justify-between mb-3 gap-2">
            <h2 className="text-lg font-bold text-[#0f3d3e] font-serif-elegant">
              Stress Analytics Trend
            </h2>
            <span className="text-xs font-medium text-[#4b7476]">January – Early November</span>
          </div>
          <Card className="h-72 w-full p-4 bg-white border border-[#cce7e3] flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dff1ee" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10.5, fill: '#4b7476' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#4b7476' }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #cce7e3',
                    boxShadow: '0 8px 20px -6px rgba(15, 61, 62, 0.12)',
                    fontSize: '12px',
                    color: '#0f3d3e',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="stressLevel"
                  connectNulls
                  stroke="#0d9488"
                  strokeWidth={3.5}
                  dot={{ r: 4.5, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 0, fill: '#0f3d3e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </section>

        <section className="lg:col-span-5 flex flex-col">
          <h2 className="text-lg font-bold text-[#0f3d3e] mb-3 font-serif-elegant flex items-center">
            <LightbulbIcon className="w-5 h-5 text-[#4f46e5] mr-2" />
            Parent Action Plan
          </h2>
          <div className="bg-gradient-to-br from-[#eef2ff] to-[#eff9ff] rounded-2xl p-5 sm:p-6 border border-[#c7d2fe] flex-grow">
            {isLoadingPlan ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 bg-white/70 rounded w-full animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {actionPlan.map((action, idx) => {
                  const badgeColors = ['bg-[#4f46e5]', 'bg-[#0d9488]', 'bg-[#0284c7]'];
                  return (
                    <div key={idx} className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-lg ${badgeColors[idx % badgeColors.length]} text-white flex items-center justify-center text-xs font-bold font-mono-num shrink-0 mt-0.5`}>
                        {idx + 1}
                      </div>
                      <p className="text-[#0f3d3e] font-medium text-sm leading-relaxed">{action}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Child's Milestones */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-bold text-[#0f3d3e] font-serif-elegant">Child's Milestones</h2>
          <span className="text-xs font-medium text-[#4b7476]">Habit &amp; calm progress</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {milestones.map((m, idx) => {
            const milestoneThemes = [
              'border-[#fed7aa] bg-gradient-to-br from-[#fff7ed] to-[#ffedd5]',
              'border-[#a7f3d0] bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5]',
              'border-[#99e2d8] bg-gradient-to-br from-[#e6faf6] to-[#e0f2fe]',
              'border-[#e9d5ff] bg-gradient-to-br from-[#f5f3ff] to-[#f3e8ff]',
            ];
            return (
              <Card
                key={m.id}
                className={`p-4 flex flex-col items-center text-center border transition-colors ${
                  m.unlocked
                    ? milestoneThemes[idx % milestoneThemes.length]
                    : 'border-[#cce7e3] bg-white opacity-45 grayscale'
                }`}
              >
                <span className="text-2xl mb-2">{m.emoji}</span>
                <h4 className="text-xs font-bold text-[#0f3d3e]">{m.name}</h4>
                <p className="text-[11px] text-[#4b7476] mt-0.5">{m.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Alerts & Activity Timeline (Jan – Early Nov) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <section className="lg:col-span-7">
          <h3 className="text-lg font-bold text-[#0f3d3e] mb-3 font-serif-elegant">
            Wellness Notes (Jan – Early Nov)
          </h3>
          <div className="space-y-3">
            {alerts.map((alert) => {
              const tone = alertSeverityClasses[alert.severity];
              return (
                <Card
                  key={alert.id}
                  className={`${tone.bg} border ${tone.border} flex items-start space-x-3 p-4`}
                >
                  {tone.icon}
                  <div>
                    <p className={`${tone.text} font-semibold text-sm leading-snug`}>{alert.message}</p>
                    <p className={`text-xs ${tone.text} opacity-75 mt-1 font-mono-num`}>
                      {tone.label} · {alert.date}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5">
          <h3 className="text-lg font-bold text-[#0f3d3e] mb-3 font-serif-elegant">
            Activity Log (Jan – Early Nov)
          </h3>
          <Card className="border border-[#cce7e3] bg-white divide-y divide-[#eaf6f4] p-0 overflow-hidden">
            {activityLog.map((item) => (
              <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0f3d3e] truncate">{item.activity}</p>
                  <p className="text-xs text-[#4b7476] font-mono-num">{item.date}</p>
                </div>
                <span className="text-xs font-semibold font-mono-num text-[#0f766e] shrink-0">
                  {item.duration}
                </span>
              </div>
            ))}
          </Card>
        </section>
      </div>

      {/* Literary Moment for Parents */}
      <LiteratureClockCard compact />
    </div>
  );
};

export default WellnessReport;