import { CheckInNotificationSettings } from '../types';

const SETTINGS_STORAGE_KEY = 'mindguard_checkin_notification_settings';
export const IN_APP_NUDGE_EVENT = 'mindguard:checkin-nudge';

export type BrowserPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

const DEFAULT_SETTINGS: CheckInNotificationSettings = {
  enabled: false,
  preferredTime: '19:00',
  cadence: 'every_day',
  customMessage: 'Time for a gentle 30-second wellness & stress check-in.',
  lastNotifiedDate: null,
};

let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function getTodayLocalDateKey(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function loadCheckInNotificationSettings(): CheckInNotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS };

    const preferredTime =
      typeof parsed.preferredTime === 'string' && /^\d{2}:\d{2}$/.test(parsed.preferredTime)
        ? parsed.preferredTime
        : DEFAULT_SETTINGS.preferredTime;

    return {
      enabled: Boolean(parsed.enabled),
      preferredTime,
      cadence: parsed.cadence === 'weekdays' ? 'weekdays' : 'every_day',
      customMessage:
        typeof parsed.customMessage === 'string' && parsed.customMessage.trim()
          ? parsed.customMessage.trim().slice(0, 140)
          : DEFAULT_SETTINGS.customMessage,
      lastNotifiedDate:
        typeof parsed.lastNotifiedDate === 'string' ? parsed.lastNotifiedDate : null,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveCheckInNotificationSettings(
  settings: CheckInNotificationSettings
): CheckInNotificationSettings {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
  return settings;
}

export function getBrowserNotificationPermission(): BrowserPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register('/notification-sw.js', { scope: '/' })
      .catch(() => null);
  }
  return swRegistrationPromise;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      await registerNotificationServiceWorker();
    }
    return result;
  } catch {
    return Notification.permission;
  }
}

export function formatTime12Hour(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function getNextScheduledNudgeLabel(
  settings: CheckInNotificationSettings,
  now: Date = new Date()
): string {
  if (!settings.enabled) return 'Paused';

  const [prefH, prefM] = settings.preferredTime.split(':').map(Number);
  if (!Number.isFinite(prefH) || !Number.isFinite(prefM)) return 'Scheduled';

  const todayKey = getTodayLocalDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = prefH * 60 + prefM;

  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    const dayOfWeek = candidate.getDay(); // 0=Sun, 6=Sat

    if (settings.cadence === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) {
      continue;
    }

    if (offset === 0) {
      if (settings.lastNotifiedDate === todayKey || nowMinutes > targetMinutes) {
        continue;
      }
      return `Today at ${formatTime12Hour(settings.preferredTime)}`;
    }

    if (offset === 1) {
      return `Tomorrow at ${formatTime12Hour(settings.preferredTime)}`;
    }

    const dayLabel = candidate.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayLabel} at ${formatTime12Hour(settings.preferredTime)}`;
  }

  return formatTime12Hour(settings.preferredTime);
}

export interface NudgeDeliveryResult {
  browserNotificationSent: boolean;
  inAppBannerTriggered: boolean;
  reason?: string;
}

export async function dispatchCheckInNotification(options: {
  studentName?: string;
  customMessage?: string;
  isTest?: boolean;
  onOpenCheckIn?: () => void;
}): Promise<NudgeDeliveryResult> {
  const name = options.studentName?.trim();
  const greeting = name ? `Hi ${name}` : 'MindGuard Check-In';
  const title = options.isTest
    ? `${greeting} · Test Check-In Nudge`
    : `${greeting} · Daily Check-In`;
  const body =
    options.customMessage?.trim() ||
    DEFAULT_SETTINGS.customMessage;

  let browserNotificationSent = false;
  let reason: string | undefined;

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        const reg = await registerNotificationServiceWorker();
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            body,
            tag: options.isTest ? 'mindguard-test-nudge' : 'mindguard-daily-checkin',
            data: { url: '/?view=stress-checkin' },
          });
          browserNotificationSent = true;
        } else {
          const notif = new Notification(title, {
            body,
            tag: options.isTest ? 'mindguard-test-nudge' : 'mindguard-daily-checkin',
          });
          notif.onclick = () => {
            window.focus();
            options.onOpenCheckIn?.();
            notif.close();
          };
          browserNotificationSent = true;
        }
      } catch {
        reason = 'Browser blocked popup notification in this embedded view; in-app nudge shown instead.';
      }
    } else {
      reason =
        Notification.permission === 'denied'
          ? 'Browser notifications are blocked in site settings; in-app nudge shown instead.'
          : 'Browser notification permission not granted yet; in-app nudge shown instead.';
    }
  } else {
    reason = 'Browser Notifications API is not supported here; in-app nudge shown instead.';
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(IN_APP_NUDGE_EVENT, {
        detail: {
          title,
          body,
          isTest: Boolean(options.isTest),
        },
      })
    );
  }

  return {
    browserNotificationSent,
    inAppBannerTriggered: true,
    reason,
  };
}

/**
 * Checks whether the scheduled daily check-in nudge is due right now.
 * Fires once per local calendar day once the preferred time is reached (within a 3-hour window).
 */
export async function checkAndTriggerDueNudge(studentName?: string): Promise<boolean> {
  const settings = loadCheckInNotificationSettings();
  if (!settings.enabled) return false;

  const now = new Date();
  const dayOfWeek = now.getDay();
  if (settings.cadence === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return false;
  }

  const todayKey = getTodayLocalDateKey(now);
  if (settings.lastNotifiedDate === todayKey) {
    return false;
  }

  const [prefH, prefM] = settings.preferredTime.split(':').map(Number);
  if (!Number.isFinite(prefH) || !Number.isFinite(prefM)) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = prefH * 60 + prefM;

  // Trigger if we are at or past the preferred time (within a 180-minute catch-up window)
  if (nowMinutes >= targetMinutes && nowMinutes <= targetMinutes + 180) {
    saveCheckInNotificationSettings({
      ...settings,
      lastNotifiedDate: todayKey,
    });

    await dispatchCheckInNotification({
      studentName,
      customMessage: settings.customMessage,
      isTest: false,
    });
    return true;
  }

  return false;
}
