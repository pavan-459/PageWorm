import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from './theme';
import { Icon3D } from './Icon3D';

const MAX = 60;
const STEP = 5;
const THUMB = 56;

type Props = {
  onChange: (minutes: number) => void;
  onRelease: (minutes: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  // nudge new users: the book bounces until their first feed
  hint?: boolean;
};

// Drag the book to the right to choose minutes; let go to feed.
export function FeedSlider(props: Props) {
  const [width, setWidth] = useState(0);
  const [x, setX] = useState(0);
  const widthRef = useRef(0);
  const lastStep = useRef(0);
  const startX = useRef(0);
  const xRef = useRef(0);
  const nudge = useRef(new Animated.Value(0)).current;
  // the pan responder is created once, so read the latest callbacks through a ref
  const cb = useRef(props);
  cb.current = props;

  useEffect(() => {
    if (!props.hint) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(nudge, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(nudge, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(700),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [props.hint, nudge]);

  const toMinutes = (px: number) => {
    const usable = widthRef.current - THUMB;
    if (usable <= 0) return 0;
    return Math.round(((px / usable) * MAX) / STEP) * STEP;
  };

  const move = (px: number) => {
    const clamped = Math.max(0, Math.min(widthRef.current - THUMB, px));
    xRef.current = clamped;
    setX(clamped);
    const mins = toMinutes(clamped);
    if (mins !== lastStep.current) {
      lastStep.current = mins;
      Haptics.selectionAsync();
      cb.current.onChange(mins);
    }
  };

  const finish = () => {
    const mins = toMinutes(xRef.current);
    xRef.current = 0;
    lastStep.current = 0;
    setX(0);
    cb.current.onChange(0);
    cb.current.onDragEnd?.();
    cb.current.onRelease(mins);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startX.current = xRef.current;
        cb.current.onDragStart?.();
      },
      onPanResponderMove: (_, g) => move(startX.current + g.dx),
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    }),
  ).current;

  // screen readers: swipe up/down to pick minutes, double-tap to feed
  const usable = Math.max(1, width - THUMB);
  const stepTo = (mins: number) => move((Math.max(0, Math.min(MAX, mins)) / MAX) * usable);

  const mins = toMinutes(x);
  const fill = width ? (x + THUMB / 2) / width : 0;

  return (
    <View>
      <Text style={styles.label}>{mins > 0 ? `Feed ${mins} min` : 'Drag the book to feed →'}</Text>
      <View
        style={styles.track}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
          setWidth(e.nativeEvent.layout.width);
        }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Feed Pageworm"
        accessibilityValue={{ text: mins > 0 ? `${mins} minutes` : 'Swipe up to choose minutes' }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') stepTo(mins + STEP);
          if (e.nativeEvent.actionName === 'decrement') stepTo(mins - STEP);
          if (e.nativeEvent.actionName === 'activate' && mins > 0) finish();
        }}
      >
        <View style={[styles.fill, { width: `${fill * 100}%` }]} />
        {[15, 30, 45, 60].map((t) => (
          <Text key={t} style={[styles.tick, { left: ((width - THUMB) * t) / MAX + THUMB / 2 - 10 }]}>
            {t}
          </Text>
        ))}
        <Animated.View
          {...pan.panHandlers}
          hitSlop={16}
          style={[
            styles.thumb,
            {
              transform: [
                { translateX: nudge.interpolate({ inputRange: [0, 1], outputRange: [x, x + (props.hint && x === 0 ? 26 : 0)] }) },
                { scale: mins > 0 ? 1.1 : 1 },
              ],
            },
          ]}
        >
          <Icon3D name="book" size={34} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  track: { height: THUMB, borderRadius: THUMB / 2, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.track, justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: THUMB / 2, backgroundColor: '#DCEDC8' },
  tick: { position: 'absolute', width: 20, textAlign: 'center', fontSize: 11, color: colors.muted },
  thumb: {
    position: 'absolute',
    width: THUMB - 4,
    height: THUMB - 4,
    borderRadius: (THUMB - 4) / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    borderBottomWidth: 4,
    borderBottomColor: colors.accentDark,
  },
});
