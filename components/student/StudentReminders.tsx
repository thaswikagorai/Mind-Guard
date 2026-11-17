import React, { useState, useEffect } from 'react';
import {
  CheckInNotificationSettings,
  NotificationCadence,
  StudentReminder,
} from '../../types';
import {
  BellIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
  InfoCircleIcon,
  PlusIcon,
  TrashIcon,
} from '../icons';
import Card from '../common/Card';
import {
  BrowserPermissionState,
  REMINDERS_UPDATED_EVENT,
  dispatchCheckInNotification,
  formatTime12Hour,
  getBrowserNotificationPermission,
  getNextScheduledNudgeLabel,
  getTodayLocalDateKey,
  loadCheckInNotificationSettings,
  registerNotificationServiceWorker,
  requestBrowserNotificationPermission,
  saveCheckInNotificationSettings,
} from '../../services/checkInNotificationService';

interface StudentRemindersProps {
  onBack: () => void;
  studentName?: string;
  onOpenCheckIn?: () => void;
}

const TIME_PRESETS = [
  { label: '9:00 AM', value: '09:00' },
  { label: '3:30 PM', value: '15:30' },
  { label: '7:00 PM', value: '19:00' },
  { label: '9:00 PM', value: '21:00' },
];

const StudentReminders: React.FC<StudentRemindersProps> = ({
  onBack,
  studentName,
  onOpenCheckIn,
}) => {
  const [reminders, setReminders] = useState<StudentReminder[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTime, setNewTime] = useState('08:00');
  const [newActivity, setNewActivity] = useState('Meditation');

  // Daily Check-In Browser Push Notification Settings
  const [notifSettings, setNotifSettings] = useState<CheckInNotificationSettings>(() =>
    loadCheckInNotificationSettings()
  );
  const [permissionState, setPermissionState] = useState<BrowserPermissionState>(() =>
    getBrowserNotificationPermission()
  );
  const [isRequestingPerm, setIsRequestingPerm] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  const activities = ['Breathing', 'Yoga', 'Meditation', 'Affirmations', 'Journaling'];

  useEffect(() => {
    const fallbackDefaults: StudentReminder[] = [
      { id: '1', time: '08:00', activity: 'Morning Affirmation', enabled: true },
      { id: '2', time: '20:00', activity: 'Evening Reflection', enabled: true },
    ];
    try {
      const saved = localStorage.getItem('mindguard_reminders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setReminders(parsed);
        } else {
          setReminders(fallbackDefaults);
          localStorage.setItem('mindguard_reminders', JSON.stringify(fallbackDefaults));
        }
      } else {
        setReminders(fallbackDefaults);
        localStorage.setItem('mindguard_reminders', JSON.stringify(fallbackDefaults));
      }
    } catch {
      setReminders(fallbackDefaults);
    }

    if (getBrowserNotificationPermission() === 'granted') {
      registerNotificationServiceWorker();
    }
  }, []);

  const updateNotifSettings = (updater: (prev: CheckInNotificationSettings) => CheckInNotificationSettings) => {
    setNotifSettings((prev) => {
      const next = updater(prev);
      saveCheckInNotificationSettings(next);
      return next;
    });
  };

  const handleToggleDailyPush = async () => {
    const nextEnabled = !notifSettings.enabled;
    setTestFeedback(null);

    if (nextEnabled) {
      const currentPerm = getBrowserNotificationPermission();
      setPermissionState(currentPerm);

      if (currentPerm === 'default') {
        setIsRequestingPerm(true);
        const grantedResult = await requestBrowserNotificationPermission();
        setPermissionState(grantedResult);
        setIsRequestingPerm(false);
      } else if (currentPerm === 'granted') {
        await registerNotificationServiceWorker();
      }
    }

    updateNotifSettings((prev) => ({
      ...prev,
      enabled: nextEnabled,
    }));
  };

  const handlePreferredTimeChange = (nextTime: string) => {
    if (!nextTime) return;
    setTestFeedback(null);
    const todayKey = getTodayLocalDateKey();
    const [h, m] = nextTime.split(':').map(Number);
    const now = new Date();
    const isFutureToday =
      Number.isFinite(h) &&
      Number.isFinite(m) &&
      h * 60 + m > now.getHours() * 60 + now.getMinutes();

    updateNotifSettings((prev) => ({
      ...prev,
      preferredTime: nextTime,
      // Allow notification today if the student picked a later time today
      lastNotifiedDate:
        prev.lastNotifiedDate === todayKey && isFutureToday ? null : prev.lastNotifiedDate,
    }));
  };

  const handleCadenceChange = (cadence: NotificationCadence) => {
    updateNotifSettings((prev) => ({ ...prev, cadence }));
  };

  const handleRequestPermissionExplicit = async () => {
    setIsRequestingPerm(true);
    const result = await requestBrowserNotificationPermission();
    setPermissionState(result);
    setIsRequestingPerm(false);
    if (result === 'granted') {
      setTestFeedback('Browser push notifications enabled.');
    } else if (result === 'denied') {
      setTestFeedback('Browser permission blocked — in-app nudges will still appear here.');
    }
  };

  const handleSendTestNudge = async () => {
    setTestFeedback(null);
    let currentPerm = getBrowserNotificationPermission();
    if (currentPerm === 'default') {
      currentPerm = await requestBrowserNotificationPermission();
      setPermissionState(currentPerm);
    }

    const res = await dispatchCheckInNotification({
      studentName,
      customMessage: notifSettings.customMessage,
      isTest: true,
      onOpenCheckIn,
    });

    if (res.browserNotificationSent) {
      setTestFeedback('Test browser push notification sent!');
    } else {
      setTestFeedback(res.reason || 'In-app test nudge delivered.');
    }
  };

  const saveReminders = (updated: StudentReminder[]) => {
    setReminders(updated);
    try {
      localStorage.setItem('mindguard_reminders', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(REMINDERS_UPDATED_EVENT));
    } catch {
      // ignore storage quota errors
    }
  };

  const handleAddReminder = () => {
    const reminder: StudentReminder = {
      id: Date.now().toString(),
      time: newTime,
      activity: newActivity,
      enabled: true,
    };
    saveReminders([...reminders, reminder]);
    setIsAdding(false);
  };

  const toggleReminder = (id: string) => {
    saveReminders(reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteReminder = (id: string) => {
    saveReminders(reminders.filter((r) => r.id !== id));
  };

  const reminderPalette = [
    'bg-[#ccf7ef] text-[#0f766e]',
    'bg-[#e0e7ff] text-[#4f46e5]',
    'bg-[#ffedd5] text-[#c2410c]',
    'bg-[#d1fae5] text-[#059669]',
  ];

  const permissionStatusMeta: Record<
    BrowserPermissionState,
    { label: string; badgeClass: string }
  > = {
    granted: {
      label: 'Browser Push Ready',
      badgeClass: 'bg-[#d1fae5] text-[#065f46] border-[#6ee7b7]',
    },
    default: {
      label: 'Permission Needed',
      badgeClass: 'bg-[#e0f2fe] text-[#075985] border-[#7dd3fc]',
    },
    denied: {
      label: 'In-App Fallback (Browser Blocked)',
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
    },
    unsupported: {
      label: 'In-App Nudge Mode',
      badgeClass: 'bg-[#eef2ff] text-[#3730a3] border-[#c7d2fe]',
    },
  };

  const permMeta = permissionStatusMeta[permissionState];
  const nextNudgeLabel = getNextScheduledNudgeLabel(notifSettings);

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-gradient-to-b from-[#eefaf7] via-[#f4fbff] to-[#f9f5ff] relative overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full space-y-6 pb-10">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center min-w-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl hover:bg-[#e3f7f3] text-[#4b7476] hover:text-[#0f3d3e] transition-colors mr-2 flex items-center justify-center shrink-0"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0f3d3e] font-serif-elegant truncate">
                Reminders &amp; Settings
              </h1>
              <p className="text-xs text-[#0f766e] font-medium truncate">
                Set your daily check-in push notification time &amp; wellness alerts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(true)}
            aria-label="Add reminder"
            className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-[#0d9488] to-[#6366f1] text-white px-4 py-2.5 rounded-xl hover:brightness-105 transition-all text-xs font-semibold min-h-[44px] whitespace-nowrap shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add</span>
          </button>
        </header>

        {/* STUDENT SETTINGS: DAILY CHECK-IN BROWSER PUSH NOTIFICATIONS */}
        <Card className="p-5 sm:p-6 rounded-3xl border border-[#99e2d8] bg-gradient-to-br from-white via-[#f2fcf9] to-[#eff8ff] space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start space-x-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#ccf7ef] to-[#e0f2fe] text-[#0f766e] flex items-center justify-center shrink-0">
                <BellIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-[#0f3d3e] font-serif-elegant">
                  Daily Check-In Push Nudges
                </h2>
                <p className="text-xs text-[#4b7476] mt-0.5 leading-relaxed">
                  Receive a gentle browser notification at your preferred time to pause for a quick check-in.
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={notifSettings.enabled}
              aria-label="Enable daily check-in push notifications"
              disabled={isRequestingPerm}
              onClick={handleToggleDailyPush}
              className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
                notifSettings.enabled ? 'bg-[#0d9488]' : 'bg-[#cce7e3]'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  notifSettings.enabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Permission Status Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white border border-[#cce7e3]">
            <div className="flex items-center space-x-2 text-xs">
              {permissionState === 'granted' ? (
                <CheckCircleIcon className="w-4 h-4 text-[#059669] shrink-0" />
              ) : (
                <InfoCircleIcon className="w-4 h-4 text-[#0284c7] shrink-0" />
              )}
              <span className="font-semibold text-[#0f3d3e]">Status:</span>
              <span
                className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold ${permMeta.badgeClass}`}
              >
                {permMeta.label}
              </span>
            </div>

            {permissionState === 'default' && (
              <button
                type="button"
                onClick={handleRequestPermissionExplicit}
                disabled={isRequestingPerm}
                className="px-3 py-1.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-semibold transition-colors whitespace-nowrap min-h-[36px]"
              >
                {isRequestingPerm ? 'Requesting...' : 'Allow Notifications'}
              </button>
            )}
          </div>

          {permissionState === 'denied' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
              Browser notifications are currently blocked for this site. You can re-enable them from your browser&apos;s
              address-bar site permissions; in the meantime, MindGuard will deliver an in-app nudge at your preferred time.
            </div>
          )}

          {/* Preferred Check-In Time + Quick Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="preferred-checkin-time"
                className="block text-xs font-semibold text-[#335c5d]"
              >
                Preferred Check-In Time
              </label>
              <input
                id="preferred-checkin-time"
                type="time"
                value={notifSettings.preferredTime}
                onChange={(e) => handlePreferredTimeChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#bde6de] rounded-xl text-lg font-bold font-mono-num text-[#0f3d3e] focus:outline-none focus:ring-2 focus:ring-[#0d9488] min-h-[46px]"
              />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {TIME_PRESETS.map((preset) => {
                  const active = notifSettings.preferredTime === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handlePreferredTimeChange(preset.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold font-mono-num border transition-colors ${
                        active
                          ? 'bg-[#0d9488] border-[#0d9488] text-white'
                          : 'bg-white border-[#cce7e3] text-[#335c5d] hover:border-[#0d9488]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#335c5d]">Schedule Frequency</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCadenceChange('every_day')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors min-h-[46px] ${
                    notifSettings.cadence === 'every_day'
                      ? 'bg-[#e6faf6] border-[#0d9488] text-[#0f3d3e]'
                      : 'bg-white border-[#cce7e3] text-[#4b7476] hover:border-[#8cd3ca]'
                  }`}
                >
                  Every Day
                </button>
                <button
                  type="button"
                  onClick={() => handleCadenceChange('weekdays')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors min-h-[46px] ${
                    notifSettings.cadence === 'weekdays'
                      ? 'bg-[#eef2ff] border-[#4f46e5] text-[#0f3d3e]'
                      : 'bg-white border-[#cce7e3] text-[#4b7476] hover:border-[#8cd3ca]'
                  }`}
                >
                  School Days
                </button>
              </div>
              <p className="text-[11px] text-[#4b7476] pt-1">
                Next nudge: <strong className="text-[#0f3d3e]">{nextNudgeLabel}</strong>
              </p>
            </div>
          </div>

          {/* Custom Nudge Copy */}
          <div>
            <label
              htmlFor="custom-nudge-message"
              className="block text-xs font-semibold text-[#335c5d] mb-1.5"
            >
              Nudge Message
            </label>
            <input
              id="custom-nudge-message"
              type="text"
              maxLength={140}
              value={notifSettings.customMessage}
              onChange={(e) =>
                updateNotifSettings((prev) => ({ ...prev, customMessage: e.target.value }))
              }
              placeholder="Time for a gentle 30-second wellness & stress check-in."
              className="w-full px-3.5 py-2.5 bg-white border border-[#bde6de] rounded-xl text-xs sm:text-sm text-[#0f3d3e] placeholder-[#7ca1a3] focus:outline-none focus:ring-2 focus:ring-[#0d9488] min-h-[44px]"
            />
          </div>

          {/* Test Nudge Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-xs text-[#335c5d]">
              {notifSettings.enabled
                ? `Active daily at ${formatTime12Hour(notifSettings.preferredTime)}`
                : 'Toggle the switch above to activate your daily nudge.'}
            </p>
            <button
              type="button"
              onClick={handleSendTestNudge}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#e6faf6] border border-[#0d9488] text-[#0f766e] text-xs font-semibold transition-colors whitespace-nowrap min-h-[44px]"
            >
              Send Test Nudge
            </button>
          </div>

          {testFeedback && (
            <p
              role="status"
              aria-live="polite"
              className="text-xs font-semibold text-[#0f766e] bg-[#e6faf6] border border-[#99e2d8] rounded-xl px-3.5 py-2.5"
            >
              {testFeedback}
            </p>
          )}
        </Card>

        {/* CUSTOM WELLNESS REMINDERS LIST */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-[#0f3d3e] font-serif-elegant px-0.5">
            Custom Activity Reminders
          </h2>

          {reminders.length === 0 ? (
            <div className="text-center py-12 px-8 bg-white rounded-2xl border border-[#cce7e3]">
              <div className="w-14 h-14 bg-gradient-to-br from-[#f3e8ff] to-[#ccf7ef] border border-[#e9d5ff] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
                🔔
              </div>
              <p className="text-[#4b7476] text-sm">
                No custom reminders set. Tap Add to schedule extra mindfulness breaks.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder, idx) => (
                <Card
                  key={reminder.id}
                  className={`p-4 sm:p-5 border border-[#bde6de] bg-white flex items-center justify-between transition-opacity ${
                    !reminder.enabled ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-3 rounded-xl ${
                        reminder.enabled
                          ? reminderPalette[idx % reminderPalette.length]
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <ClockIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#0f3d3e] font-mono-num">
                        {formatTime12Hour(reminder.time)}
                      </p>
                      <p className="text-xs sm:text-sm text-[#4b7476] font-medium">
                        {reminder.activity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={reminder.enabled}
                      aria-label={`Toggle ${reminder.activity} reminder`}
                      onClick={() => toggleReminder(reminder.id)}
                      className={`w-12 h-7 rounded-full transition-colors relative ${
                        reminder.enabled ? 'bg-[#0d9488]' : 'bg-[#cce7e3]'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          reminder.enabled ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteReminder(reminder.id)}
                      aria-label={`Delete ${reminder.activity} reminder`}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#7ca1a3] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {isAdding && (
        <div
          className="fixed inset-0 bg-[#0f3d3e]/40 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setIsAdding(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl border border-[#cce7e3]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#0f3d3e] mb-5 font-serif-elegant">
              Add Wellness Reminder
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#335c5d] mb-2">
                  Select Time
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full p-3.5 bg-[#f4fbfa] border border-[#cce7e3] rounded-xl text-xl font-bold font-mono-num text-[#0f3d3e] focus:outline-none focus:border-[#0d9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#335c5d] mb-2">
                  Activity Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {activities.map((act) => (
                    <button
                      type="button"
                      key={act}
                      onClick={() => setNewActivity(act)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors border min-h-[40px] ${
                        newActivity === act
                          ? 'bg-[#0d9488] text-white border-[#0d9488]'
                          : 'bg-white text-[#335c5d] border-[#cce7e3] hover:border-[#8cd3ca]'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-7">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-3 bg-[#eaf6f4] text-[#0f3d3e] font-semibold rounded-xl hover:bg-[#d7f0ec] text-sm min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddReminder}
                className="flex-1 py-3 bg-[#0d9488] text-white font-semibold rounded-xl hover:bg-[#0f766e] text-sm min-h-[44px]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentReminders;