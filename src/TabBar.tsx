import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Icon3D, IconName } from './Icon3D';
import { colors } from './theme';

export type Tab = 'home' | 'stats' | 'trophies' | 'settings';

const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: 'home', label: 'Home', icon: 'house' },
  { key: 'stats', label: 'Stats', icon: 'chart' },
  { key: 'trophies', label: 'Trophies', icon: 'trophy' },
  { key: 'settings', label: 'Settings', icon: 'gear' },
];

export function TabBar({ tab, onChange, badgeDot }: { tab: Tab; onChange: (t: Tab) => void; badgeDot?: Tab | null }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((t) => {
        const active = t.key === tab;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t.label}
            onPress={() => {
              if (!active) Haptics.selectionAsync();
              onChange(t.key);
            }}
            style={styles.item}
          >
            <View style={[styles.pill, active && styles.pillActive]}>
              <Icon3D name={t.icon} size={active ? 30 : 26} style={!active ? { opacity: 0.55 } : undefined} />
              {badgeDot === t.key && <View style={styles.dot} />}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingTop: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#7A5A2E',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  pill: { width: 56, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: '#FFE9E1' },
  dot: { position: 'absolute', top: 4, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.card },
  label: { fontSize: 11, fontWeight: '600', color: colors.muted },
  labelActive: { color: colors.text, fontWeight: '800' },
});
