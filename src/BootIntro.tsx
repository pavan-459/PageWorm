import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Worm } from './Worm';
import { Icon3D } from './Icon3D';
import { colors } from './theme';

const LENGTH = 1700;

// Short branded intro on every cold start: Pageworm pops up out of its books,
// then the name fades in. Same background as the native splash, so the handoff
// looks seamless. Tap anywhere to skip.
export function BootIntro({ onDone }: { onDone: () => void }) {
  const pop = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    Animated.timing(out, { toValue: 0, duration: 220, useNativeDriver: true }).start(onDone);
  };

  useEffect(() => {
    Animated.sequence([
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(text, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    const t = setTimeout(finish, LENGTH);
    return () => clearTimeout(t);
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable style={styles.root} onPress={finish} accessibilityLabel="Pageworm. Tap to continue.">
      <Animated.View style={[styles.center, { opacity: out }]}>
        <View style={styles.stage}>
          <Animated.View
            style={{
              opacity: pop,
              transform: [
                { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }) },
                { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
              ],
            }}
          >
            <Worm segments={3} happy size={230} />
          </Animated.View>
          <Icon3D name="books" size={120} style={styles.books} />
        </View>
        <Animated.View style={{ opacity: text, transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <Text style={styles.name}>Pageworm</Text>
          <Text style={styles.tag}>Feed me pages. Grow a reading habit.</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stage: { alignItems: 'center', marginBottom: 24 },
  books: { marginTop: -36 },
  name: { fontSize: 40, fontWeight: '900', color: colors.text, textAlign: 'center', letterSpacing: 0.5 },
  tag: { fontSize: 16, color: colors.muted, textAlign: 'center', marginTop: 6 },
});
