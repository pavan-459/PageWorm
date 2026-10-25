import { useEffect, useRef, useState } from 'react';
import { AppState as RNAppState, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as StoreReview from 'expo-store-review';
import {
  AppState,
  Book,
  INTRO_VERSION,
  currentBook,
  currentStreak,
  dateKey,
  defaultState,
  loadState,
  needsIntro,
  saveState,
  totalMinutes,
} from './src/storage';
import { scheduleReminder } from './src/notifications';
import { Badge, LogContext, newlyUnlocked } from './src/rewards';
import { Onboarding } from './src/screens/Onboarding';
import { Home } from './src/screens/Home';
import { Stats } from './src/screens/Stats';
import { Settings } from './src/screens/Settings';
import { ReadingTimer } from './src/screens/ReadingTimer';
import { Trophies } from './src/screens/Trophies';
import { RewardModal } from './src/RewardModal';
import { BootIntro } from './src/BootIntro';
import { BookSheet } from './src/BookSheet';
import { Tab, TabBar } from './src/TabBar';
import { colors } from './src/theme';

// lets the feed animation and goal confetti finish before a badge pops up
const REWARD_DELAY = 1100;
// badges after which we ask (once) for a store rating: a happy moment
const REVIEW_AFTER = new Set(['streak-7', 'goals-10', 'books-1']);

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const stateRef = useRef<AppState>(defaultState);
  const [tab, setTab] = useState<Tab>('home');
  const [celebrate, setCelebrate] = useState<{ minutes: number; at: number } | null>(null);
  const [rewardQueue, setRewardQueue] = useState<Badge[]>([]);
  const [showReward, setShowReward] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [, setTick] = useState(0);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    loadState().then((s) => {
      stateRef.current = s;
      setState(s);
    });
  }, []);

  // keep reminders accurate and "today" fresh when the app comes back (e.g. after midnight)
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (st) => {
      if (st !== 'active') return;
      setTick((t) => t + 1);
      refreshReminders(stateRef.current);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (rewardQueue.length === 0 || showReward) return;
    const t = setTimeout(() => setShowReward(true), REWARD_DELAY);
    return () => clearTimeout(t);
  }, [rewardQueue, showReward]);

  function refreshReminders(s: AppState) {
    if (!s.onboarded || !s.reminder) return;
    scheduleReminder(s.reminder, { ask: false, skipToday: (s.log[dateKey()] ?? 0) >= s.goalMinutes });
  }

  // Every change goes through here: badges are awarded, then the state is saved.
  const commit = (next: AppState, ctx?: LogContext, extra: Badge[] = []) => {
    const fresh = newlyUnlocked(next, ctx);
    if (fresh.length) {
      const k = dateKey();
      next = { ...next, unlocked: { ...next.unlocked, ...Object.fromEntries(fresh.map((b) => [b.id, k])) } };
    }
    if (fresh.length || extra.length) setRewardQueue((q) => [...q, ...extra, ...fresh]);
    stateRef.current = next;
    setState(next);
    saveState(next);
    return next;
  };

  const patch = (p: Partial<AppState>) => commit({ ...stateRef.current, ...p });

  const setDay = (k: string, minutes: number, source: LogContext['source']) => {
    const s = stateRef.current;
    const before = s.log[k] ?? 0;
    const next = commit({ ...s, log: { ...s.log, [k]: Math.max(0, minutes) } }, { minutes: minutes - before, at: new Date(), source, before });
    if (k === dateKey()) refreshReminders(next);
  };

  const log = (m: number, source: LogContext['source'] = 'feed') => {
    const k = dateKey();
    setDay(k, (stateRef.current.log[k] ?? 0) + m, source);
  };

  const saveBook = (title: string) => {
    const s = stateRef.current;
    const cur = currentBook(s);
    if (cur) {
      patch({ books: s.books.map((b) => (b.id === cur.id ? { ...b, title } : b)) });
    } else {
      const book: Book = { id: String(Date.now()), title, startedOn: dateKey() };
      patch({ books: [...s.books, book], currentBookId: book.id });
    }
    setBookOpen(false);
  };

  const finishBook = () => {
    const s = stateRef.current;
    const cur = currentBook(s);
    if (!cur) return;
    const cheer: Badge = {
      id: `book-${cur.id}`,
      kind: 'books',
      title: 'Book finished!',
      blurb: `You finished “${cur.title}”. What will Pageworm munch on next?`,
      how: '',
      icon: 'closedBook',
      target: 1,
    };
    commit({ ...s, books: s.books.map((b) => (b.id === cur.id ? { ...b, finishedOn: dateKey() } : b)), currentBookId: null }, undefined, [cheer]);
    setBookOpen(false);
  };

  const closeReward = async () => {
    const shown = rewardQueue[0];
    setShowReward(false);
    setRewardQueue((q) => q.slice(1));
    if (shown && REVIEW_AFTER.has(shown.id) && !stateRef.current.reviewAsked) {
      patch({ reviewAsked: true });
      try {
        if (await StoreReview.isAvailableAsync()) setTimeout(() => StoreReview.requestReview(), 800);
      } catch {
        // the store sheet is best-effort
      }
    }
  };

  let screen = null;
  let showTabs = false;
  if (!booted) {
    screen = <BootIntro onDone={() => setBooted(true)} />;
  } else if (!state) {
    screen = null;
  } else if (needsIntro(state)) {
    screen = (
      <Onboarding
        initialName={state.name}
        initialGoal={state.goalMinutes}
        onDone={(name, goalMinutes, reminder) => {
          patch({ onboarded: true, introVersion: INTRO_VERSION, name, goalMinutes, reminder });
          setTab('home');
        }}
      />
    );
  } else if (state.timer) {
    const t = state.timer;
    screen = (
      <ReadingTimer
        timer={t}
        segments={currentStreak(state) + 1}
        bookTitle={currentBook(state)?.title}
        todayMinutes={state.log[dateKey()] ?? 0}
        goal={state.goalMinutes}
        onPause={() => patch({ timer: { ...t, pausedAt: Date.now() } })}
        onResume={() => patch({ timer: { ...t, pausedAt: null, pausedMs: t.pausedMs + (Date.now() - (t.pausedAt ?? Date.now())) } })}
        onCancel={() => patch({ timer: null })}
        onFinish={(m) => {
          stateRef.current = { ...stateRef.current, timer: null, timerSessions: stateRef.current.timerSessions + 1 };
          log(m, 'timer');
          setCelebrate({ minutes: m, at: Date.now() });
          setTab('home');
        }}
      />
    );
  } else {
    showTabs = true;
    if (tab === 'stats') screen = <Stats state={state} onSetDay={(k, m) => setDay(k, m, 'edit')} />;
    else if (tab === 'trophies') screen = <Trophies state={state} />;
    else if (tab === 'settings')
      screen = (
        <Settings
          state={state}
          onChange={(p) => {
            const next = patch(p);
            if ('goalMinutes' in p) refreshReminders(next);
          }}
          onReplayIntro={() => patch({ onboarded: false })}
          onReset={() => {
            scheduleReminder(null);
            setRewardQueue([]);
            commit(defaultState);
            setTab('home');
          }}
        />
      );
    else
      screen = (
        <Home
          state={state}
          celebrate={celebrate}
          onLog={(m) => log(m)}
          onPet={() => patch({ pets: stateRef.current.pets + 1 })}
          onOpenBook={() => setBookOpen(true)}
          onOpenTrophies={() => setTab('trophies')}
          onStartTimer={() => {
            setCelebrate(null);
            patch({ timer: { startedAt: Date.now(), pausedAt: null, pausedMs: 0 } });
          }}
        />
      );
  }

  const reward = showReward && booted && state && !needsIntro(state) && !state.timer ? rewardQueue[0] ?? null : null;
  const book = state ? currentBook(state) : null;
  const bookMinutes = state && book ? totalMinutes({ ...state, log: Object.fromEntries(Object.entries(state.log).filter(([k]) => k >= book.startedOn)) }) : 0;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1 }}>{screen}</View>
        {showTabs && <TabBar tab={tab} onChange={setTab} />}
      </View>
      <BookSheet visible={bookOpen} book={book} minutesWithBook={bookMinutes} onSave={saveBook} onFinish={finishBook} onClose={() => setBookOpen(false)} />
      <RewardModal badge={reward} segments={state ? currentStreak(state) + 1 : 1} remaining={rewardQueue.length - 1} onClose={closeReward} />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
