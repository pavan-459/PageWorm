import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { Icon3D } from './Icon3D';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, Ellipse, Path, G, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from './theme';

export type WormHandle = { chomp: () => void; pet: () => void };

type Props = {
  // body segments behind the head; grows with the streak
  segments: number;
  happy: boolean;
  size?: number;
  // where the eyes look, each axis -1..1
  look?: { x: number; y: number };
  // 0 = closed, 1 = wide open (while dragging food toward it)
  mouthOpen?: number;
  reading?: boolean;
  onPet?: () => void;
};

const SEG = 34;
const INK = '#120A06';
const MOUTH = '#5A2328';
const TONGUE = '#FF8C9A';
const HEARTS = 5;

export const Worm = forwardRef<WormHandle, Props>(
  ({ segments, happy, size = 260, look = { x: 0, y: 0 }, mouthOpen = 0, reading = false, onPet }, ref) => {
    const bob = useRef(new Animated.Value(0)).current;
    const squish = useRef(new Animated.Value(1)).current;
    const wiggle = useRef(new Animated.Value(0)).current;
    const hearts = useRef(Array.from({ length: HEARTS }, () => new Animated.Value(0))).current;
    const [blink, setBlink] = useState(false);
    const [giggling, setGiggling] = useState(false);
    const [readX, setReadX] = useState(-1);

    useEffect(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }, [bob]);

    // blink every few seconds at a slightly random rhythm
    useEffect(() => {
      let t: ReturnType<typeof setTimeout>;
      const schedule = () => {
        t = setTimeout(() => {
          setBlink(true);
          setTimeout(() => setBlink(false), 130);
          schedule();
        }, 2200 + Math.random() * 2800);
      };
      schedule();
      return () => clearTimeout(t);
    }, []);

    // eyes scan across the page while reading
    useEffect(() => {
      if (!reading) return;
      const id = setInterval(() => setReadX((x) => (x >= 1 ? -1 : x + 0.25)), 280);
      return () => clearInterval(id);
    }, [reading]);

    const chomp = () => {
      Animated.sequence([
        Animated.timing(squish, { toValue: 1.15, duration: 120, useNativeDriver: true }),
        Animated.spring(squish, { toValue: 1, friction: 3, tension: 120, useNativeDriver: true }),
      ]).start();
    };

    const pet = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      setGiggling(true);
      setTimeout(() => setGiggling(false), 1200);
      Animated.sequence(
        [1, -1, 1, -1, 0].map((v) => Animated.timing(wiggle, { toValue: v, duration: 90, useNativeDriver: true })),
      ).start();
      hearts.forEach((h, i) => {
        h.setValue(0);
        Animated.timing(h, { toValue: 1, duration: 900, delay: i * 90, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      });
    };

    useImperativeHandle(ref, () => ({ chomp, pet }));

    const n = Math.max(1, Math.min(segments, 7));
    // head overlaps the last body segment so the worm reads as one piece
    const headX = 30 + (n - 1) * (SEG - 6) + 38;
    const width = headX + 44;
    const height = 130;
    const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
    const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] });

    const lx = reading ? readX : Math.max(-1, Math.min(1, look.x));
    const ly = reading ? 0.8 : Math.max(-1, Math.min(1, look.y));
    const m = reading ? 0 : Math.max(0, Math.min(1, mouthOpen));
    const arcEyes = !reading && m < 0.05 && (giggling || (happy && look.x === 0 && look.y === 0));

    const eye = (cx: number) => {
      if (blink) return <Path d={`M${cx - 8} 56 Q${cx} 58.5 ${cx + 8} 56`} stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round" />;
      if (arcEyes)
        return <Path d={`M${cx - 5.5} 58 Q${cx} 50.5 ${cx + 5.5} 58`} stroke={INK} strokeWidth={2.8} fill="none" strokeLinecap="round" />;
      const ix = cx + lx * 4;
      const iy = 57 + ly * 4;
      return (
        <G>
          <Circle cx={ix} cy={iy} r={6.4} fill="url(#iris)" />
          <Circle cx={ix} cy={iy} r={3.7} fill={INK} />
          <Circle cx={ix - 2.2} cy={iy - 2.4} r={2} fill="#fff" />
          <Circle cx={ix + 2.2} cy={iy + 2.2} r={0.9} fill="#fff" />
        </G>
      );
    };

    let mouth;
    if (m >= 0.05) {
      const ry = 2 + 9 * m;
      mouth = (
        <G>
          <Ellipse cx={headX} cy={80} rx={6 + 7 * m} ry={ry} fill={MOUTH} />
          <Ellipse cx={headX} cy={83 + 5 * m} rx={3 + 4 * m} ry={1 + 3 * m} fill={TONGUE} />
          <Rect x={headX - 2.6} y={80 - ry + 0.3} width={5.2} height={4.4} rx={1.2} fill="#fff" />
        </G>
      );
    } else if (happy || giggling) {
      // the icon's cheeky grin with a buck tooth
      mouth = (
        <G>
          <Path d={`M${headX - 14.4} 74 Q${headX} 91 ${headX + 16} 72.7 Q${headX + 0.3} 79.8 ${headX - 14.4} 74 Z`} fill={MOUTH} />
          <Path d={`M${headX - 7.7} 83.4 Q${headX} 80.4 ${headX + 8} 82.8 Q${headX + 0.6} 87.4 ${headX - 7.7} 83.4 Z`} fill={TONGUE} />
          <Rect x={headX - 2.8} y={75.5} width={5.8} height={5.2} rx={1.4} fill="#fff" />
          <Path d={`M${headX - 14.4} 74 Q${headX + 0.3} 79.8 ${headX + 16} 72.7`} stroke={colors.wormDark} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </G>
      );
    } else {
      mouth = (
        <G>
          <Rect x={headX - 2.2} y={78.4} width={4.4} height={3.8} rx={1} fill="#fff" stroke={MOUTH} strokeWidth={0.8} />
          <Path d={`M${headX - 7} 77 Q${headX} 81.5 ${headX + 7} 77`} stroke={MOUTH} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        </G>
      );
    }

    // giggling raises both brows; otherwise one is cocked up for a cheeky look
    const browL = giggling ? 33 : 36;
    const browR = giggling ? 30 : 32;

    return (
      <Pressable
        onPress={() => {
          pet();
          onPet?.();
        }}
        disabled={reading}
        accessibilityLabel="Pageworm. Tap to pet."
      >
        <Animated.View style={{ width: size, height: (size * height) / width, transform: [{ translateY }, { scale: squish }, { rotate }] }}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
            <Defs>
              {/* same lighting as the app icon: key light top-left, warm rim light bottom-right */}
              <RadialGradient id="skin" cx="32%" cy="28%" r="80%">
                <Stop offset="0" stopColor="#E4F5C6" />
                <Stop offset="0.35" stopColor="#A8D86E" />
                <Stop offset="0.8" stopColor="#6FAE35" />
                <Stop offset="1" stopColor="#3F7A1C" />
              </RadialGradient>
              <RadialGradient id="skin2" cx="32%" cy="28%" r="80%">
                <Stop offset="0" stopColor="#D6EFB3" />
                <Stop offset="0.35" stopColor="#97CD5A" />
                <Stop offset="0.8" stopColor="#5F9F2A" />
                <Stop offset="1" stopColor="#356C15" />
              </RadialGradient>
              <RadialGradient id="rim" cx="75%" cy="80%" r="45%">
                <Stop offset="0" stopColor="#FFF3B0" stopOpacity="0.55" />
                <Stop offset="1" stopColor="#FFF3B0" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="ao" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#1F3D0C" stopOpacity="0.4" />
                <Stop offset="1" stopColor="#1F3D0C" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="cheek" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#FF7A6B" stopOpacity="0.75" />
                <Stop offset="1" stopColor="#FF7A6B" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="iris" cx="40%" cy="35%" r="70%">
                <Stop offset="0" stopColor="#8A5A3B" />
                <Stop offset="1" stopColor="#3A2214" />
              </RadialGradient>
              <LinearGradient id="lens" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" />
                <Stop offset="1" stopColor="#E6F1FF" />
              </LinearGradient>
              <LinearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#7A4A35" />
                <Stop offset="1" stopColor="#3E2218" />
              </LinearGradient>
              <LinearGradient id="cap" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#4A5A7A" />
                <Stop offset="1" stopColor="#1E2638" />
              </LinearGradient>
              <RadialGradient id="gold" cx="35%" cy="30%" r="75%">
                <Stop offset="0" stopColor="#FFF1A8" />
                <Stop offset="0.5" stopColor="#FFC531" />
                <Stop offset="1" stopColor="#C98A00" />
              </RadialGradient>
              <RadialGradient id="ground" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#7A5A2E" stopOpacity="0.28" />
                <Stop offset="1" stopColor="#7A5A2E" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse cx={(30 + headX) / 2} cy={104} rx={(headX - 30) / 2 + 40} ry={8} fill="url(#ground)" />
            {Array.from({ length: n }).map((_, i) => {
              const x = 30 + i * (SEG - 6);
              // gentle wave along the body
              const y = 82 + Math.sin(i * 1.1) * 5;
              return (
                <G key={i}>
                  {i > 0 && <Ellipse cx={x - 12} cy={y + 2} rx={6} ry={12} fill="url(#ao)" />}
                  <Circle cx={x} cy={y} r={SEG / 2} fill={i % 2 ? 'url(#skin2)' : 'url(#skin)'} />
                  <Circle cx={x} cy={y} r={SEG / 2} fill="url(#rim)" />
                  <Ellipse cx={x - 5} cy={y - 7} rx={5} ry={3} fill="#fff" opacity={0.5} />
                </G>
              );
            })}
            {/* head */}
            <Ellipse cx={headX - 22} cy={90} rx={14} ry={16} fill="url(#ao)" />
            <Circle cx={headX} cy={62} r={34} fill="url(#skin)" />
            <Circle cx={headX} cy={62} r={34} fill="url(#rim)" />
            <Ellipse cx={headX - 18} cy={45} rx={7} ry={3.5} fill="#fff" opacity={0.45} transform={`rotate(-32 ${headX - 18} 45)`} />
            <Circle cx={headX - 25} cy={75} r={9} fill="url(#cheek)" opacity={giggling ? 1 : 0.8} />
            <Circle cx={headX + 25} cy={75} r={9} fill="url(#cheek)" opacity={giggling ? 1 : 0.8} />
            <Path d={`M${headX - 23} ${browL + 5} Q${headX - 15} ${browL} ${headX - 7} ${browL + 4}`} stroke={colors.wormDark} strokeWidth={3} fill="none" strokeLinecap="round" />
            <Path d={`M${headX + 7} ${browR + 7} Q${headX + 15} ${browR} ${headX + 23} ${browR + 6}`} stroke={colors.wormDark} strokeWidth={3} fill="none" strokeLinecap="round" />
            {/* glasses = bookworm */}
            <Circle cx={headX - 13} cy={56} r={11.5} fill="url(#lens)" />
            <Circle cx={headX + 13} cy={56} r={11.5} fill="url(#lens)" />
            {eye(headX - 13)}
            {eye(headX + 13)}
            <G stroke="url(#frame)" strokeWidth={3} fill="none" strokeLinecap="round">
              <Circle cx={headX - 13} cy={56} r={11.5} />
              <Circle cx={headX + 13} cy={56} r={11.5} />
              <Path d={`M${headX - 2} 55 Q${headX} 52.6 ${headX + 2} 55`} />
              <Path d={`M${headX - 24.5} 54.5 L${headX - 30} 53`} />
              <Path d={`M${headX + 24.5} 54.5 L${headX + 30} 52.5`} />
            </G>
            <Path d={`M${headX - 20} 49 L${headX - 16} 47`} stroke="#fff" strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />
            <Path d={`M${headX + 6} 49 L${headX + 10} 47`} stroke="#fff" strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />
            {mouth}
            {/* graduation cap */}
            <G transform={`rotate(-12 ${headX} 30)`}>
              <Path d={`M${headX - 15} 32 Q${headX} 38 ${headX + 15} 32 L${headX + 14.6} 39.6 Q${headX} 45.6 ${headX - 14.4} 39.6 Z`} fill="url(#cap)" />
              <Path d={`M${headX} 17.5 L${headX + 30.6} 26.4 L${headX} 35.3 L${headX - 30.6} 26.4 Z`} fill="url(#cap)" />
              <Path d={`M${headX} 17.5 L${headX + 30.6} 26.4 L${headX} 23.5 L${headX - 30.6} 26.4 Z`} fill="#6A7BA0" opacity={0.6} />
              <Circle cx={headX} cy={26.4} r={1.9} fill="url(#gold)" />
              <Path d={`M${headX} 26.4 Q${headX + 20} 26.7 ${headX + 26} 29 L${headX + 27} 42.7`} stroke="#FFC531" strokeWidth={1.3} fill="none" strokeLinecap="round" />
              <Path d={`M${headX + 25} 41.7 L${headX + 29.4} 41.7 L${headX + 30.6} 50.8 L${headX + 24} 50.8 Z`} fill="url(#gold)" />
            </G>
            {reading && (
              <G>
                {/* open book held under the chin */}
                <Path d={`M${headX} 82 L${headX - 34} 78 L${headX - 34} 108 L${headX} 112 Z`} fill="#fff" stroke={colors.accent} strokeWidth={3} strokeLinejoin="round" />
                <Path d={`M${headX} 82 L${headX + 34} 78 L${headX + 34} 108 L${headX} 112 Z`} fill="#fff" stroke={colors.accent} strokeWidth={3} strokeLinejoin="round" />
                {[88, 95, 102].map((y) => (
                  <G key={y}>
                    <Rect x={headX - 28} y={y - 3} width={22} height={2} rx={1} fill={colors.track} />
                    <Rect x={headX + 6} y={y - 3} width={22} height={2} rx={1} fill={colors.track} />
                  </G>
                ))}
              </G>
            )}
          </Svg>
          {hearts.map((h, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[
                styles.heart,
                {
                  left: `${((headX - 30 + i * 15) / width) * 100}%`,
                  opacity: h.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
                  transform: [
                    { translateY: h.interpolate({ inputRange: [0, 1], outputRange: [0, -90 - i * 10] }) },
                    { scale: h.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.1, 0.8] }) },
                  ],
                },
              ]}
            >
              <Icon3D name="heart" size={26} />
            </Animated.View>
          ))}
        </Animated.View>
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  heart: { position: 'absolute', top: '10%' },
});
