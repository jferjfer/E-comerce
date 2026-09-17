import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  TouchableOpacity, useWindowDimensions
} from 'react-native';
import { COLORS, rf } from '@/constants';
import { useAuthStore } from '@/store/useAuthStore';

// ── Partículas doradas ────────────────────────────────────────
function Particula({ x, delay, height }: { x: number; delay: number; height: number }) {
  const y  = useRef(new Animated.Value(-20)).current;
  const op = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y,  { toValue: height * 0.6, duration: 3500, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(op, { toValue: 0.6, duration: 600, useNativeDriver: true }),
            Animated.timing(op, { toValue: 0, duration: 2900, useNativeDriver: true }),
          ]),
          Animated.timing(sc, { toValue: 1, duration: 3500, useNativeDriver: true }),
        ]),
        Animated.delay(500),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', top: 0, left: x,
      width: 3, height: 3, borderRadius: 2,
      backgroundColor: COLORS.dorado,
      opacity: op,
      transform: [{ translateY: y }, { scale: sc }],
    }} />
  );
}

interface Props { onFinish: () => void; }

export default function WelcomeOverlay({ onFinish }: Props) {
  const { width, height } = useWindowDimensions();
  const { usuario, estaAutenticado } = useAuthStore();

  const overlayOp   = useRef(new Animated.Value(0)).current;
  const lineaW      = useRef(new Animated.Value(0)).current;
  const bienvenidoO = useRef(new Animated.Value(0)).current;
  const bienvenidoY = useRef(new Animated.Value(20)).current;
  const nombreO     = useRef(new Animated.Value(0)).current;
  const nombreS     = useRef(new Animated.Value(0.85)).current;
  const dividerO    = useRef(new Animated.Value(0)).current;
  const sloganO     = useRef(new Animated.Value(0)).current;
  const sloganY     = useRef(new Animated.Value(10)).current;
  const exitOp      = useRef(new Animated.Value(1)).current;
  const exitY       = useRef(new Animated.Value(0)).current;

  const nombre = usuario?.nombre?.split(' ')[0] || '';

  // Partículas generadas con las dimensiones reales
  const particulas = Array.from({ length: 12 }, (_, i) => ({
    x: (width / 12) * i + (i % 3) * 8,
    delay: i * 250,
  }));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(overlayOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(lineaW, { toValue: width * 0.55, duration: 700, useNativeDriver: false }),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(bienvenidoO, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(bienvenidoY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      ]),
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(nombreO, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(nombreS, { toValue: 1, useNativeDriver: true, tension: 70, friction: 10 }),
      ]),
      Animated.delay(100),
      Animated.timing(dividerO, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(sloganO, { toValue: 0.8, duration: 500, useNativeDriver: true }),
        Animated.spring(sloganY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      ]),
      Animated.delay(2200),
      Animated.parallel([
        Animated.timing(exitOp, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.spring(exitY, { toValue: -height, useNativeDriver: true, tension: 60, friction: 14 }),
      ]),
    ]).start(() => onFinish());
  }, []);

  const handleSkip = () => {
    Animated.parallel([
      Animated.timing(exitOp, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.spring(exitY, { toValue: -height, useNativeDriver: true, tension: 60, friction: 14 }),
    ]).start(() => onFinish());
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, {
      zIndex: 9998,
      backgroundColor: '#000',
      opacity: exitOp,
      transform: [{ translateY: exitY }],
    }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlayOp }]}>

        {/* Partículas */}
        {particulas.map((p, i) => (
          <Particula key={i} x={p.x} delay={p.delay} height={height} />
        ))}

        {/* Bordes dorados */}
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, backgroundColor: COLORS.dorado, opacity: 0.3 }} />
        <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, backgroundColor: COLORS.dorado, opacity: 0.3 }} />

        {/* Contenido centrado */}
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: width * 0.1,
        }}>

          <Animated.View style={{ height: 1, backgroundColor: COLORS.dorado, opacity: 0.6, marginVertical: rf(20), width: lineaW }} />

          <Animated.Text style={{
            fontFamily: 'Prata-Regular',
            fontSize: rf(12),
            color: COLORS.dorado,
            letterSpacing: rf(6),
            textTransform: 'uppercase',
            marginBottom: rf(16),
            opacity: bienvenidoO,
            transform: [{ translateY: bienvenidoY }],
          }}>
            {estaAutenticado ? 'BIENVENIDO' : 'BIENVENIDO A'}
          </Animated.Text>

          <Animated.Text style={{
            fontFamily: 'BodoniModa-Regular',
            fontSize: Math.min(width * (estaAutenticado ? 0.14 : 0.18), rf(estaAutenticado ? 58 : 72)),
            color: estaAutenticado ? COLORS.blanco : COLORS.dorado,
            fontWeight: '400',
            letterSpacing: rf(estaAutenticado ? 2 : 16),
            textAlign: 'center',
            marginBottom: rf(8),
            opacity: nombreO,
            transform: [{ scale: nombreS }],
          }}>
            {estaAutenticado ? nombre : 'EGOS'}
          </Animated.Text>

          <Animated.View style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: width * 0.55,
            marginVertical: rf(20),
            opacity: dividerO,
          }}>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.dorado, opacity: 0.4 }} />
            <View style={{ width: 6, height: 6, backgroundColor: COLORS.dorado, transform: [{ rotate: '45deg' }], marginHorizontal: 8, opacity: 0.8 }} />
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.dorado, opacity: 0.4 }} />
          </Animated.View>

          <Animated.Text style={{
            fontFamily: 'BodoniModa-Italic',
            fontSize: rf(18),
            color: COLORS.dorado,
            letterSpacing: rf(3),
            textAlign: 'center',
            fontStyle: 'italic',
            marginBottom: rf(4),
            opacity: sloganO,
            transform: [{ translateY: sloganY }],
          }}>
            Wear Your Truth
          </Animated.Text>

          <Animated.View style={{ height: 1, backgroundColor: COLORS.dorado, opacity: 0.6, marginVertical: rf(20), width: lineaW }} />

        </View>



      </Animated.View>
    </Animated.View>
  );
}
