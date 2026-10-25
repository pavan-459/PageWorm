# Pageworm

A reading-habit app with a hungry bookworm mascot. Log the minutes you read to feed Pageworm, keep a daily streak so it grows, track the books you finish, and collect 43 badges.

- **Platforms:** iOS and Android (phones), built with Expo SDK 58 / React Native
- **Data:** stored only on the device (AsyncStorage). No accounts, no server, no analytics.
- **License:** proprietary, all rights reserved (see `LICENSE`)

## Project layout

| Path | What's there |
|---|---|
| `App.tsx` | App shell: boot intro, onboarding, tabs, timer, rewards queue, all state changes |
| `src/screens/` | Onboarding, Home, Stats, Trophies, Settings, ReadingTimer |
| `src/Worm.tsx` | The animated mascot (SVG) |
| `src/rewards.ts` | All 43 badges and the rules for unlocking them |
| `src/storage.ts` | Saved data model, streak and stat helpers |
| `src/notifications.ts` | Daily reminders (skipped once today's goal is met) |
| `assets/` | App icon, Android adaptive icon layers, splash, 3D icons (`icons3d/`, MIT) |
| `eas.json` | Cloud build profiles: `preview` (installable APK), `production` (store AAB) |

## Building for the stores

```bash
npx eas-cli@latest build -p android --profile preview      # APK to install and test
npx eas-cli@latest build -p android --profile production   # AAB for Google Play
```

---

# Testing locally

During development the app runs inside **Expo Go**, a free app that loads your code live from your Mac. You don't need an Apple Developer account to test.

All commands below run from this folder:

```bash
cd ~/Money/store-apps/pageworm
```

## Option A: iPhone simulator on your Mac

1. Start the dev server and open the simulator:

   ```bash
   npx expo start --ios
   ```

   The first run installs Expo Go on the simulator automatically.
2. If no phone window appears, open **Xcode → Open Developer Tool → DeviceHub**. (Xcode 27 renamed the old "Simulator" app to DeviceHub.)
3. Click to tap and click-and-drag to swipe or drag the slider.
4. Test on a regular iPhone such as the **iPhone 18 Pro** or **iPhone 17**. To pick one, press **Shift+I** in the terminal. Skip niche devices like the iPhone Duo; the app is designed for standard iPhone screens and doesn't support iPad.

Useful keys in the terminal while the server runs:

| Key | What it does |
|-----|--------------|
| `r` | Reload the app |
| `i` | Open on the iOS simulator again |
| `m` | Open the developer menu |
| `Ctrl+C` | Stop the server |

Simulator limits: no vibration (haptics), and notification behaviour can differ from a real phone.

## Option B: your own phone (iPhone or Android)

1. Install **Expo Go** from the App Store or Google Play.
2. Put the phone and Mac on the **same Wi‑Fi**.
3. Run `npx expo start`. A QR code appears in the terminal.
4. Scan it:
   - **iPhone:** with the normal Camera app, then tap the banner.
   - **Android:** with the **Scan QR code** button inside Expo Go.
5. If it hangs on "Loading…", stop the server and run `npx expo start --tunnel` instead (this works across networks).

Shake the phone to open the developer menu, which has a Reload button.

**Android + Expo Go:** daily reminders can't fire inside Expo Go on Android, because Expo removed the notification modules from it. The app detects this and skips them. Picking a reminder still works, and Settings shows a note. Reminders do work in the installed app (APK / Play Store). If you ever see "Cannot find native module" at launch, pull the latest code; older versions loaded the notifications library at startup.

## Demo mode (skip onboarding, sample history)

Demo mode starts the app with a name, a book in progress, three weeks of sample history and 10 of 15 minutes read today:

```bash
EXPO_PUBLIC_DEMO=1 npx expo start
```

It only works in development. It's ignored in store builds, and every launch starts fresh from the same sample data. The first feed in demo mode unlocks a batch of badges at once, so you can see the celebration sequence.

To see the intro again in normal mode, use **Settings → Replay the intro** (keeps your data) or **Settings → Reset all data** (erases everything). The blue gear floating on screen is Expo Go's developer menu, not part of the app.

## What to test

Start in **normal mode** (no demo) to experience it as a new user.

**0. Every launch: boot intro**
- [ ] On cold start, the worm pops up, then "Pageworm" and the tagline fade in (about 1.5 s), then the app opens
- [ ] Tapping the screen skips it

**1. First launch: intro (6 steps)**
- [ ] Shown on first launch, and once to anyone who finished the older intro (data kept, name and goal prefilled)
- [ ] Progress dots at the top; Back works on steps 2–5
- [ ] Welcome: the worm bobs, blinks and wears its cap
- [ ] Name: the keyboard opens, the button reads "Nice to meet you, <name>!", and Skip works with no name
- [ ] How it works: 3 cards (feed, streak, badges)
- [ ] Goal: picking a goal updates the hint line and the button ("15 minutes a day")
- [ ] Reminder: choosing a time asks for notification permission; "No reminders" skips
- [ ] All set: confetti and your name, goal and reminder summarized; "Start reading" opens Home

**2. Home (Home tab)**
- [ ] Greeting matches the time of day and uses your name; today's date shows under it
- [ ] Day 1: the speech bubble explains feeding and the book on the slider bounces as a hint
- [ ] Eyes follow your finger; tapping the worm makes it giggle with hearts
- [ ] Book card: "Add the book you're reading" opens a sheet; save a title and it shows "Currently reading"
- [ ] Quick buttons +5 / +10 / +15 feed instantly (book flies, chomp)
- [ ] The slider still works; "Added N min · Undo" appears after a feed and undoes it
- [ ] Reaching the goal: confetti, success buzz, the worm smiles
- [ ] The "next badge" pill (e.g. "2 more days in a row to Hatchling") opens Trophies
- [ ] After 6 PM with a streak and the goal not met, the bubble turns orange: "Read N more min to keep your X-day streak!"
- [ ] Small phones: the screen scrolls, but not while you drag the slider

**3. Reading timer**
- [ ] "Timer" opens the reading screen: the worm holds a book, with your book title above
- [ ] The screen doesn't dim or lock while the timer runs
- [ ] Pause and Resume work, and paused time isn't counted
- [ ] The "N more min to hit today's goal" line counts down live
- [ ] Close the app completely mid-session and reopen it: you're back in the timer with the correct time
- [ ] Cancel after 1+ minute asks "Discard this session?"
- [ ] Done logs the minutes, returns home and plays the chomp

**4. Books**
- [ ] Book card → "I finished it!" shows a "Book finished" celebration; the first one also earns "The End"
- [ ] The card goes back to "Add the book you're reading"
- [ ] Stats → Bookshelf lists finished books with dates

**5. Rewards (43 badges)**
- [ ] Each new badge pops up about a second after the action: spinning rays, confetti, the cheering worm, a buzz
- [ ] Several at once show in a row ("Yay! Next (N)"); Share opens the share sheet
- [ ] Trophies tab: 9 sections with counts; earned badges are gold with a check; locked ones show a lock and progress
- [ ] Tapping a badge opens details: how to earn it, progress, or the date earned
- [ ] Secret badges show "???" until found. Try reading at lunchtime, or petting the worm 50 times
- [ ] Each badge is celebrated only once

**6. Stats tab**
- [ ] Six tiles: current streak, best streak, last 7 days, all time, goal days, books finished
- [ ] The 7-day bar chart has a dashed goal line, and green bars where the goal was met
- [ ] The calendar shows leaves on goal days, outlines today, and moves between months (not into the future)
- [ ] Tapping a past day opens "Forgot to log?" with −15/−5/+5/+15 → Save updates the streak and the chart

**7. Settings tab**
- [ ] Change your name (Home greeting updates), goal and reminder
- [ ] "Tell a friend" opens the share sheet
- [ ] "Replay the intro" shows the intro again, prefilled with your name and goal, and your data is kept
- [ ] Reset asks for confirmation, erases everything and returns to the intro
- [ ] The version and credits show at the bottom

**8. Everyday edge cases**
- [ ] Leave the app open past midnight (or change the phone's date): reopening shows the new day at 0
- [ ] Close and reopen: everything is saved
- [ ] Android back button closes sheets and pop-ups instead of exiting the app

## Checks before committing changes

```bash
npx tsc --noEmit     # type errors
npx expo-doctor      # dependency / config problems
```

## Reporting a problem

Take a screenshot or screen recording (on the simulator: **⌘S** in DeviceHub, or run `xcrun simctl io booted screenshot ~/Desktop/shot.png`), then share the file path along with what you expected to happen.
