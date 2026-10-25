import type { IconName } from './Icon3D';
import {
  AppState,
  bestStreak,
  currentStreak,
  dateKey,
  daysAgo,
  finishedBooks,
  goalDays,
  readingDays,
  totalMinutes,
} from './storage';

export type BadgeKind = 'firsts' | 'streak' | 'minutes' | 'goals' | 'books' | 'sessions' | 'habits' | 'secret' | 'meta';

export type Badge = {
  id: string;
  title: string;
  blurb: string;
  // what to do to earn it, shown on the shelf while locked
  how: string;
  icon: IconName;
  kind: BadgeKind;
  target: number;
};

// What just happened, for badges that depend on the moment rather than totals.
export type LogContext = { minutes: number; at: Date; source: 'feed' | 'timer' | 'edit'; before: number };

export const SECTIONS: { kind: BadgeKind; title: string }[] = [
  { kind: 'firsts', title: 'Firsts' },
  { kind: 'streak', title: 'Streaks' },
  { kind: 'minutes', title: 'Reading time' },
  { kind: 'goals', title: 'Daily goals' },
  { kind: 'books', title: 'Books finished' },
  { kind: 'sessions', title: 'Big sessions' },
  { kind: 'habits', title: 'Habits' },
  { kind: 'meta', title: 'Collector' },
  { kind: 'secret', title: 'Secret' },
];

const b = (kind: BadgeKind, id: string, title: string, icon: IconName, target: number, how: string, blurb: string): Badge => ({
  kind,
  id,
  title,
  icon,
  target,
  how,
  blurb,
});

export const BADGES: Badge[] = [
  b('firsts', 'first-bite', 'First Bite', 'party', 1, 'Feed Pageworm once', 'You fed Pageworm for the very first time.'),
  b('firsts', 'first-goal', 'Full Belly', 'sparkles', 1, 'Hit your daily goal', 'You hit your daily goal for the first time.'),
  b('firsts', 'first-timer', 'Focus Mode', 'timer', 1, 'Finish a reading-timer session', 'Your first timed reading session. Deep focus!'),
  b('firsts', 'first-book', 'Bookmark Set', 'bookmark', 1, 'Add the book you’re reading', 'You told Pageworm what you’re reading.'),

  b('streak', 'streak-3', 'Hatchling', 'seedling', 3, '3-day streak', '3 days in a row. A habit is hatching!'),
  b('streak', 'streak-7', 'One-Week Wonder', 'fire', 7, '7-day streak', 'A whole week of reading, every single day.'),
  b('streak', 'streak-14', 'Fortnight Bookworm', 'star', 14, '14-day streak', 'Two weeks straight. You are unstoppable.'),
  b('streak', 'streak-30', 'Monthly Muncher', 'medal', 30, '30-day streak', '30 days in a row. Reading is part of who you are now.'),
  b('streak', 'streak-60', 'Page Devourer', 'glowingStar', 60, '60-day streak', '60-day streak. Pageworm is in awe.'),
  b('streak', 'streak-100', 'Legendary Worm', 'crown', 100, '100-day streak', '100 days in a row. Absolute legend.'),
  b('streak', 'streak-365', 'Year of Reading', 'rainbow', 365, '365-day streak', 'A full year without missing a day. Unreal.'),

  b('minutes', 'mins-60', 'First Hour', 'book', 60, 'Read 1 hour in total', 'One full hour of reading, all yours.'),
  b('minutes', 'mins-300', 'Five-Hour Feast', 'books', 300, 'Read 5 hours in total', '5 hours of reading. That’s a whole book or two!'),
  b('minutes', 'mins-600', 'Ten-Hour Club', 'sportsMedal', 600, 'Read 10 hours in total', '10 hours spent between the pages.'),
  b('minutes', 'mins-1500', 'Bookshelf Hero', 'trophy', 1500, 'Read 25 hours in total', '25 hours of reading. Your shelf is proud.'),
  b('minutes', 'mins-3000', 'Rocket Reader', 'rocket', 3000, 'Read 50 hours in total', '50 hours. You’re reading at light speed.'),
  b('minutes', 'mins-6000', 'Gem of a Reader', 'gem', 6000, 'Read 100 hours in total', '100 hours of reading. Truly rare.'),
  b('minutes', 'mins-15000', 'Library Legend', 'gradCap', 15000, 'Read 250 hours in total', '250 hours. You could teach a class on reading.'),

  b('goals', 'goals-10', 'Goal Getter', 'target', 10, 'Hit your goal on 10 days', '10 days of hitting your goal.'),
  b('goals', 'goals-25', 'Sharp Shooter', 'ribbon', 25, 'Hit your goal on 25 days', '25 goals crushed.'),
  b('goals', 'goals-50', 'Half-Century', 'hundred', 50, 'Hit your goal on 50 days', '50 days of full bellies.'),
  b('goals', 'goals-100', 'Centurion', 'fireworks', 100, 'Hit your goal on 100 days', '100 goal days. Pageworm is very, very full.'),
  b('goals', 'goals-200', 'Goal Machine', 'glowingStar', 200, 'Hit your goal on 200 days', '200 goals. You don’t miss.'),

  b('books', 'books-1', 'The End', 'closedBook', 1, 'Finish a book', 'You finished a book. Take a bow!'),
  b('books', 'books-3', 'Hat Trick', 'books', 3, 'Finish 3 books', 'Three books down.'),
  b('books', 'books-10', 'Shelf Builder', 'trophy', 10, 'Finish 10 books', 'Ten finished books. That’s a real shelf.'),
  b('books', 'books-25', 'Walking Library', 'crown', 25, 'Finish 25 books', '25 books. You’re a walking library.'),

  b('sessions', 'deep-dive', 'Deep Dive', 'diving', 1, 'Log 30+ minutes at once', '30 minutes in one go. Deep reading!'),
  b('sessions', 'marathon', 'Marathon', 'hourglass', 1, 'Log 60 minutes at once', 'A full hour in one sitting.'),
  b('sessions', 'double-goal', 'Overachiever', 'rocket', 1, 'Read 2× your goal in a day', 'Double your goal in one day!'),
  b('sessions', 'triple-goal', 'Triple Feast', 'party', 1, 'Read 3× your goal in a day', 'Triple your goal. Pageworm can barely move.'),
  b('sessions', 'timer-10', 'Time Keeper', 'timer', 10, 'Finish 10 timer sessions', 'Ten focused timer sessions.'),

  b('habits', 'weekend', 'Weekend Warrior', 'calendar', 1, 'Hit your goal on a Saturday and Sunday', 'A whole weekend of reading.'),
  b('habits', 'comeback', 'Comeback Kid', 'butterfly', 1, 'Read again after 3+ days off', 'You came back. That’s what matters most.'),
  b('habits', 'days-30', 'Regular', 'leaf', 30, 'Read on 30 different days', '30 days of reading.'),
  b('habits', 'days-100', 'Lifelong Reader', 'sparklingHeart', 100, 'Read on 100 different days', '100 reading days. This is who you are.'),

  b('meta', 'collector-10', 'Collector', 'gift', 10, 'Earn 10 other badges', 'Ten badges on your shelf.'),
  b('meta', 'collector-25', 'Curator', 'gem', 25, 'Earn 25 other badges', '25 badges. Impressive collection!'),

  b('secret', 'early-bird', 'Early Bird', 'sunrise', 1, '???', 'Reading before 7 AM. The early worm gets the book.'),
  b('secret', 'night-owl', 'Night Owl', 'owl', 1, '???', 'Reading after 11 PM. Shh, the book is the only light.'),
  b('secret', 'lunch-break', 'Lunch Break', 'sandwich', 1, '???', 'Reading over lunch. Snack for the brain!'),
  b('secret', 'best-friends', 'Best Friends', 'heart', 50, '???', 'You petted Pageworm 50 times. It loves you.'),
  b('secret', 'new-year', 'Fresh Chapter', 'fireworks', 1, '???', 'Reading on New Year’s Day. What a start!'),
];

const isMeta = (x: Badge) => x.kind === 'meta';

function maxDayRatio(state: AppState) {
  return Math.max(0, ...Object.values(state.log)) / state.goalMinutes;
}

// Value toward a badge from saved state alone (0 for moment-based badges).
function value(state: AppState, x: Badge): number {
  switch (x.id) {
    case 'first-bite':
      return totalMinutes(state) > 0 ? 1 : 0;
    case 'first-goal':
      return goalDays(state) > 0 ? 1 : 0;
    case 'first-timer':
      return state.timerSessions;
    case 'first-book':
      return state.books.length;
    case 'double-goal':
      return maxDayRatio(state) >= 2 ? 1 : 0;
    case 'triple-goal':
      return maxDayRatio(state) >= 3 ? 1 : 0;
    case 'timer-10':
      return state.timerSessions;
    case 'best-friends':
      return state.pets;
  }
  switch (x.kind) {
    case 'streak':
      return bestStreak(state);
    case 'minutes':
      return totalMinutes(state);
    case 'goals':
      return goalDays(state);
    case 'books':
      return finishedBooks(state).length;
    case 'habits':
      return x.id.startsWith('days-') ? readingDays(state) : 0;
    case 'meta':
      return Object.keys(state.unlocked).filter((id) => !isMeta(badgeById(id) ?? x)).length;
  }
  return 0;
}

// Badges that depend on when/how something was logged.
function momentHit(state: AppState, x: Badge, ctx: LogContext): boolean {
  if (ctx.minutes <= 0) return false;
  const live = ctx.source !== 'edit';
  const h = ctx.at.getHours();
  const met = (d: Date) => (state.log[dateKey(d)] ?? 0) >= state.goalMinutes;
  switch (x.id) {
    case 'deep-dive':
      return live && ctx.minutes >= 30;
    case 'marathon':
      return live && ctx.minutes >= 60;
    case 'early-bird':
      return live && h >= 4 && h < 7;
    case 'night-owl':
      return live && (h >= 23 || h < 3);
    case 'lunch-break':
      return live && h >= 12 && h < 14;
    case 'new-year':
      return live && ctx.at.getMonth() === 0 && ctx.at.getDate() === 1;
    case 'weekend': {
      const today = ctx.at;
      return today.getDay() === 0 && met(today) && met(daysAgo(1, today));
    }
    case 'comeback': {
      if (!live || ctx.before > 0) return false;
      const gap = [1, 2, 3].every((n) => !(state.log[dateKey(daysAgo(n))] > 0));
      const earlier = Object.keys(state.log).some((k) => k < dateKey(daysAgo(3)) && state.log[k] > 0);
      return gap && earlier;
    }
  }
  return false;
}

export function progress(state: AppState, x: Badge) {
  const v = state.unlocked[x.id] ? x.target : value(state, x);
  return { value: Math.min(v, x.target), target: x.target };
}

// Badges earned by this state (and, optionally, the action that produced it)
// that haven't been awarded yet, in display order. Meta badges count the rest.
export function newlyUnlocked(state: AppState, ctx?: LogContext) {
  const fresh = BADGES.filter(
    (x) => !isMeta(x) && !state.unlocked[x.id] && (value(state, x) >= x.target || (ctx ? momentHit(state, x, ctx) : false)),
  );
  const owned = Object.keys(state.unlocked).filter((id) => !isMeta(badgeById(id)!)).length + fresh.length;
  const meta = BADGES.filter((x) => isMeta(x) && !state.unlocked[x.id] && owned >= x.target);
  return [...fresh, ...meta];
}

export function badgeById(id: string) {
  return BADGES.find((x) => x.id === id);
}

// The locked, non-secret badge you're closest to, for the home teaser.
export function nextBadge(state: AppState) {
  let best: { badge: Badge; left: string; ratio: number } | null = null;
  for (const x of BADGES) {
    if (state.unlocked[x.id] || x.kind === 'secret' || x.kind === 'meta' || x.target === 1) continue;
    if (x.kind === 'habits' && !x.id.startsWith('days-')) continue;
    const p = progress(state, x);
    const ratio = p.value / p.target;
    if (!best || ratio > best.ratio) {
      const remaining = p.target - p.value;
      const left =
        x.kind === 'streak'
          ? `${remaining} more day${remaining === 1 ? '' : 's'} in a row`
          : x.kind === 'minutes'
            ? `${remaining} more min`
            : x.kind === 'goals'
              ? `${remaining} more goal day${remaining === 1 ? '' : 's'}`
              : x.kind === 'books'
                ? `${remaining} more book${remaining === 1 ? '' : 's'}`
                : `${remaining} to go`;
      best = { badge: x, left, ratio };
    }
  }
  // streak badges use the current streak for the teaser, not the best one
  if (best?.badge.kind === 'streak') {
    const remaining = best.badge.target - currentStreak(state);
    best.left = `${remaining} more day${remaining === 1 ? '' : 's'} in a row`;
  }
  return best;
}

export { totalMinutes };
