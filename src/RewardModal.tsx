import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Share, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, Path, RadialGradient, Stop, Circle } from 'react-native-svg';
import { Badge, BadgeKind } from './rewards';
import { Icon3D } from './Icon3D';
import { Confetti, ConfettiHandle } from './Confetti';
import { Worm } from './Worm';
import { Button } from './ui';
import { colors } from './theme';

const RAYS = 14;

const KIND_LABEL: Record<BadgeKind, string> = {
  firsts: 'FIRST-TIME BADGE',
  streak: 'STREAK BADGE',
  minutes: 'READING BADGE',
  goals: 'GOAL BADGE',
  books: 'BOOK BADGE',
  sessions: 'SESSION BADGE',
  habits: 'HABIT BADGE',
  meta: 'COLLECTOR BADGE',
  secret: 'SECRET BADGE',
};

// Spinning sunburst behind the badge.
function Rays({ size }: { size: number }) {
  const c = size / 2;
  const wedge = (Math.PI * 2) / RAYS;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFF3B0" stopOpacity="1" />
          <Stop offset="1" stopColor="#FFF3B0" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {Array.from({ length: RAYS }).map((_, i) => {
        const a = i * wedge;
        const b = a + wedge / 2;
        return (
          <Path
            key={i}
            d={`M${c} ${c} L${c + Math.cos(a) * c} ${c + Math.sin(a) * c} L${c + Math.cos(b) * c} ${c + Math.sin(b) * c} Z`}
            fill="#FFD36B"
            opacity={0.45}
          />
        );
      })}
      <Circle cx={c} cy={c} r={c * 0.62} fill="url(#glow)" />
    </Svg>
  );
}

export function RewardModal({ badge, segments, remaining, onClose }: { badge: Badge | null; segments: number; remaining: number; onClose: () => void }) {
  const pop = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const confetti = useRef<ConfettiHandle>(null);

  useEffect(() => {
    if (!badge) return;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const t = setTimeout(() => confetti.current?.burst(), 250);
    const spinLoop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }));
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    spinLoop.start();
    floatLoop.start();
    return () => {
      clearTimeout(t);
      spinLoop.stop();
      floatLoop.stop();
    };
  }, [badge, pop, spin, float]);

  if (!badge) return null;

  const kicker = badge.id.startsWith('book-') ? 'BOOK FINISHED' : `${KIND_LABEL[badge.kind]} UNLOCKED`;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: pop,
              transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
            },
          ]}
        >
          <Text style={styles.kicker}>{kicker}</Text>
          <View style={styles.stage}>
            <Animated.View style={[StyleSheet.absoluteFill, styles.center, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
              <Rays size={250} />
            </Animated.View>
            <Animated.View style={{ transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }] }}>
              <Icon3D name={badge.icon} size={130} />
            </Animated.View>
            <Confetti ref={confetti} />
          </View>
          <Text style={styles.title}>{badge.title}</Text>
          <Text style={styles.blurb}>{badge.blurb}</Text>
          <View style={styles.wormRow}>
            <Worm segments={segments} happy size={150} />
          </View>
          <View style={styles.actions}>
            <Button
              kind="chip"
              title="Share"
              onPress={() => Share.share({ message: `I just earned the “${badge.title}” badge on Pageworm! ${badge.blurb} 🐛📚` })}
              style={{ flex: 1 }}
            />
            <Button title={remaining > 0 ? `Yay! Next (${remaining})` : 'Yay!'} onPress={onClose} style={{ flex: 1.6 }} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(59,47,47,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bg,
    borderRadius: 32,
    padding: 22,
    alignItems: 'center',
    borderBottomWidth: 6,
    borderBottomColor: colors.chipEdge,
  },
  kicker: { fontSize: 13, fontWeight: '800', letterSpacing: 1.2, color: colors.accentDark },
  stage: { width: 250, height: 220, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  center: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center' },
  blurb: { fontSize: 16, color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 22 },
  wormRow: { marginVertical: 10 },
  actions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
});
