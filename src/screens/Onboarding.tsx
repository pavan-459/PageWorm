import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Worm } from '../Worm';
import { Button, Card } from '../ui';
import { Icon3D, IconName } from '../Icon3D';
import { Confetti, ConfettiHandle } from '../Confetti';
import { colors, font } from '../theme';
import { Reminder } from '../storage';
import { formatTime, scheduleReminder } from '../notifications';

export const GOALS = [5, 10, 15, 20, 30, 45];
export const REMINDER_TIMES = [
  { hour: 7, minute: 30 },
  { hour: 12, minute: 30 },
  { hour: 18, minute: 0 },
  { hour: 20, minute: 0 },
  { hour: 21, minute: 30 },
];

const GOAL_HINT: Record<number, string> = {
  5: 'A tiny start. Perfect for busy days.',
  10: 'About 4–5 pages. Easy to keep up.',
  15: 'A chapter-ish a day. Most people pick this.',
  20: 'Solid! Around a book a month.',
  30: 'Serious reader. Several books a month.',
  45: 'Bookworm mode. Wow.',
};

const HOW: { icon: IconName; title: string; text: string }[] = [
  { icon: 'book', title: 'Read, then feed', text: 'After reading, drag the book to Pageworm or start the timer while you read.' },
  { icon: 'fire', title: 'Hit your goal daily', text: 'Every day you reach your goal, your streak grows, and so does Pageworm.' },
  { icon: 'trophy', title: 'Collect badges', text: '40+ badges for streaks, hours, finished books, and a few secret surprises.' },
];

const STEPS = 6;

export function Onboarding({
  initialName = '',
  initialGoal = 15,
  onDone,
}: {
  initialName?: string;
  initialGoal?: number;
  onDone: (name: string, goal: number, reminder: Reminder) => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [goal, setGoal] = useState(initialGoal);
  const [reminder, setReminder] = useState<Reminder>(null);
  const fade = useRef(new Animated.Value(1)).current;
  const confetti = useRef<ConfettiHandle>(null);

  const go = (n: number) => {
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(n);
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  useEffect(() => {
    if (step === STEPS - 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const t = setTimeout(() => confetti.current?.burst(), 300);
      return () => clearTimeout(t);
    }
  }, [step]);

  const pickReminder = async (t: Reminder) => {
    const result = t ? await scheduleReminder(t) : 'ok';
    setReminder(result === 'denied' ? null : t);
    go(5);
  };

  const who = name.trim();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.top}>
        {step > 0 && step < STEPS - 1 ? (
          <Pressable onPress={() => go(step - 1)} hitSlop={12} accessibilityLabel="Back">
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
        ) : (
          <View style={{ width: 60 }} />
        )}
        <View style={styles.dots}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotOn, i < step && styles.dotDone]} />
          ))}
        </View>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.page, { opacity: fade }]}>
          {step === 0 && (
            <>
              <View style={styles.center}>
                <Worm segments={3} happy size={260} />
                <Text style={[styles.title, styles.mid]}>Meet Pageworm</Text>
                <Text style={[styles.sub, styles.mid]}>A hungry little bookworm who eats the pages you read. Feed it every day and watch it grow.</Text>
              </View>
              <Button title="Hi, Pageworm!" onPress={() => go(1)} />
            </>
          )}

          {step === 1 && (
            <>
              <View>
                <Worm segments={2} happy={false} size={170} look={{ x: 0.3, y: 0.4 }} />
                <Text style={[styles.title, { marginTop: 12 }]}>What should Pageworm call you?</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your first name"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  autoFocus
                  maxLength={24}
                  returnKeyType="next"
                  onSubmitEditing={() => go(2)}
                />
              </View>
              <View style={{ gap: 4 }}>
                <Button title={who ? `Nice to meet you, ${who}!` : 'Continue'} onPress={() => go(2)} />
                {!who && <Button kind="ghost" title="Skip" onPress={() => go(2)} />}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <View style={{ gap: 12 }}>
                <Text style={styles.title}>How it works</Text>
                {HOW.map((h) => (
                  <Card key={h.title} style={styles.howCard}>
                    <Icon3D name={h.icon} size={46} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.howTitle}>{h.title}</Text>
                      <Text style={font.small}>{h.text}</Text>
                    </View>
                  </Card>
                ))}
              </View>
              <Button title="Got it" onPress={() => go(3)} />
            </>
          )}

          {step === 3 && (
            <>
              <View>
                <Icon3D name="target" size={64} style={{ marginBottom: 12 }} />
                <Text style={styles.title}>Pick a daily reading goal</Text>
                <Text style={[font.small, { marginTop: 8 }]}>Start small. You can change it anytime.</Text>
                <View style={styles.grid}>
                  {GOALS.map((g) => (
                    <Button key={g} kind="chip" title={`${g} min`} onPress={() => setGoal(g)} selected={goal === g} style={styles.cell} />
                  ))}
                </View>
                <Text style={styles.hint}>{GOAL_HINT[goal]}</Text>
              </View>
              <Button title={`${goal} minutes a day`} onPress={() => go(4)} />
            </>
          )}

          {step === 4 && (
            <>
              <View>
                <Icon3D name="bell" size={64} style={{ marginBottom: 12 }} />
                <Text style={styles.title}>When should Pageworm nudge you?</Text>
                <Text style={[font.small, { marginTop: 8 }]}>One gentle reminder a day, only if you haven’t read yet. People who set one keep their streak much longer.</Text>
                <View style={{ marginTop: 20, gap: 4 }}>
                  {REMINDER_TIMES.map((t) => (
                    <Button key={formatTime(t)} kind="chip" title={formatTime(t)} onPress={() => pickReminder(t)} />
                  ))}
                </View>
              </View>
              <Button kind="ghost" title="No reminders" onPress={() => pickReminder(null)} />
            </>
          )}

          {step === 5 && (
            <>
              <View style={styles.center}>
                <View>
                  <Worm segments={4} happy size={260} />
                  <Confetti ref={confetti} />
                </View>
                <Text style={[styles.title, styles.mid]}>{who ? `You’re all set, ${who}!` : 'You’re all set!'}</Text>
                <Text style={[styles.sub, styles.mid]}>
                  Goal: {goal} min a day{reminder ? ` · Reminder at ${formatTime(reminder)}` : ''}
                  {'\n'}Read a little today, then come back and feed Pageworm.
                </Text>
              </View>
              <Button title="Start reading" icon={<Icon3D name="book" size={24} />} onPress={() => onDone(who, goal, reminder)} />
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, height: 40 },
  back: { fontSize: 17, fontWeight: '700', color: colors.muted, width: 60 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.chipEdge },
  dotOn: { width: 22, backgroundColor: colors.accent },
  dotDone: { backgroundColor: colors.worm },
  page: { flex: 1, padding: 24, paddingTop: 12, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: colors.text },
  sub: { fontSize: 17, color: colors.muted, lineHeight: 24 },
  mid: { textAlign: 'center', marginTop: 14 },
  input: {
    marginTop: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.chipEdge,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    color: colors.text,
  },
  howCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  howTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  cell: { width: '31%', paddingHorizontal: 0 },
  hint: { fontSize: 15, color: colors.text, marginTop: 14, textAlign: 'center', fontWeight: '600' },
});
