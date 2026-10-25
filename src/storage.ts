import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pageworm/state/v1';

export type Reminder = { hour: number; minute: number } | null;

export type Book = { id: string; title: string; startedOn: string; finishedOn?: string };

// A reading-timer session that survives the app being closed.
export type TimerState = { startedAt: number; pausedAt: number | null; pausedMs: number } | null;

// Bump when the intro changes so everyone sees the new one once.
export const INTRO_VERSION = 2;

export type AppState = {
  onboarded: boolean;
  // which intro this person last completed
  introVersion: number;
  name: string;
  goalMinutes: number;
  reminder: Reminder;
  // minutes read, keyed by local date "YYYY-MM-DD"
  log: Record<string, number>;
  // badge id -> date it was earned
  unlocked: Record<string, string>;
  books: Book[];
  currentBookId: string | null;
  timerSessions: number;
  pets: number;
  timer: TimerState;
  reviewAsked: boolean;
};

export const defaultState: AppState = {
  onboarded: false,
  introVersion: 0,
  name: '',
  goalMinutes: 15,
  reminder: null,
  log: {},
  unlocked: {},
  books: [],
  currentBookId: null,
  timerSessions: 0,
  pets: 0,
  timer: null,
  reviewAsked: false,
};

// Dev-only: `EXPO_PUBLIC_DEMO=1 npx expo start` skips onboarding with a 4-day streak.
function demoState(): AppState {
  const log: Record<string, number> = {};
  for (let i = 1; i <= 4; i++) log[dateKey(daysAgo(i))] = 15 + i * 5;
  log[dateKey(daysAgo(6))] = 5;
  for (let i = 9; i <= 20; i++) if (i % 3) log[dateKey(daysAgo(i))] = 10 + (i % 4) * 8;
  log[dateKey()] = 10;
  const book: Book = { id: 'demo', title: 'The Hobbit', startedOn: dateKey(daysAgo(5)) };
  return { ...defaultState, onboarded: true, introVersion: INTRO_VERSION, name: 'Reader', goalMinutes: 15, log, books: [book], currentBookId: book.id };
}

export async function loadState(): Promise<AppState> {
  if (__DEV__ && process.env.EXPO_PUBLIC_DEMO === '1') return demoState();
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
  } catch {
    return defaultState;
  }
}

export async function saveState(state: AppState) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // non-fatal: state stays in memory
  }
}

export function dateKey(d: Date = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseKey(k: string) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysAgo(n: number, from: Date = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d;
}

export function needsIntro(state: AppState) {
  return !state.onboarded || state.introVersion < INTRO_VERSION;
}

// Consecutive days hitting the goal. Today counts if met; if not met yet,
// the streak from yesterday is still alive.
export function currentStreak(state: AppState) {
  const met = (n: number) => (state.log[dateKey(daysAgo(n))] ?? 0) >= state.goalMinutes;
  let n = met(0) ? 0 : 1;
  let streak = 0;
  while (met(n)) {
    streak++;
    n++;
  }
  return streak;
}

export function bestStreak(state: AppState) {
  const days = Object.keys(state.log)
    .filter((k) => state.log[k] >= state.goalMinutes)
    .sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of days) {
    const d = parseKey(k);
    run = prev && dateKey(daysAgo(-1, prev)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return Math.max(best, currentStreak(state));
}

export function totalMinutes(state: AppState) {
  return Object.values(state.log).reduce((a, b) => a + b, 0);
}

export function goalDays(state: AppState) {
  return Object.values(state.log).filter((m) => m >= state.goalMinutes).length;
}

export function readingDays(state: AppState) {
  return Object.values(state.log).filter((m) => m > 0).length;
}

export function finishedBooks(state: AppState) {
  return state.books.filter((b) => b.finishedOn);
}

export function currentBook(state: AppState) {
  return state.books.find((b) => b.id === state.currentBookId && !b.finishedOn) ?? null;
}

export function timerElapsedMs(t: NonNullable<TimerState>, now = Date.now()) {
  return (t.pausedAt ?? now) - t.startedAt - t.pausedMs;
}

export function formatMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}
