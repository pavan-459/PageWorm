import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Icon3D, IconName } from './Icon3D';

export type ConfettiHandle = { burst: () => void };

const PIECES: IconName[] = ['leaf', 'books', 'sparkles', 'leaf', 'star', 'book', 'leaf', 'sparkles', 'heart', 'leaf', 'trophy', 'sparkles', 'leaf', 'star', 'seedling', 'sparkles'];

// Celebration burst from the center of its parent.
export const Confetti = forwardRef<ConfettiHandle>((_, ref) => {
  const progress = useRef(new Animated.Value(0)).current;
  const [shots, setShots] = useState<{ dx: number; dy: number; spin: number }[]>([]);

  useImperativeHandle(ref, () => ({
    burst: () => {
      setShots(
        PIECES.map((_, i) => {
          const angle = (i / PIECES.length) * Math.PI * 2 + Math.random() * 0.4;
          const dist = 110 + Math.random() * 90;
          return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist - 60, spin: (Math.random() - 0.5) * 720 };
        }),
      );
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() =>
        setShots([]),
      );
    },
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {shots.map((s, i) => (
        <Animated.View
          key={i}
          style={[
            styles.piece,
            {
              opacity: progress.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, s.dx] }) },
                // rise out, then fall a little with "gravity"
                { translateY: progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, s.dy, s.dy + 70] }) },
                { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${s.spin}deg`] }) },
              ],
            },
          ]}
        >
          <Icon3D name={PIECES[i]} size={30} />
        </Animated.View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  piece: { position: 'absolute', left: '50%', top: '45%', marginLeft: -13 },
});
