import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  Dimensions
} from 'react-native';
import { COLORS, rf, SCREEN } from '@/constants';
import { useAuthStore } from '@/store/useAuthStore';

const { width, height } = Dimensions.get('window');

// ── Partículas doradas ────────────────────────────────────────
function Particula({ x, delay }: { x: number; delay: number }) {
  const y    = useRef(new Animated.Value(-20)).current;
  const op   = useRef(new Animated.Value(0)).current;
  const sc   = useRef(new Animated.Value(0.4)).current;

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
    <Animated.View style={[
      parts.dot,
      { left: x, opacity: op, transform: [{ translateY: y }, { scale: sc }] }
    ]} />
  );
}

const parts = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: 0,
    width: 3, height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.dorado,
  },
});

const PARTICULAS = Array.from({ length: 12 }, (_, i) => ({
  x: (width / 12) * i + Math.random() * 20,
  delay: i * 250,
}));

// ── Componente principal ──────────────────────────────────────
interface Props {
  onFinish: () => void;
}

export default function WelcomeOverlay({ onFinish }: Props) {
  const { usuario, estaAutenticado } = useAuthStore();

  // Animaciones
  const overlayOp   = useRef(new Animated.Value(0)).current;
  const lineaW      = useRef(new Animated.Value(0)).current;
  const bienvenidoO = useRef(new Animated.Value(0)).current;
  const bienvenidoY = useRef(new Animated.Value(20)).current;
  const nombreO     = useRef(new Animated.Value(0)).current;
  const nombreS     = useRef(new Animated.Value(0.85)).current;
  const dividerO    = useRef(new Animated.Value(0)).current;
  const sloganO     = useRef(new Animated.Value(0)).current;
  const sloganY     = useRef(new Animated.Value(10)).current;
  const btnO        = useRef(new Animated.Value(0)).current;
  const btnY        = useRef(new Animated.Value(16)).current;
  const exitOp      = useRef(new Animated.Value(1)).current;
  const exitY       = useRef(new Animated.Value(0)).current;

  const nombre = usuario?.nombre?.split(' ')[0] || '';

  useEffect(() => {
    Animated.sequence([
      // 1. Overlay fade in
      Animated.timing(overlayOp, { toValue: 1, duration: 500, useNativeDriver: true }),

      // 2. Línea dorada se dibuja
      Animated.timing(lineaW, { toValue: width * 0.55, duration: 700, useNativeDriver: false }),

      // 3. "BIENVENIDO" / "BIENVENIDA" aparece
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(bienvenidoO, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(bienvenidoY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      ]),

      // 4. Nombre o frase aparece con escala
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(nombreO, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(nombreS, { toValue: 1, useNativeDriver: true, tension: 70, friction: 10 }),
      ]),

      // 5. Divisor
      Animated.delay(100),
      Animated.timing(dividerO, { toValue: 1, duration: 400, useNativeDriver: true }),

      // 6. Slogan
      Animated.parallel([
        Animated.timing(sloganO, { toValue: 0.8, duration: 500, useNativeDriver: true }),
        Animated.spring(sloganY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      ]),

      // 7. Botón
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(btnO, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(btnY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      ]),

      // 8. Pausa elegante
      Animated.delay(2200),

      // 9. Slide up fade out
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
    <Animated.View style={[
      styles.container,
      { opacity: exitOp, transform: [{ translateY: exitY }] }
    ]}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: overlayOp }]}>

        {/* Partículas doradas de fondo */}
        {PARTICULAS.map((p, i) => (
          <Particula key={i} x={p.x} delay={p.delay} />
        ))}

        {/* Gradiente sutil en bordes */}
        <View style={styles.gradientLeft} />
        <View style={styles.gradientRight} />

        {/* Contenido centrado — regla de tercios */}
        <View style={styles.content}>

          {/* Línea superior */}
          <Animated.View style={[styles.linea, { width: lineaW }]} />

          {/* BIENVENIDO */}
          <Animated.Text style={[
            styles.bienvenido,
            { opacity: bienvenidoO, transform: [{ translateY: bienvenidoY }] }
          ]}>
            {estaAutenticado ? 'BIENVENIDO' : 'BIENVENIDO A'}
          </Animated.Text>

          {/* Nombre o EGOS */}
          <Animated.Text style={[
            estaAutenticado ? styles.nombre : styles.egosTitle,
            { opacity: nombreO, transform: [{ scale: nombreS }] }
          ]}>
            {estaAutenticado ? nombre : 'EGOS'}
          </Animated.Text>

          {/* Divisor con diamante */}
          <Animated.View style={[styles.dividerRow, { opacity: dividerO }]}>
            <View style={styles.dividerLine} />
            <View style={styles.diamante} />
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* Slogan */}
          <Animated.Text style={[
            styles.slogan,
            { opacity: sloganO, transform: [{ translateY: sloganY }] }
          ]}>
            Wear Your Truth
          </Animated.Text>

          {/* Línea inferior */}
          <Animated.View style={[styles.linea, { width: lineaW }]} />

        </View>

      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
    backgroundColor: '#000',
  },

  // Gradientes laterales decorativos
  gradientLeft: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
    backgroundColor: COLORS.dorado, opacity: 0.3,
  },
  gradientRight: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: 2,
    backgroundColor: COLORS.dorado, opacity: 0.3,
  },

  // Contenido — centrado en el tercio superior-medio (regla de tercios)
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SCREEN.width * 0.1,
    marginTop: -(SCREEN.height * 0.06), // desplazado ligeramente arriba
  },

  linea: {
    height: 1,
    backgroundColor: COLORS.dorado,
    opacity: 0.6,
    marginVertical: rf(20),
  },

  bienvenido: {
    fontFamily: 'Prata-Regular',
    fontSize: rf(12),
    color: COLORS.dorado,
    letterSpacing: rf(6),
    textTransform: 'uppercase',
    marginBottom: rf(16),
    opacity: 0.9,
  },

  nombre: {
    fontFamily: 'BodoniModa-Regular',
    fontSize: Math.min(SCREEN.width * 0.14, rf(58)),
    color: COLORS.blanco,
    fontWeight: '400',
    letterSpacing: rf(2),
    textAlign: 'center',
    marginBottom: rf(8),
  },

  egosTitle: {
    fontFamily: 'BodoniModa-Regular',
    fontSize: Math.min(SCREEN.width * 0.18, rf(72)),
    color: COLORS.dorado,
    fontWeight: '400',
    letterSpacing: rf(16),
    textAlign: 'center',
    marginBottom: rf(8),
  },

  // Divisor con diamante central
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SCREEN.width * 0.55,
    marginVertical: rf(20),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.dorado,
    opacity: 0.4,
  },
  diamante: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.dorado,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 8,
    opacity: 0.8,
  },

  slogan: {
    fontFamily: 'BodoniModa-Italic',
    fontSize: rf(18),
    color: COLORS.dorado,
    letterSpacing: rf(3),
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: rf(4),
  },

  // Botón elegante
  btnWrap: {
    marginTop: rf(36),
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(197,164,126,0.5)',
    paddingVertical: rf(14),
    paddingHorizontal: rf(28),
    gap: rf(12),
  },
  btnTxt: {
    fontFamily: 'Prata-Regular',
    fontSize: rf(12),
    color: COLORS.blanco,
    letterSpacing: rf(3),
    textTransform: 'uppercase',
  },
  btnArrow: {
    width: rf(24), height: rf(24),
    borderRadius: rf(12),
    borderWidth: 1,
    borderColor: COLORS.dorado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnArrowTxt: {
    color: COLORS.dorado,
    fontSize: rf(14),
  },

  // Skip
  skip: {
    position: 'absolute',
    top: SCREEN.height * 0.06,
    right: rf(24),
    padding: rf(8),
  },
  skipTxt: {
    fontFamily: 'Prata-Regular',
    fontSize: rf(11),
    color: 'rgba(197,164,126,0.5)',
    letterSpacing: 2,
  },
});
