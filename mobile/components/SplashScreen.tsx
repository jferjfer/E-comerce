import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '@/constants';

const { width, height } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

// ── Puntos de carga animados ─────────────────────────────────
function LoadingDots() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.delay(800 - delay),
        ])
      );

    const anims = dots.map((dot, i) => animateDot(dot, i * 180));
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={dotStyles.wrap}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            dotStyles.dot,
            {
              opacity: dot,
              transform: [{
                scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] })
              }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.dorado,
  },
});

// ── Splash principal ─────────────────────────────────────────
export default function SplashScreen({ onFinish }: Props) {
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
      // 1. E aparece — spring suave
      Animated.parallel([
        Animated.spring(eScale, {
          toValue: 1, useNativeDriver: true,
          tension: 55, friction: 8,
        }),
        Animated.timing(eOpacity, {
          toValue: 1, duration: 900, useNativeDriver: true,
        }),
      ]),

      // 2. EGOS desliza hacia arriba
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(egosOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(egosY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      ]),

      // 3. Línea dorada se expande
      Animated.delay(150),
      Animated.timing(lineWidth, { toValue: 80, duration: 700, useNativeDriver: false }),

      // 4. Slogan aparece
      Animated.parallel([
        Animated.timing(sloganOp, { toValue: 0.85, duration: 600, useNativeDriver: true }),
        Animated.spring(sloganY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      ]),

      // 5. Puntos aparecen
      Animated.delay(200),
      Animated.timing(dotsOp, { toValue: 1, duration: 500, useNativeDriver: true }),

      // 6. Pausa elegante — 3 segundos extra
      Animated.delay(3000),

      // 7. Fade out elegante
      Animated.timing(screenOp, { toValue: 0, duration: 700, useNativeDriver: true }),

    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOp }]}>

      {/* Centro */}
      <View style={styles.center}>

        {/* Monograma E */}
        <Animated.Text style={[
          styles.e,
          { opacity: eOpacity, transform: [{ scale: eScale }] }
        ]}>
          E
        </Animated.Text>

        {/* EGOS */}
        <Animated.Text style={[
          styles.egos,
          { opacity: egosOpacity, transform: [{ translateY: egosY }] }
        ]}>
          EGOS
        </Animated.Text>

        {/* Línea dorada */}
        <Animated.View style={[styles.linea, { width: lineWidth }]} />

        {/* Slogan */}
        <Animated.Text style={[
          styles.slogan,
          { opacity: sloganOp, transform: [{ translateY: sloganY }] }
        ]}>
          WEAR YOUR TRUTH
        </Animated.Text>

        {/* Puntos de carga */}
        <Animated.View style={{ opacity: dotsOp }}>
          <LoadingDots />
        </Animated.View>

      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  center: { alignItems: 'center' },
  e: {
    fontFamily: 'BodoniModa-Regular',
    fontSize: Math.min(width * 0.28, 130),
    color: COLORS.dorado,
    fontWeight: '400',
    lineHeight: Math.min(width * 0.28, 130),
    marginBottom: -8,
    letterSpacing: -4,
  },
  egos: {
    fontFamily: 'Prata-Regular',
    fontSize: Math.min(width * 0.085, 38),
    color: COLORS.blanco,
    fontWeight: '400',
    letterSpacing: Math.min(width * 0.04, 18),
    textTransform: 'uppercase',
    marginBottom: 18,
  },
  linea: {
    height: 1,
    backgroundColor: COLORS.dorado,
    opacity: 0.5,
    marginBottom: 16,
  },
  slogan: {
    fontFamily: 'BodoniModa-Italic',
    fontSize: Math.min(width * 0.028, 12),
    color: COLORS.dorado,
    letterSpacing: Math.min(width * 0.012, 5),
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  empresa: {
    position: 'absolute',
    bottom: Math.max(height * 0.06, 40),
    fontSize: 10,
    color: 'rgba(197,164,126,0.35)',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
