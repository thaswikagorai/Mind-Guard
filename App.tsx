import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import StudentDashboard from './components/student/StudentDashboard';
import ParentDashboard from './components/parent/ParentDashboard';
import MoodTracker from './components/student/MoodTracker';
import WellnessActivities, { WellnessActivityType } from './components/student/WellnessActivities';
import PrivateJournal from './components/student/PrivateJournal';
import StudentMentor from './components/student/StudentMentor';
import StudentReminders from './components/student/StudentReminders';
import WeeklyGoals from './components/student/WeeklyGoals';
import { OuterBotanicalSides, InnerSideLeafRim } from './components/common/BotanicalSideDecor';
import {
  IN_APP_NUDGE_EVENT,
  checkAndTriggerDueNudge,
  registerNotificationServiceWorker,
} from './services/checkInNotificationService';
import StressCheckIn from './components/checkin/StressCheckIn';
import { EmailIcon, SparklesIcon, ShieldCheckIcon } from './components/icons';
import MoodMusic from './components/student/MoodMusic';
import Walkthrough, { WalkthroughStep } from './components/common/Walkthrough';

const MindGuardLogo = ({ size = 'lg' }: { size?: 'sm' | 'lg' }) => (
  <div
    className={`rounded-3xl bg-gradient-to-br from-[#ccf7ef] via-[#ddf3ff] to-[#eef2ff] border border-[#9ce2d6] flex items-center justify-center shadow-sm ${
      size === 'lg' ? 'w-24 h-24 mb-6' : 'w-14 h-14 mb-4'
    }`}
  >
    <svg
      className={size === 'lg' ? 'w-14 h-14 text-[#0f766e]' : 'w-8 h-8 text-[#0f766e]'}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M9 8.5C9 9.88071 10.1193 11 11.5 11C12.8807 11 14 9.88071 14 8.5C14 7.11929 12.8807 6 11.5 6C10.1193 6 9 7.11929 9 8.5Z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M11.5 11V14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M9 14.5H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M8 18C8 19.1046 8.89543 20 10 20H13C14.1046 20 15 19.1046 15 18C15 16.8954 14.1046 16 13 16H10C8.89543 16 8 16.8954 8 18Z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M5.5 14C5.5 12.6193 6.61929 11.5 8 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M18.5 14C18.5 12.6193 17.3807 11.5 16 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M8 5.5C6.61929 5.5 5.5 6.61929 5.5 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M16 5.5C17.3807 5.5 18.5 6.61929 18.5 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M11.5 6C10.5 4.5 9 3 6.5 3C4 3 2.5 4.5 2.5 6.5C2.5 8.5 4 10 6.5 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M11.5 6C12.5 4.5 14 3 16.5 3C19 3 20.5 4.5 20.5 6.5C20.5 8.5 19 10 16.5 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  </div>
);

const SplashScreen = () => (
  <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-[#dffaf4] via-[#eef6ff] to-[#fff1ea] text-center p-6">
    <MindGuardLogo size="lg" />
    <h1 className="text-4xl sm:text-5xl font-bold text-[#0f3d3e] font-serif-elegant tracking-tight text-balance">
      MindGuard
    </h1>
    <p className="mt-3 text-base sm:text-lg text-[#0f766e] font-medium max-w-sm text-balance">
      Protecting Minds. Empowering Students.
    </p>
  </div>
);

interface RoleSelectionScreenProps {
  onSelectRole: (role: UserRole) => void;
}
const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ onSelectRole }) => (
  <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-[#e7faf6] via-[#f4f9ff] to-[#fff3ec] p-6 sm:p-10 overflow-y-auto">
    <div className="w-full max-w-xl flex flex-col items-center text-center">
      <MindGuardLogo size="sm" />
      <h2 className="text-3xl sm:text-4xl font-bold text-[#0f3d3e] mb-2 font-serif-elegant text-balance">
        Choose Your Space
      </h2>
      <p className="text-[#3d6b6d] mb-8 text-sm sm:text-base max-w-md leading-relaxed">
        Select how you will use MindGuard today so we can tailor your check-ins, tools, and guidance.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <button
          type="button"
          onClick={() => onSelectRole(UserRole.STUDENT)}
          className="group text-left bg-gradient-to-br from-[#0d9488] via-[#14b8a6] to-[#0891b2] text-white p-6 rounded-2xl border border-[#0d9488] hover:brightness-105 transition-all duration-200 flex flex-col justify-between min-h-[168px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d3e] focus-visible:ring-offset-2"
        >
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-4">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-serif-elegant mb-1">I'm a Student</h3>
            <p className="text-xs sm:text-sm text-[#e3fbf7] leading-relaxed">
              Daily affirmations, private journaling, stress check-ins, and calm study tools.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectRole(UserRole.PARENT)}
          className="group text-left bg-gradient-to-br from-[#4f46e5] via-[#5b5bd6] to-[#0284c7] text-white p-6 rounded-2xl border border-[#4f46e5] hover:brightness-105 transition-all duration-200 flex flex-col justify-between min-h-[168px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#312e81] focus-visible:ring-offset-2"
        >
          <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center mb-4">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-serif-elegant mb-1">I'm a Parent</h3>
            <p className="text-xs sm:text-sm text-[#e6ebff] leading-relaxed">
              Review wellness trends, supportive conversation tips, and gentle nudges.
            </p>
          </div>
        </button>
      </div>
    </div>
  </div>
);

interface StudentOnboardingScreenProps {
  onSubmit: (name: string, email: string, phone: string) => void;
}
const StudentOnboardingScreen: React.FC<StudentOnboardingScreenProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const validateName = (val: string) => {
    const isValid = val.trim().length >= 2;
    setNameError(isValid || val.length === 0 ? '' : 'Please enter your name (min 2 characters).');
    return isValid;
  };

  const validateEmail = (val: string) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    setEmailError(isValid || val.length === 0 ? '' : 'Please enter a valid email address.');
    return isValid;
  };

  const validatePhone = (num: string) => {
    const isValid = /^\d{10}$/.test(num);
    setPhoneError(isValid || num.length === 0 ? '' : 'Please enter a valid 10-digit mobile number.');
    return isValid;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    validateName(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    validateEmail(e.target.value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
      validatePhone(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(phone);
    if (isNameValid && isEmailValid && isPhoneValid) {
      onSubmit(name, email, phone);
    }
  };

  const isFormValid =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    /^\d{10}$/.test(phone);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-[#e7faf6] via-[#f4f9ff] to-[#fff3ec] p-6 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#bde6de] p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-7">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0f3d3e] mb-2 font-serif-elegant">
            Student Setup
          </h2>
          <p className="text-sm text-[#4b7476] leading-relaxed">
            Personalize your dashboard and connect with your parent contact.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#335c5d] mb-1.5">First name</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              className={`w-full px-4 py-3.5 bg-[#f7fcfb] border ${
                nameError ? 'border-rose-400' : 'border-[#cce7e3]'
              } rounded-xl focus:outline-none focus:border-[#0d9488] focus:bg-white text-sm text-[#0f3d3e] placeholder-[#7ca1a3] transition-colors`}
              placeholder="Your first name"
            />
            {nameError && <p className="text-rose-600 text-xs mt-1.5 font-medium">{nameError}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#335c5d] mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className={`w-full px-4 py-3.5 bg-[#f7fcfb] border ${
                emailError ? 'border-rose-400' : 'border-[#cce7e3]'
              } rounded-xl focus:outline-none focus:border-[#0d9488] focus:bg-white text-sm text-[#0f3d3e] placeholder-[#7ca1a3] transition-colors`}
              placeholder="you@school.edu"
            />
            {emailError && <p className="text-rose-600 text-xs mt-1.5 font-medium">{emailError}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#335c5d] mb-1.5">Parent mobile</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[#0f766e] text-sm font-semibold">
                +91
              </div>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                className={`w-full py-3.5 pr-4 pl-14 bg-[#f7fcfb] border ${
                  phoneError ? 'border-rose-400' : 'border-[#cce7e3]'
                } rounded-xl focus:outline-none focus:border-[#0d9488] focus:bg-white text-sm text-[#0f3d3e] placeholder-[#7ca1a3] transition-colors`}
                placeholder="10-digit mobile number"
              />
            </div>
            {phoneError && <p className="text-rose-600 text-xs mt-1.5 font-medium">{phoneError}</p>}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className="mt-2 w-full bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white font-semibold py-3.5 px-4 rounded-xl hover:brightness-105 transition-all disabled:from-[#cce7e3] disabled:to-[#cce7e3] disabled:text-[#4b7476] disabled:cursor-not-allowed min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d3e] focus-visible:ring-offset-2"
          >
            Continue to Student Hub
          </button>
        </form>
      </div>
    </div>
  );
};

const ParentOnboardingScreen: React.FC<{
  onBack: () => void;
  onSubmit: (childsEmail: string, phone: string) => void;
}> = ({ onBack, onSubmit }) => {
  const [childsEmail, setChildsEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(childsEmail.trim());
    const digitsOnly = phone.replace(/\D/g, '');
    const phoneValid = /^\d{10}$/.test(digitsOnly);

    setEmailError(emailValid ? '' : 'Please enter a valid student email address.');
    setPhoneError(phoneValid ? '' : 'Please enter a valid 10-digit mobile number.');

    if (emailValid && phoneValid) {
      onSubmit(childsEmail.trim(), digitsOnly);
    }
  };

  const isFormValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(childsEmail.trim()) &&
    /^\d{10}$/.test(phone.replace(/\D/g, ''));

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-[#e7faf6] via-[#f4f9ff] to-[#fff3ec] p-6 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#bde6de] p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-semibold text-[#0f766e] hover:text-[#0f3d3e] py-1.5 px-2.5 rounded-lg hover:bg-[#e6faf6] transition-colors"
          >
            ← Back
          </button>
          <span className="text-[11px] font-semibold text-[#4b7476] uppercase tracking-wider">
            Parent Setup
          </span>
        </div>

        <div className="text-center mb-7">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0f3d3e] mb-2 font-serif-elegant">
            Parent Hub Login
          </h2>
          <p className="text-sm text-[#4b7476] leading-relaxed">
            Connect with your child&apos;s wellness check-ins and supportive trends.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#335c5d] mb-1.5">
              Child&apos;s email address
            </label>
            <input
              type="email"
              value={childsEmail}
              onChange={(e) => {
                setChildsEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              className={`w-full px-4 py-3.5 bg-[#f7fcfb] border ${
                emailError ? 'border-rose-400' : 'border-[#cce7e3]'
              } rounded-xl focus:outline-none focus:border-[#0d9488] focus:bg-white text-sm text-[#0f3d3e] placeholder-[#7ca1a3] transition-colors`}
              placeholder="student@school.edu"
            />
            {emailError && <p className="text-rose-600 text-xs mt-1.5 font-medium">{emailError}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#335c5d] mb-1.5">
              Your mobile number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[#0f766e] text-sm font-semibold">
                +91
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(digits);
                  if (phoneError) setPhoneError('');
                }}
                className={`w-full py-3.5 pr-4 pl-14 bg-[#f7fcfb] border ${
                  phoneError ? 'border-rose-400' : 'border-[#cce7e3]'
                } rounded-xl focus:outline-none focus:border-[#0d9488] focus:bg-white text-sm text-[#0f3d3e] placeholder-[#7ca1a3] transition-colors`}
                placeholder="10-digit mobile number"
              />
            </div>
            {phoneError && <p className="text-rose-600 text-xs mt-1.5 font-medium">{phoneError}</p>}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className="mt-2 w-full bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white font-semibold py-3.5 px-4 rounded-xl hover:brightness-105 transition-all disabled:from-[#cce7e3] disabled:to-[#cce7e3] disabled:text-[#4b7476] disabled:cursor-not-allowed min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d3e] focus-visible:ring-offset-2"
          >
            Continue to Parent Hub
          </button>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<'splash' | 'role_selection' | 'student_onboarding' | 'parent_onboarding' | 'dashboard'>('splash');
  const [userRole, setUserRole] = useState<UserRole>(UserRole.NONE);
  const [studentView, setStudentView] = useState<'dashboard' | 'mood-tracker' | 'stress-checkin' | 'wellness' | 'journal' | 'music' | 'mentor' | 'reminders' | 'goals' | 'stickers'>('dashboard');
  const [wellnessActivity, setWellnessActivity] = useState<WellnessActivityType | null>(null);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [parentPhoneNum, setParentPhoneNum] = useState('');
  const [childsEmail, setChildsEmail] = useState('');
  const [inAppNudge, setInAppNudge] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAppState('role_selection'), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Browser push notification scheduler & Service Worker click routing for students
  useEffect(() => {
    if (appState !== 'dashboard' || userRole !== UserRole.STUDENT) return;

    registerNotificationServiceWorker();
    checkAndTriggerDueNudge(studentName);

    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'stress-checkin') {
      setStudentView('stress-checkin');
    }

    const intervalId = window.setInterval(() => {
      checkAndTriggerDueNudge(studentName);
    }, 20_000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndTriggerDueNudge(studentName);
      }
    };

    const handleInAppNudge = (evt: Event) => {
      const detail = (evt as CustomEvent<{ title?: string; body?: string }>).detail;
      if (detail?.body) {
        setInAppNudge({
          title: detail.title || 'Daily Check-In Reminder',
          body: detail.body,
        });
      }
    };

    const handleSwMessage = (evt: MessageEvent) => {
      if (evt.data?.type === 'OPEN_STRESS_CHECKIN') {
        setStudentView('stress-checkin');
        setInAppNudge(null);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    window.addEventListener(IN_APP_NUDGE_EVENT, handleInAppNudge);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      window.removeEventListener(IN_APP_NUDGE_EVENT, handleInAppNudge);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, [appState, userRole, studentName]);

  const handleRoleSelect = (role: UserRole) => {
    if (role === UserRole.STUDENT) {
      setAppState('student_onboarding');
    } else {
      setAppState('parent_onboarding');
    }
  };

  const handleStudentOnboardingSubmit = (name: string, email: string, phone: string) => {
    const cleanName = name.trim();
    setStudentName(cleanName);
    setStudentEmail(email);
    setParentPhoneNum(phone);
    try {
      localStorage.setItem('mindguard_user_name', cleanName);
    } catch {
      // ignore storage errors
    }
    setUserRole(UserRole.STUDENT);
    setAppState('dashboard');

    if (!localStorage.getItem('mindguard_walkthrough_student')) {
      setShowWalkthrough(true);
    }
  };

  const handleParentOnboardingSubmit = (email: string, phone: string) => {
    setChildsEmail(email);
    setParentPhoneNum(phone);
    setUserRole(UserRole.PARENT);
    setAppState('dashboard');

    if (!localStorage.getItem('mindguard_walkthrough_parent')) {
      setShowWalkthrough(true);
    }
  };

  const handleLogout = () => {
    setUserRole(UserRole.NONE);
    setAppState('role_selection');
    setStudentName('');
    setStudentEmail('');
    setParentPhoneNum('');
    setChildsEmail('');
    setStudentView('dashboard');
    setWellnessActivity(null);
    setShowWalkthrough(false);
    setInAppNudge(null);
    try {
      localStorage.removeItem('mindguard_user_name');
    } catch {
      // ignore storage errors
    }
  };

  const handleStudentNav = (view: 'mood-tracker' | 'stress-checkin' | 'wellness' | 'journal' | 'music' | 'mentor' | 'reminders' | 'goals' | 'stickers') => {
    if (view === 'wellness') {
      setWellnessActivity(null);
    }
    setStudentView(view);
  };

  const handleLaunchWellnessActivity = (activity: WellnessActivityType) => {
    setWellnessActivity(activity);
    setStudentView('wellness');
  };

  const handleWalkthroughComplete = () => {
    localStorage.setItem(`mindguard_walkthrough_${userRole.toLowerCase()}`, 'true');
    setShowWalkthrough(false);
  };

  const studentSteps: WalkthroughStep[] = [
    { title: "Welcome to MindGuard!", description: "Your calm space to track wellness and ease academic pressure with gentle guidance.", icon: "🌿" },
    { title: "Quick Stress Check-In", description: "Take a private snapshot to notice visible emotions, posture, and facial tension cues.", icon: "📷" },
    { title: "AI Wellness Mentor", description: "Chat with Mindy anytime for encouragement, study balance tips, or grounding.", icon: "✨" },
    { title: "Wellness Quizzes", description: "Use the UC Berkeley or PSS-10 assessments to reflect on your weekly stress.", icon: "📈" },
    { title: "Private Journal", description: "Keep your thoughts protected behind a 4-digit PIN that only you unlock.", icon: "🔒" },
  ];

  const parentSteps: WalkthroughStep[] = [
    { title: "Welcome to Parent Hub", description: "Stay thoughtfully informed and supportive of your child's mental wellness.", icon: "🩵" },
    { title: "AI Wellness Insight", description: "Read clear weekly summaries and actionable tips tailored to recent stress trends.", icon: "🤖" },
    { title: "Stress Analytics", description: "Spot patterns across the semester to notice when extra encouragement helps.", icon: "📊" },
    { title: "Supportive Controls", description: "Send warm notes from home or manage healthy study and reminder settings.", icon: "⚙️" },
  ];

  const renderContent = () => {
    if (appState === 'splash') return <SplashScreen />;
    if (appState === 'role_selection') return <RoleSelectionScreen onSelectRole={handleRoleSelect} />;
    if (appState === 'student_onboarding') return <StudentOnboardingScreen onSubmit={handleStudentOnboardingSubmit} />;
    if (appState === 'parent_onboarding') {
      return (
        <ParentOnboardingScreen
          onBack={() => setAppState('role_selection')}
          onSubmit={handleParentOnboardingSubmit}
        />
      );
    }

    if (appState === 'dashboard') {
      switch (userRole) {
        case UserRole.STUDENT:
          return (
            <>
              {showWalkthrough && (
                <Walkthrough steps={studentSteps} onComplete={handleWalkthroughComplete} role="student" />
              )}
              {inAppNudge && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mx-3 sm:mx-4 mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white shadow-md flex flex-wrap items-center justify-between gap-3 z-30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#ccf7ef] truncate">{inAppNudge.title}</p>
                    <p className="text-xs sm:text-sm font-medium text-white leading-snug">
                      {inAppNudge.body}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setInAppNudge(null);
                        setStudentView('stress-checkin');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white text-[#0f766e] text-xs font-bold hover:bg-[#eefaf7] whitespace-nowrap min-h-[38px]"
                    >
                      Start Check-In →
                    </button>
                    <button
                      type="button"
                      onClick={() => setInAppNudge(null)}
                      aria-label="Dismiss check-in nudge"
                      className="px-2.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold min-h-[38px]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
              {(() => {
                switch (studentView) {
                  case 'mood-tracker':
                    return (
                      <MoodTracker
                        onComplete={() => setStudentView('dashboard')}
                        onNavigateToMentor={() => setStudentView('mentor')}
                        onNavigateToWellness={() => handleLaunchWellnessActivity('breathing')}
                      />
                    );
                  case 'stress-checkin':
                    return (
                      <StressCheckIn
                        onBack={() => setStudentView('dashboard')}
                        defaultAgeGroup="youth"
                        onLaunchBreathing={() => handleLaunchWellnessActivity('breathing')}
                        onOpenMentor={() => setStudentView('mentor')}
                      />
                    );
                  case 'wellness':
                    return (
                      <WellnessActivities
                        initialActivity={wellnessActivity}
                        onBack={() => {
                          setWellnessActivity(null);
                          setStudentView('dashboard');
                        }}
                      />
                    );
                  case 'journal':
                    return <PrivateJournal onBack={() => setStudentView('dashboard')} />;
                  case 'music':
                    return <MoodMusic onBack={() => setStudentView('dashboard')} />;
                  case 'mentor':
                    return <StudentMentor onBack={() => setStudentView('dashboard')} />;
                  case 'reminders':
                    return (
                      <StudentReminders
                        onBack={() => setStudentView('dashboard')}
                        studentName={studentName}
                        onOpenCheckIn={() => setStudentView('stress-checkin')}
                      />
                    );
                  case 'goals':
                    return <WeeklyGoals onBack={() => setStudentView('dashboard')} initialTab="goals" />;
                  case 'stickers':
                    return <WeeklyGoals onBack={() => setStudentView('dashboard')} initialTab="stickers" />;
                  case 'dashboard':
                  default:
                    return (
                      <StudentDashboard
                        name={studentName}
                        onNavigate={handleStudentNav}
                        onLaunchWellnessActivity={handleLaunchWellnessActivity}
                        onLogout={handleLogout}
                      />
                    );
                }
              })()}
            </>
          );
        case UserRole.PARENT:
          return (
            <>
              {showWalkthrough && (
                <Walkthrough steps={parentSteps} onComplete={handleWalkthroughComplete} role="parent" />
              )}
              <ParentDashboard childsEmail={childsEmail} onLogout={handleLogout} />
            </>
          );
        default:
          return <RoleSelectionScreen onSelectRole={handleRoleSelect} />;
      }
    }

    return <RoleSelectionScreen onSelectRole={handleRoleSelect} />;
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-[#dff8f2] via-[#e9f4ff] to-[#fff2eb] flex flex-col overflow-hidden relative">
      <OuterBotanicalSides />
      <div className="w-full max-w-5xl mx-auto flex-1 h-full md:my-5 md:h-[calc(100vh-2.5rem)] md:rounded-3xl md:border md:border-[#bde6de] bg-[#eefaf7] md:shadow-[0_20px_50px_-24px_rgba(15,61,62,0.18)] flex flex-col relative z-10 overflow-hidden">
        <InnerSideLeafRim />
        {renderContent()}
      </div>
    </div>
  );
};

export default App;