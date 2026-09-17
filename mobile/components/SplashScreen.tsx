import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { COLORS } from '@/constants';

// ── Puntos de carga animados ─────────────────────────────────
function LoadingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.delay(800 - delay),
        ])
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 180);
    const a3 = anim(dot3, 360);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 32 }}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={{
          width: 6, height: 6, borderRadius: 3,
          backgroundColor: COLORS.dorado,
          opacity: dot,
          transform: [{ scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        }} />
      ))}
    </View>
  );
}

interface Props { onFinish: () => void; }

export default function SplashScreen({ onFinish }: Props) {
  // useWindowDimensions es reactivo y correcto en iOS y Android
  const { width, height } = useWindowDimensions();

  const eOpacity    = useRef(new Animated.Value(0)).current;
  const eScale      = useRef(new Animated.Value(0.3)).current;
  const egosOpacity = useRef(new Animated.Value(0)).current;
  const egosY       = useRef(new Animated.Value(14)).current;
  const lineWidth   = useRef(new Animated.Value(0)).current;
  const sloganOp    = useRef(new Animated.Value(0)).current;
  const sloganY     = useRef(new Animated.Value(8)).current;
  const dotsOp      = useRef(new Animated.Value(0)).current;
  const screenOp    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(eScale, { toValue: 1, useNativeDriver: true, tension: 55, friction: 8 }),
        Animated.timing(eOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(egosOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(egosY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      ]),
      Animated.delay(150),
      Animated.timing(lineWidth, { toValue: 80, duration: 700, useNativeDriver: false }),
      Animated.parallel([
        Animated.timing(sloganOp, { toValue: 0.85, duration: 600, useNativeDriver: true }),
        Animated.spring(sloganY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      ]),
      Animated.delay(200),
      Animated.timing(dotsOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(screenOp, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  const eFontSize   = Math.min(width * 0.28, 130);
  const egosFontSize = Math.min(width * 0.085, 38);
  const sloganFontSize = Math.min(width * 0.028, 12);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, {
      backgroundColor: '#000000',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      opacity: screenOp,
    }]}>
      <View style={{ alignItems: 'center' }}>

        <Animated.Text style={{
          fontFamily: 'BodoniModa-Regular',
          fontSize: eFontSize,
          color: COLORS.dorado,
          fontWeight: '400',
          lineHeight: eFontSize,
          marginBottom: -8,
          letterSpacing: -4,
          opacity: eOpacity,
          transform: [{ scale: eScale }],
        }}>
          E
        </Animated.Text>

        <Animated.Text style={{
          fontFamily: 'Prata-Regular',
          fontSize: egosFontSize,
          color: COLORS.blanco,
          fontWeight: '400',
          letterSpacing: Math.min(width * 0.04, 18),
          textTransform: 'uppercase',
          marginBottom: 18,
          opacity: egosOpacity,
          transform: [{ translateY: egosY }],
        }}>
          EGOS
        </Animated.Text>

        <Animated.View style={{
          height: 1,
          backgroundColor: COLORS.dorado,
          opacity: 0.5,
          marginBottom: 16,
          width: lineWidth,
        }} />

        <Animated.Text style={{
          fontFamily: 'BodoniModa-Italic',
          fontSize: sloganFontSize,
          color: COLORS.dorado,
          letterSpacing: Math.min(width * 0.012, 5),
          textTransform: 'uppercase',
          fontStyle: 'italic',
          opacity: sloganOp,
          transform: [{ translateY: sloganY }],
        }}>
          WEAR YOUR TRUTH
        </Animated.Text>

        <Animated.View style={{ opacity: dotsOp }}>
          <LoadingDots />
        </Animated.View>

      </View>
    </Animated.View>
  );
}
