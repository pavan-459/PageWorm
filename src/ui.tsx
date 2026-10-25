import { ReactNode, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from './theme';

const DEPTH = 5;

// Chunky "3D" button: a darker base sits under the face, and the face
// sinks onto it while pressed.
export function Button({
  title,
  onPress,
  kind = 'primary',
  style,
  icon,
  selected = false,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'chip';
  style?: ViewStyle;
  icon?: ReactNode;
  selected?: boolean;
}) {
  const press = useRef(new Animated.Value(0)).current;
  const to = (v: number) => Animated.timing(press, { toValue: v, duration: 70, useNativeDriver: true }).start();

  if (kind === 'ghost') {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.6 }, style]}>
        <Text style={[styles.text, { color: colors.muted }]}>{title}</Text>
      </Pressable>
    );
  }

  const primary = kind === 'primary';
  return (
    <Pressable
      onPressIn={() => {
        to(1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => to(0)}
      onPress={onPress}
      style={[{ paddingBottom: DEPTH }, style]}
    >
      <View style={[styles.base, { backgroundColor: primary || selected ? colors.accentDark : colors.chipEdge }]} />
      <Animated.View
        style={[
          styles.face,
          primary ? styles.primary : styles.chip,
          selected && styles.selected,
          { transform: [{ translateY: press.interpolate({ inputRange: [0, 1], outputRange: [0, DEPTH] }) }] },
        ]}
      >
        {/* top sheen sells the rounded, glossy surface */}
        <View pointerEvents="none" style={[styles.sheen, { backgroundColor: primary ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.9)' }]} />
        <View style={styles.content}>
          {icon}
          <Text style={[styles.text, !primary && { color: colors.text }]}>{title}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// Soft raised card used for panels.
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: { position: 'absolute', left: 0, right: 0, top: DEPTH, bottom: 0, borderRadius: 18 },
  face: { borderRadius: 18, paddingVertical: 15, paddingHorizontal: 18, overflow: 'hidden' },
  primary: { backgroundColor: colors.accent },
  chip: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.chipEdge },
  selected: { backgroundColor: '#FFE9E1', borderColor: colors.accent },
  sheen: { position: 'absolute', left: 6, right: 6, top: 3, height: '42%', borderRadius: 14 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ghost: { paddingVertical: 14, alignItems: 'center' },
  text: { color: '#fff', fontSize: 18, fontWeight: '800' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderBottomWidth: 4,
    borderBottomColor: colors.chipEdge,
    shadowColor: '#7A5A2E',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
});
