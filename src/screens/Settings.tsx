import { ReactNode, useEffect, useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Button, Card } from '../ui';
import { Icon3D, IconName } from '../Icon3D';
import { colors, font } from '../theme';
import { AppState, Reminder } from '../storage';
import { formatTime, scheduleReminder } from '../notifications';
import { GOALS, REMINDER_TIMES } from './Onboarding';

function Section({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <Card style={styles.card}>
      <View style={styles.sectionHead}>
        <Icon3D name={icon} size={26} />
        <Text style={styles.section}>{title}</Text>
      </View>
      {children}
    </Card>
  );
}

export function Settings({
  state,
  onChange,
  onReset,
  onReplayIntro,
}: {
  state: AppState;
  onChange: (patch: Partial<AppState>) => void;
  onReset: () => void;
  onReplayIntro: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [name, setName] = useState(state.name);

  useEffect(() => setName(state.name), [state.name]);

  const setReminder = async (r: Reminder) => {
    const result = await scheduleReminder(r);
    if (result === 'denied') {
      onChange({ reminder: null });
      setNote(`Notifications are off for Pageworm. Turn them on in ${Platform.OS === 'ios' ? 'iPhone' : 'phone'} Settings → Pageworm.`);
    } else {
      onChange({ reminder: r });
      setNote(result === 'unavailable' && r ? 'Reminders don’t work inside Expo Go on Android. They will in the installed app.' : null);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={font.title}>Settings</Text>

        <Section icon="sparklingHeart" title="Your name">
          <TextInput
            value={name}
            onChangeText={setName}
            onEndEditing={() => onChange({ name: name.trim() })}
            placeholder="What should Pageworm call you?"
            placeholderTextColor={colors.muted}
            style={styles.input}
            maxLength={24}
            returnKeyType="done"
          />
        </Section>

        <Section icon="target" title="Daily goal">
          <View style={styles.grid}>
            {GOALS.map((g) => (
              <Button key={g} kind="chip" title={`${g} min`} onPress={() => onChange({ goalMinutes: g })} selected={state.goalMinutes === g} style={styles.cell} />
            ))}
          </View>
        </Section>

        <Section icon="bell" title="Daily reminder">
          <View style={styles.grid}>
            {REMINDER_TIMES.map((t) => {
              const on = state.reminder?.hour === t.hour && state.reminder?.minute === t.minute;
              return <Button key={formatTime(t)} kind="chip" title={formatTime(t)} onPress={() => setReminder(t)} selected={on} style={styles.cell} />;
            })}
            <Button kind="chip" title="Off" onPress={() => setReminder(null)} selected={!state.reminder} style={styles.cell} />
          </View>
          {note && <Text style={[font.small, { marginTop: 8 }]}>{note}</Text>}
        </Section>

        <Section icon="gift" title="Pageworm">
          <View style={{ gap: 4 }}>
            <Button
              kind="chip"
              title="Tell a friend"
              icon={<Icon3D name="heart" size={20} />}
              onPress={() => Share.share({ message: 'I’m building a daily reading habit with Pageworm, a hungry little bookworm that grows when I read. 🐛📚' })}
            />
            <Button kind="chip" title="Replay the intro" icon={<Icon3D name="party" size={20} />} onPress={onReplayIntro} />
          </View>
        </Section>

        <Section icon="lock" title="Privacy">
          <Text style={styles.body}>
            Pageworm keeps everything on this device: your name, reading history, books and badges. Nothing is collected, tracked or shared.
          </Text>
        </Section>

        <Section icon="closedBook" title="Data">
          {confirmReset ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.body}>Erase all reading history, books and badges and start over? This can’t be undone.</Text>
              <Button title="Yes, erase everything" onPress={onReset} />
              <Button kind="chip" title="Cancel" onPress={() => setConfirmReset(false)} />
            </View>
          ) : (
            <Button kind="chip" title="Reset all data" onPress={() => setConfirmReset(true)} />
          )}
        </Section>

        <Text style={styles.footer}>
          Pageworm {Constants.expoConfig?.version ?? ''}
          {'\n'}3D icons: Microsoft Fluent Emoji (MIT License)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 14 },
  card: { padding: 16, gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  section: { fontSize: 17, fontWeight: '800', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '31%', paddingHorizontal: 0 },
  input: {
    backgroundColor: colors.bg,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.chipEdge,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    color: colors.text,
  },
  body: { fontSize: 15, color: colors.text, lineHeight: 21 },
  footer: { fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 18 },
});
