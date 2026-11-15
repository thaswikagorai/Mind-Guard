import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import WellnessReport from './WellnessReport';
import ParentMentor from './ParentMentor';
import StressCheckIn from '../checkin/StressCheckIn';
import { BarChartIcon, SettingsIcon, LightbulbIcon, SparklesIcon, CameraIcon } from '../icons';
import { STUDENT_DATA } from '../../constants';
import { generateParentalAdvice } from '../../services/geminiService';

interface ParentDashboardProps {
  childsEmail: string;
  onLogout: () => void;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ childsEmail, onLogout }) => {
  const [activeTab, setActiveTab] = useState('report');
  const [showMentor, setShowMentor] = useState(false);
  const studentData = STUDENT_DATA[childsEmail] || STUDENT_DATA['default'];

  if (showMentor) {
    return <ParentMentor studentData={studentData} onBack={() => setShowMentor(false)} />;
  }

  if (activeTab === 'checkin') {
    return <StressCheckIn onBack={() => setActiveTab('report')} defaultAgeGroup="adult" />;
  }

  return (
    <div className="bg-gradient-to-b from-[#eefaf7] via-[#f4fbff] to-[#eef2ff] h-full flex flex-col">
      <header className="px-4 sm:px-6 py-4 bg-white border-b border-[#bde6de]">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0f3d3e] font-serif-elegant">
              Parent Hub
            </h1>
            <p className="text-xs sm:text-sm text-[#4b7476] truncate">
              Reviewing <span className="font-semibold text-[#0f766e]">{childsEmail}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-semibold text-[#335c5d] hover:text-[#0f3d3e] px-3.5 py-2 rounded-xl border border-[#bde6de] bg-white hover:bg-[#e3f7f3] transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'report' && <WellnessReport childsEmail={childsEmail} />}
          {activeTab === 'support' && (
            <AdviceSupport studentData={studentData} onOpenMentor={() => setShowMentor(true)} />
          )}
          {activeTab === 'settings' && <ControlSettings />}
        </div>
      </main>

      <footer className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#bde6de] z-10">
        <nav className="max-w-xl mx-auto grid grid-cols-4 h-16 px-2 gap-1 py-1">
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`flex flex-col items-center justify-center rounded-xl transition-colors ${
              activeTab === 'report'
                ? 'text-[#0f766e] bg-[#e6faf6]'
                : 'text-[#4b7476] hover:text-[#0f3d3e]'
            }`}
          >
            <BarChartIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] font-semibold">Report</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`flex flex-col items-center justify-center rounded-xl transition-colors ${
              activeTab === 'support'
                ? 'text-[#4f46e5] bg-[#eef2ff]'
                : 'text-[#4b7476] hover:text-[#0f3d3e]'
            }`}
          >
            <LightbulbIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] font-semibold">Advice</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checkin')}
            className="flex flex-col items-center justify-center rounded-xl transition-colors text-[#0284c7] hover:bg-[#e0f2fe]"
          >
            <CameraIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] font-semibold">Check-In</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center rounded-xl transition-colors ${
              activeTab === 'settings'
                ? 'text-[#c2410c] bg-[#ffedd5]'
                : 'text-[#4b7476] hover:text-[#0f3d3e]'
            }`}
          >
            <SettingsIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] font-semibold">Settings</span>
          </button>
        </nav>
      </footer>
    </div>
  );
};

const AdviceSupport: React.FC<{ studentData: any; onOpenMentor: () => void }> = ({
  studentData,
  onOpenMentor,
}) => {
  const [advice, setAdvice] = useState<{ title: string; content: string; icon: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdvice = async () => {
      setIsLoading(true);
      const res = await generateParentalAdvice(studentData.stressReport);
      setAdvice(res);
      setIsLoading(false);
    };
    fetchAdvice();
  }, [studentData]);

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-12">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f3d3e] font-serif-elegant">
            Support Strategy
          </h2>
          <p className="text-xs sm:text-sm text-[#4b7476] mt-0.5">
            Practical ways to encourage your child this week.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenMentor}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#0ea5e9] text-white rounded-xl text-xs font-semibold hover:brightness-105 transition-all min-h-[44px] whitespace-nowrap shadow-xs"
        >
          <SparklesIcon className="w-4 h-4" />
          <span>Chat with Dr. Aris</span>
        </button>
      </div>

      {/* Do You Know? Card - clean hairline border, no border-l-4 */}
      <Card className="bg-gradient-to-br from-[#e6faf6] via-[#eff9ff] to-[#fff4ec] border border-[#99e2d8] p-5 sm:p-6">
        <h3 className="text-[#0f3d3e] font-bold mb-2 flex items-center font-serif-elegant text-lg">
          <span className="mr-2">💡</span> Do You Know?
        </h3>
        <p className="text-sm text-[#335c5d] mb-4">
          Your child might be carrying hidden stress if they often feel:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            ['😣', 'Overwhelmed or anxious', 'bg-white border-[#99e2d8]'],
            ['😴', 'Tired even after sleeping', 'bg-white border-[#bae6fd]'],
            ['📚', 'Unable to focus on studies', 'bg-white border-[#c7d2fe]'],
            ['😡', 'Easily irritated', 'bg-white border-[#fed7aa]'],
            ['🤯', 'Overthinking a lot', 'bg-white border-[#e9d5ff]'],
            ['😔', 'Low or unmotivated', 'bg-white border-[#fecdd3]'],
          ].map(([emoji, label, borderCls]) => (
            <div
              key={label}
              className={`flex items-center text-sm text-[#0f3d3e] px-3.5 py-2.5 rounded-xl border ${borderCls}`}
            >
              <span className="mr-3 text-base">{emoji}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white border border-[#cce7e3] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advice.map((item, idx) => {
            const adviceColors = ['bg-[#ccf7ef]', 'bg-[#e0e7ff]', 'bg-[#ffedd5]', 'bg-[#e0f2fe]'];
            return (
              <Card
                key={idx}
                className="flex space-x-4 items-start p-5 border border-[#bde6de] bg-white"
              >
                <span className={`text-2xl p-2.5 ${adviceColors[idx % adviceColors.length]} rounded-xl shrink-0`}>
                  {item.icon}
                </span>
                <div>
                  <h4 className="font-bold text-[#0f3d3e] mb-1">{item.title}</h4>
                  <p className="text-sm text-[#335c5d] leading-relaxed">{item.content}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ControlSettings: React.FC = () => {
  const [controlledMode, setControlledMode] = useState(false);
  const [reminders, setReminders] = useState(true);
  const [nudge, setNudge] = useState('');
  const [isSavingNudge, setIsSavingNudge] = useState(false);

  useEffect(() => {
    const savedNudge = localStorage.getItem('parent_nudge_message');
    if (savedNudge) setNudge(savedNudge);
  }, []);

  const handleSaveNudge = () => {
    setIsSavingNudge(true);
    localStorage.setItem('parent_nudge_message', nudge);
    setTimeout(() => setIsSavingNudge(false), 900);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto pb-12">
      <section>
        <h2 className="text-xl font-bold text-[#0f3d3e] mb-3 font-serif-elegant">
          Supportive Nudge
        </h2>
        <Card className="p-5 sm:p-6 bg-gradient-to-br from-white to-[#fff7ed] border border-[#fed7aa]">
          <p className="text-xs font-semibold text-[#c2410c] mb-3">Message from Home</p>
          <textarea
            value={nudge}
            onChange={(e) => setNudge(e.target.value)}
            placeholder="Write an encouraging note (e.g., 'Proud of your effort today—take a calm breather!')..."
            className="w-full h-24 p-3.5 bg-white border border-[#fed7aa] rounded-xl focus:outline-none focus:border-[#0d9488] resize-none text-sm text-[#0f3d3e] placeholder-[#7ca1a3] mb-4"
          />
          <button
            type="button"
            onClick={handleSaveNudge}
            className="w-full py-3 bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white font-semibold rounded-xl hover:brightness-105 transition-all text-sm min-h-[44px]"
          >
            {isSavingNudge ? 'Sent to Student Hub' : 'Send to Child'}
          </button>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#0f3d3e] mb-3 font-serif-elegant">App Controls</h2>
        <Card className="border border-[#cce7e3] bg-white p-5 sm:p-6">
          <div className="space-y-5">
            <div className="flex justify-between items-center gap-4">
              <div>
                <h4 className="font-semibold text-[#0f3d3e]">Controlled Mode</h4>
                <p className="text-xs text-[#4b7476] mt-0.5">
                  Encourage completing wellness routines before leisure apps.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={controlledMode}
                  onChange={() => setControlledMode(!controlledMode)}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-[#cce7e3] rounded-full peer peer-focus:ring-2 peer-focus:ring-[#0d9488] peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:bg-[#0d9488]" />
              </label>
            </div>
            <div className="border-t border-[#eaf6f4]" />
            <div className="flex justify-between items-center gap-4">
              <div>
                <h4 className="font-semibold text-[#0f3d3e]">Wellness Reminders</h4>
                <p className="text-xs text-[#4b7476] mt-0.5">
                  Twice-daily gentle mindfulness check-in reminders.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={reminders}
                  onChange={() => setReminders(!reminders)}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-[#cce7e3] rounded-full peer peer-focus:ring-2 peer-focus:ring-[#0d9488] peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:bg-[#0d9488]" />
              </label>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default ParentDashboard;