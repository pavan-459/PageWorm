import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '../ui';
import { Icon3D, IconName } from '../Icon3D';
import { Sheet } from '../Sheet';
import { colors, font } from '../theme';
import {
  AppState,
  bestStreak,
  currentStreak,
  dateKey,
  daysAgo,
  finishedBooks,
  formatMinutes,
  goalDays,
  parseKey,
  totalMinutes,
} from '../storage';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function Tile({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <Card style={styles.tile}>
      <Icon3D name={icon} size={30} />
      <Text style={styles.tileValue} maxFontSizeMultiplier={1.2}>
        {value}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </Card>
  );
}

function DaySheet({ dayKey, minutes, onSave, onClose }: { dayKey: string | null; minutes: number; onSave: (m: number) => void; onClose: () => void }) {
  const [m, setM] = useState(minutes);
  useEffect(() => setM(minutes), [dayKey, minutes]);
  const label = dayKey ? parseKey(dayKey).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : '';
  return (
    <Sheet visible={!!dayKey} title={label} onClose={onClose}>
      <Text style={font.small}>Forgot to log? Set how many minutes you read that day.</Text>
      <Text style={styles.dayBig}>
        {m}
        <Text style={styles.dayUnit}> min</Text>
      </Text>
      <View style={styles.stepRow}>
        {[-15, -5, +5, +15].map((d) => (
          <Button key={d} kind="chip" title={d > 0 ? `+${d}` : `${d}`} onPress={() => setM((v) => Math.max(0, Math.min(600, v + d)))} style={{ flex: 1 }} />
        ))}
      </View>
      <Button title="Save" onPress={() => onSave(m)} />
    </Sheet>
  );
}

export function Stats({ state, onSetDay }: { state: AppState; onSetDay: (dayKey: string, minutes: number) => void }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [editing, setEditing] = useState<string | null>(null);

  const goal = state.goalMinutes;
  const todayKey = dateKey();
  const week = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i));
  const weekMins = week.map((d) => state.log[dateKey(d)] ?? 0);
  const weekTotal = weekMins.reduce((a, b) => a + b, 0);
  const chartMax = Math.max(goal * 1.5, ...weekMins);

  const first = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const monthMins = cells.reduce((a, d) => a + (d ? state.log[dateKey(d)] ?? 0 : 0), 0);
  const isCurrentMonth = month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth();
  const shelf = finishedBooks(state).slice().reverse();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={font.title}>Your reading</Text>

        <View style={styles.tiles}>
          <Tile icon="fire" value={`${currentStreak(state)}`} label="Current streak" />
          <Tile icon="crown" value={`${bestStreak(state)}`} label="Best streak" />
          <Tile icon="chart" value={formatMinutes(weekTotal)} label="Last 7 days" />
          <Tile icon="books" value={formatMinutes(totalMinutes(state))} label="All time" />
          <Tile icon="target" value={`${goalDays(state)}`} label="Goal days" />
          <Tile icon="closedBook" value={`${shelf.length}`} label="Books finished" />
        </View>

        <Card style={styles.panel}>
          <Text style={styles.panelTitle}>Last 7 days</Text>
          <View style={styles.chart}>
            <View style={[styles.goalLine, { bottom: (goal / chartMax) * 120 + 20 }]}>
              <Text style={styles.goalLabel}>goal</Text>
            </View>
            {week.map((d, i) => {
              const m = weekMins[i];
              const met = m >= goal;
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barVal}>{m || ''}</Text>
                  <View style={[styles.bar, { height: Math.max(4, (m / chartMax) * 120) }, met ? styles.barMet : m > 0 && styles.barPartial]} />
                  <Text style={[styles.barDay, i === 6 && { color: colors.text, fontWeight: '800' }]}>{WEEKDAYS[d.getDay()]}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={styles.panel}>
          <View style={styles.monthHeader}>
            <Pressable hitSlop={12} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} accessibilityLabel="Previous month">
              <Text style={styles.arrow}>‹</Text>
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.panelTitle}>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
              <Text style={font.small}>{formatMinutes(monthMins)} read</Text>
            </View>
            <Pressable
              hitSlop={12}
              disabled={isCurrentMonth}
              onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              accessibilityLabel="Next month"
            >
              <Text style={[styles.arrow, isCurrentMonth && { opacity: 0.2 }]}>›</Text>
            </Pressable>
          </View>
          <View style={styles.weekHead}>
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={styles.weekHeadText}>
                {w}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((d, i) => {
              if (!d) return <View key={i} style={styles.cell} />;
              const k = dateKey(d);
              const m = state.log[k] ?? 0;
              const future = k > todayKey;
              return (
                <Pressable
                  key={i}
                  style={styles.cell}
                  disabled={future}
                  onPress={() => setEditing(k)}
                  accessibilityLabel={`${d.toDateString()}, ${m} minutes`}
                >
                  <View style={[styles.day, m >= goal ? styles.dayMet : m > 0 && styles.dayPartial, k === todayKey && styles.dayToday, future && { opacity: 0.35 }]}>
                    {m >= goal ? <Icon3D name="leaf" size={16} /> : <Text style={styles.dayNum}>{d.getDate()}</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Text style={[font.small, { textAlign: 'center', marginTop: 6 }]}>Tap a day to fix its minutes</Text>
        </Card>

        <Card style={styles.panel}>
          <Text style={styles.panelTitle}>Bookshelf</Text>
          {shelf.length === 0 ? (
            <Text style={[font.small, { marginTop: 6 }]}>Books you finish will line up here. Add yours from the home screen.</Text>
          ) : (
            shelf.map((b) => (
              <View key={b.id} style={styles.shelfRow}>
                <Icon3D name="closedBook" size={28} />
                <Text style={styles.shelfTitle} numberOfLines={1}>
                  {b.title}
                </Text>
                <Text style={font.small}>{parseKey(b.finishedOn!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      <DaySheet
        dayKey={editing}
        minutes={editing ? state.log[editing] ?? 0 : 0}
        onClose={() => setEditing(null)}
        onSave={(m) => {
          if (editing) onSetDay(editing, m);
          setEditing(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 14 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '31%', flexGrow: 1, padding: 12, alignItems: 'center', gap: 2 },
  tileValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  tileLabel: { fontSize: 11, color: colors.muted, textAlign: 'center' },
  panel: { padding: 16 },
  panelTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 170, marginTop: 8 },
  goalLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.accent },
  goalLabel: { position: 'absolute', right: 0, top: -16, fontSize: 10, color: colors.accentDark, fontWeight: '700' },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barVal: { fontSize: 10, color: colors.muted },
  bar: { width: 22, borderRadius: 8, backgroundColor: colors.track },
  barPartial: { backgroundColor: '#C5E1A5' },
  barMet: { backgroundColor: colors.worm, borderBottomWidth: 3, borderBottomColor: colors.wormDark },
  barDay: { fontSize: 12, color: colors.muted },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  arrow: { fontSize: 30, color: colors.text, fontWeight: '700', paddingHorizontal: 8 },
  weekHead: { flexDirection: 'row' },
  weekHeadText: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, color: colors.muted, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  day: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7EDDD' },
  dayPartial: { backgroundColor: '#DCEDC8' },
  dayMet: { backgroundColor: colors.worm },
  dayToday: { borderWidth: 2, borderColor: colors.accent },
  dayNum: { fontSize: 12, color: colors.text, fontWeight: '600' },
  dayBig: { fontSize: 48, fontWeight: '800', color: colors.text, textAlign: 'center' },
  dayUnit: { fontSize: 20, color: colors.muted },
  stepRow: { flexDirection: 'row', gap: 8 },
  shelfRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  shelfTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
});
