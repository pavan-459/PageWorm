import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../ui';
import { Icon3D } from '../Icon3D';
import { Sheet } from '../Sheet';
import { colors, font } from '../theme';
import { AppState, formatMinutes, parseKey, totalMinutes } from '../storage';
import { BADGES, Badge, SECTIONS, progress } from '../rewards';

function unit(b: Badge, v: number) {
  if (b.kind === 'streak') return `${v} / ${b.target} days`;
  if (b.kind === 'minutes') return `${formatMinutes(v)} / ${formatMinutes(b.target)}`;
  if (b.target > 1) return `${v} / ${b.target}`;
  return '';
}

function earnedOn(date: string) {
  return parseKey(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function Trophies({ state }: { state: AppState }) {
  const [open, setOpen] = useState<Badge | null>(null);
  const earned = BADGES.filter((b) => state.unlocked[b.id]).length;
  const openGot = open ? state.unlocked[open.id] : undefined;
  const openHidden = open?.kind === 'secret' && !openGot;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={font.title}>Trophy shelf</Text>
        <Card style={styles.summary}>
          <Icon3D name="trophy" size={56} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.summaryBig}>
              {earned} of {BADGES.length} badges
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${(earned / BADGES.length) * 100}%` }]} />
            </View>
            <Text style={font.small}>{formatMinutes(totalMinutes(state))} read in total</Text>
          </View>
        </Card>

        {SECTIONS.map((s) => {
          const list = BADGES.filter((b) => b.kind === s.kind);
          const got = list.filter((b) => state.unlocked[b.id]).length;
          return (
            <View key={s.kind}>
              <View style={styles.sectionRow}>
                <Text style={styles.section}>{s.title}</Text>
                <Text style={font.small}>
                  {got}/{list.length}
                </Text>
              </View>
              <View style={styles.grid}>
                {list.map((b) => {
                  const on = !!state.unlocked[b.id];
                  const hidden = b.kind === 'secret' && !on;
                  const p = progress(state, b);
                  return (
                    <Pressable key={b.id} style={styles.tileWrap} onPress={() => setOpen(b)} accessibilityLabel={hidden ? 'Secret badge' : b.title}>
                      <Card style={{ ...styles.tile, ...(on ? styles.tileGot : null) }}>
                        <View style={styles.iconWrap}>
                          {hidden ? (
                            <Text style={styles.mystery}>?</Text>
                          ) : (
                            <Icon3D name={b.icon} size={50} style={on ? undefined : styles.lockedIcon} />
                          )}
                          {!on && (
                            <View style={styles.lockBadge}>
                              <Icon3D name="lock" size={18} />
                            </View>
                          )}
                        </View>
                        <Text style={[styles.tileTitle, !on && { color: colors.muted }]} numberOfLines={2}>
                          {hidden ? '???' : b.title}
                        </Text>
                        {on ? (
                          <Icon3D name="check" size={16} />
                        ) : hidden ? null : p.target > 1 ? (
                          <View style={styles.miniTrack}>
                            <View style={[styles.fill, { width: `${(p.value / p.target) * 100}%` }]} />
                          </View>
                        ) : null}
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Sheet visible={!!open} title={openHidden ? 'Secret badge' : open?.title ?? ''} onClose={() => setOpen(null)}>
        {open && (
          <View style={{ alignItems: 'center', gap: 8, paddingBottom: 8 }}>
            {openHidden ? <Text style={[styles.mystery, { fontSize: 72 }]}>?</Text> : <Icon3D name={open.icon} size={110} style={openGot ? undefined : { opacity: 0.35 }} />}
            <Text style={styles.sheetBlurb}>{openHidden ? 'Keep reading in different ways to discover this one.' : openGot ? open.blurb : open.how}</Text>
            {openGot ? (
              <Text style={styles.earned}>Earned {earnedOn(openGot)}</Text>
            ) : (
              !openHidden && open.target > 1 && <Text style={font.small}>{unit(open, progress(state, open).value)}</Text>
            )}
          </View>
        )}
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginTop: 12 },
  summaryBig: { fontSize: 20, fontWeight: '800', color: colors.text },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 22, marginBottom: 10 },
  section: { fontSize: 18, fontWeight: '700', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tileWrap: { width: '31%' },
  tile: { padding: 10, alignItems: 'center', gap: 6, minHeight: 132 },
  tileGot: { backgroundColor: '#FFF4D6', borderBottomColor: '#F2C94C' },
  iconWrap: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  lockedIcon: { opacity: 0.25 },
  lockBadge: { position: 'absolute', right: -4, bottom: -4 },
  mystery: { fontSize: 40, fontWeight: '900', color: colors.chipEdge },
  tileTitle: { fontSize: 12, fontWeight: '800', color: colors.text, textAlign: 'center', minHeight: 30 },
  track: { width: '100%', height: 8, borderRadius: 4, backgroundColor: colors.track, overflow: 'hidden' },
  miniTrack: { width: '100%', height: 6, borderRadius: 3, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.worm },
  sheetBlurb: { fontSize: 17, color: colors.text, textAlign: 'center', lineHeight: 24 },
  earned: { fontSize: 14, color: colors.accentDark, fontWeight: '800' },
});
