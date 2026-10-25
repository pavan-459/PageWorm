import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { Worm } from '../Worm';
import { Button } from '../ui';
import { Icon3D } from '../Icon3D';
import { colors, font } from '../theme';
import { TimerState, timerElapsedMs } from '../storage';

// Elapsed time comes from saved timestamps, so it stays correct if the app is
// backgrounded or even closed mid-session.
export function ReadingTimer({
  timer,
  segments,
  bookTitle,
  todayMinutes,
  goal,
  onPause,
  onResume,
  onFinish,
  onCancel,
}: {
  timer: NonNullable<TimerState>;
  segments: number;
  bookTitle?: string;
  todayMinutes: number;
  goal: number;
  onPause: () => void;
  onResume: () => void;
  onFinish: (minutes: number) => void;
  onCancel: () => void;
}) {
  useKeepAwake();
  const [now, setNow] = useState(Date.now());
  const [confirmCancel, setConfirmCancel] = useState(false);
  const paused = timer.pausedAt !== null;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const secs = Math.max(0, Math.floor(timerElapsedMs(timer, now) / 1000));
  const h = Math.floor(secs / 3600);
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  const minutes = Math.max(1, Math.round(secs / 60));
  const tooShort = secs < 30;
  const sessionMin = Math.floor(secs / 60);
  const left = goal - todayMinutes - sessionMin;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <Text style={font.small}>{paused ? 'Paused' : 'Reading together…'}</Text>
        {bookTitle && (
          <View style={styles.bookRow}>
            <Icon3D name="closedBook" size={20} />
            <Text style={styles.bookTitle} numberOfLines={1}>
              {bookTitle}
            </Text>
          </View>
        )}
        <View style={{ marginVertical: 24, opacity: paused ? 0.6 : 1 }}>
          <Worm segments={segments} happy={false} reading={!paused} size={280} />
        </View>
        <Text style={styles.time} maxFontSizeMultiplier={1.1}>
          {h > 0 ? `${h}:` : ''}
          {mm}:{ss}
        </Text>
        <Text style={styles.goal}>{left > 0 ? `${left} more min to hit today’s goal` : 'Goal reached! Keep going if you like.'}</Text>
      </View>

      {confirmCancel ? (
        <View style={{ gap: 6 }}>
          <Text style={[font.body, { textAlign: 'center' }]}>Discard this {sessionMin > 0 ? `${sessionMin}-minute ` : ''}session?</Text>
          <Button title="Discard" onPress={onCancel} />
          <Button kind="chip" title="Keep reading" onPress={() => setConfirmCancel(false)} />
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          <View style={styles.row}>
            <Button
              kind="chip"
              title={paused ? 'Resume' : 'Pause'}
              icon={<Icon3D name={paused ? 'book' : 'hourglass'} size={22} />}
              onPress={paused ? onResume : onPause}
              style={{ flex: 1 }}
            />
            <Button
              title={tooShort ? 'Keep reading…' : `Done · ${minutes} min`}
              onPress={() => !tooShort && onFinish(minutes)}
              style={{ flex: 1.4, ...(tooShort ? { opacity: 0.5 } : null) }}
            />
          </View>
          <Button kind="ghost" title="Cancel" onPress={() => (secs >= 60 ? setConfirmCancel(true) : onCancel())} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bookRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, maxWidth: '90%' },
  bookTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flexShrink: 1 },
  time: { fontSize: 68, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  goal: { fontSize: 15, color: colors.muted, marginTop: 4, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10 },
});
