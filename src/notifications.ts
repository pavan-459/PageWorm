import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import type * as NotificationsType from 'expo-notifications';
import { Reminder } from './storage';

// Expo Go on Android ships without parts of expo-notifications, and merely
// importing the library there crashes with "Cannot find native module".
// Reminders still work in real builds (APK / Play Store / App Store).
export const remindersUnavailable = Platform.OS === 'android' && isRunningInExpoGo();

let cached: typeof NotificationsType | null = null;

// Load lazily so the app can start even where the module is missing.
function notifications() {
  if (remindersUnavailable) return null;
  if (!cached) {
    cached = require('expo-notifications') as typeof NotificationsType;
    cached.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
  return cached;
}

export type ReminderResult = 'ok' | 'denied' | 'unavailable';

const MESSAGES = [
  { title: 'Pageworm is hungry 🐛', body: 'A few pages today keeps your streak alive.' },
  { title: 'Snack time? 📚', body: 'Pageworm would love a chapter. Even 5 minutes counts.' },
  { title: 'Your book misses you', body: 'Read a little, then feed Pageworm.' },
  { title: 'Psst… 🐛', body: 'Pageworm’s tummy is rumbling. Time for some pages?' },
];

// Days ahead to schedule. Individual reminders (instead of one repeating one)
// let us skip today once the goal is met. Refreshed whenever the app is used.
const DAYS_AHEAD = 14;

export async function scheduleReminder(
  reminder: Reminder,
  { skipToday = false, ask = true }: { skipToday?: boolean; ask?: boolean } = {},
): Promise<ReminderResult> {
  const Notifications = notifications();
  if (!Notifications) return 'unavailable';

  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!reminder) return 'ok';

  // Android 13+ needs a channel before the permission prompt can appear
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Daily reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const perm = ask ? await Notifications.requestPermissionsAsync() : await Notifications.getPermissionsAsync();
  const iosOk =
    perm.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    perm.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!perm.granted && !iosOk) return 'denied';

  const now = new Date();
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, reminder.hour, reminder.minute);
    if (at <= now || (i === 0 && skipToday)) continue;
    await Notifications.scheduleNotificationAsync({
      content: MESSAGES[at.getDate() % MESSAGES.length],
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'reminders' },
    });
  }
  return 'ok';
}

export function formatTime({ hour, minute }: { hour: number; minute: number }) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}
