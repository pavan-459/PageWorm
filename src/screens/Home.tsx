import { ComponentRef, useEffect, useRef, useState } from 'react';
import { Animated, Easing, GestureResponderEvent, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Worm, WormHandle } from '../Worm';
import { FeedSlider } from '../FeedSlider';
import { Confetti, ConfettiHandle } from '../Confetti';
import { Button, Card } from '../ui';
import { Icon3D } from '../Icon3D';
import { colors, font } from '../theme';
import { AppState, currentBook, currentStreak, dateKey, totalMinutes } from '../storage';
import { nextBadge } from '../rewards';

const QUICK = [5, 10, 15];

function greeting(name: string) {
  const h = new Date().getHours();
  const part = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${part}, ${name}` : part;
}

export function Home({
  state,
  onLog,
  onPet,
  onOpenBook,
  onOpenTrophies,
  onStartTimer,
  celebrate,
}: {
  state: AppState;
  onLog: (minutes: number) => void;
  onPet: () => void;
  onOpenBook: () => void;
  onOpenTrophies: () => void;
  onStartTimer: () => void;
  // set when returning from the timer with a fresh log, so Home can play the feed animation
  celebrate?: { minutes: number; at: number } | null;
}) {
  const worm = useRef<WormHandle>(null);
  const confetti = useRef<ConfettiHandle>(null);
  const wormBox = useRef<ComponentRef<typeof View>>(null);
  const wormCenter = useRef({ x: 0, y: 0 });
  const flight = useRef(new Animated.Value(0)).current;
  const [flying, setFlying] = useState(false);
  const [lastAdd, setLastAdd] = useState<number | null>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [pending, setPending] = useState(0);
  const [dragging, setDragging] = useState(false);
  const lookReset = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { width, height } = useWindowDimensions();

  const today = state.log[dateKey()] ?? 0;
  const goal = state.goalMinutes;
  const done = today >= goal;
  const streak = currentStreak(state);
  const progress = Math.min(1, today / goal);
  const firstTime = totalMinutes(state) === 0;
  const book = currentBook(state);
  const next = nextBadge(state);
  const hour = new Date().getHours();
  const atRisk = streak > 0 && !done && hour >= 18;
  const wormSize = Math.min(width * 0.68, height < 740 ? 200 : 250);

  let message: string;
  if (pending > 0) message = 'Ooh, yummy…';
  else if (atRisk) message = `Read ${goal - today} more min to keep your ${streak}-day streak!`;
  else if (done && today >= goal * 2) message = 'Stuffed! You doubled your goal today.';
  else if (done) message = 'Full and happy! Tap me.';
  else if (firstTime) message = 'Hi! I eat pages. Read a bit, then feed me below.';
  else if (today === 0) message = "I'm hungry… feed me some pages.";
  else message = `${goal - today} more min to fill me up!`;

  const reactToLog = (m: number, before: number) => {
    worm.current?.chomp();
    if (before < goal && before + m >= goal) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => confetti.current?.burst(), 150);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  useEffect(() => {
    if (celebrate) setTimeout(() => reactToLog(celebrate.minutes, today - celebrate.minutes), 300);
    // only when a new timer result arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrate]);

  const feed = (m: number) => {
    if (m <= 0 || flying) return;
    const before = today;
    setFlying(true);
    flight.setValue(0);
    Animated.timing(flight, { toValue: 1, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setFlying(false);
      onLog(m);
      setLastAdd(m);
      reactToLog(m, before);
    });
  };

  // eyes follow any finger on screen, then drift back to center
  const track = (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    const c = wormCenter.current;
    setLook({ x: (pageX - c.x) / 150, y: (pageY - c.y) / 250 });
    if (lookReset.current) clearTimeout(lookReset.current);
  };
  const release = () => {
    if (lookReset.current) clearTimeout(lookReset.current);
    lookReset.current = setTimeout(() => setLook({ x: 0, y: 0 }), 700);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']} onTouchStart={track} onTouchMove={track} onTouchEnd={release}>
      <ScrollView contentContainerStyle={styles.scroll} scrollEnabled={!dragging} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello} numberOfLines={1}>
              {greeting(state.name)}
            </Text>
            <Text style={font.small}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <Card style={styles.streak}>
            <Icon3D name="fire" size={24} style={streak === 0 ? { opacity: 0.4 } : undefined} />
            <Text style={styles.streakText}>{streak}</Text>
          </Card>
        </View>

        <View style={styles.hero}>
          <View style={[styles.bubble, atRisk && styles.bubbleWarn]}>
            <Text style={[styles.bubbleText, atRisk && { color: '#9A3412' }]}>{message}</Text>
          </View>
          <View
            ref={wormBox}
            style={{ marginVertical: 6 }}
            onLayout={() =>
              wormBox.current?.measureInWindow((x, y, w, h) => {
                wormCenter.current = { x: x + w * 0.75, y: y + h * 0.4 };
              })
            }
          >
            <Worm ref={worm} segments={streak + 1} happy={done} size={wormSize} look={look} mouthOpen={pending / 40} onPet={onPet} />
            <Confetti ref={confetti} />
          </View>
          <Text style={styles.big} maxFontSizeMultiplier={1.2}>
            {today}
            <Text style={styles.of}> / {goal} min today</Text>
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
          {next && (
            <Pressable onPress={onOpenTrophies} style={({ pressed }) => [styles.nextPill, pressed && { opacity: 0.7 }]} accessibilityRole="button">
              <Icon3D name={next.badge.icon} size={22} />
              <Text style={styles.nextText} numberOfLines={1}>
                {next.left} to <Text style={{ fontWeight: '800' }}>{next.badge.title}</Text>
              </Text>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={onOpenBook} accessibilityRole="button" style={({ pressed }) => pressed && { transform: [{ scale: 0.98 }] }}>
          <Card style={styles.bookCard}>
            <Icon3D name={book ? 'closedBook' : 'bookmark'} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={font.small}>{book ? 'Currently reading' : 'No book yet'}</Text>
              <Text style={styles.bookTitle} numberOfLines={1}>
                {book ? book.title : 'Add the book you’re reading'}
              </Text>
            </View>
            <Text style={styles.bookAction}>{book ? 'Finished?' : 'Add'}</Text>
          </Card>
        </Pressable>

        <View style={styles.quickRow}>
          <Button kind="chip" title="Timer" icon={<Icon3D name="timer" size={22} />} onPress={onStartTimer} style={{ flex: 1.4 }} />
          {QUICK.map((m) => (
            <Button key={m} kind="chip" title={`+${m}`} onPress={() => feed(m)} style={{ flex: 1 }} />
          ))}
        </View>

        <FeedSlider
          onChange={setPending}
          onRelease={feed}
          onDragStart={() => setDragging(true)}
          onDragEnd={() => setDragging(false)}
          hint={firstTime}
        />
        {lastAdd !== null && (
          <Pressable
            onPress={() => {
              onLog(-lastAdd);
              setLastAdd(null);
            }}
            style={styles.undo}
            accessibilityRole="button"
          >
            <Text style={styles.undoText}>
              Added {lastAdd} min · <Text style={{ color: colors.accentDark, fontWeight: '800' }}>Undo</Text>
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {flying && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flyer,
            {
              opacity: flight.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
              transform: [
                { translateX: flight.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }) },
                { translateY: flight.interpolate({ inputRange: [0, 1], outputRange: [0, -360] }) },
                { scale: flight.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.4] }) },
                { rotate: flight.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-200deg'] }) },
              ],
            },
          ]}
        >
          <Icon3D name="book" size={44} />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8 },
  hello: { fontSize: 24, fontWeight: '800', color: colors.text },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  streakText: { fontSize: 18, fontWeight: '800', color: colors.text },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  bubble: { backgroundColor: colors.card, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14, maxWidth: '90%' },
  bubbleWarn: { backgroundColor: '#FFEDD5' },
  bubbleText: { fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center' },
  big: { fontSize: 44, fontWeight: '800', color: colors.text },
  of: { fontSize: 18, fontWeight: '600', color: colors.muted },
  track: { width: '100%', height: 14, borderRadius: 7, backgroundColor: colors.track, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.worm, borderRadius: 7 },
  nextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#FFF4D6',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    maxWidth: '100%',
  },
  nextText: { fontSize: 14, color: colors.text, flexShrink: 1 },
  chev: { fontSize: 18, color: colors.muted, fontWeight: '700' },
  bookCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  bookTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  bookAction: { fontSize: 14, fontWeight: '800', color: colors.accentDark },
  quickRow: { flexDirection: 'row', gap: 8 },
  undo: { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 10 },
  undoText: { fontSize: 14, color: colors.muted },
  flyer: { position: 'absolute', left: '45%', bottom: 90 },
});
