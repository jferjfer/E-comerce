import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING } from '@/constants';

const { width } = Dimensions.get('window');

const FRASES = [
  { frase: 'Wear Your Truth', sub: 'Cada prenda cuenta tu historia' },
  { frase: 'Define tu estilo', sub: 'Moda colombiana exclusiva' },
  { frase: 'Viste con propósito', sub: 'Colecciones que te representan' },
  { frase: 'Tu moda, tu identidad', sub: 'Descubre lo nuevo en EGOS' },
];

export default function HeaderAnimado() {
  const [idx, setIdx] = useState(0);
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(translateAnim, { toValue: -10, duration: 500, useNativeDriver: true }),
      ]).start(() => {
        setIdx(i => (i + 1) % FRASES.length);
        translateAnim.setValue(10);
        // Fade in
        Animated.parallel([
          Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(translateAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const frase = FRASES[idx];

  return (
    <View style={styles.wrap}>
      {/* Línea decorativa */}
      <View style={styles.lineaRow}>
        <View style={styles.linea} />
        <Text style={styles.logoE}>E</Text>
        <View style={styles.linea} />
      </View>

      {/* Frase animada */}
      <Animated.View style={[styles.fraseWrap, {
        opacity: opacityAnim,
        transform: [{ translateY: translateAnim }]
      }]}>
        <Text style={styles.frase}>{frase.frase}</Text>
        <Text style={styles.sub}>{frase.sub}</Text>
      </Animated.View>

      {/* Botón explorar */}
      <TouchableOpacity
        style={styles.btnExplorar}
        onPress={() => router.push('/(tabs)/catalogo')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnExplorarTxt}>Explorar colección</Text>
        <Text style={styles.btnExplorarArrow}>→</Text>
      </TouchableOpacity>

      {/* Dots indicadores */}
      <View style={styles.dots}>
        {FRASES.map((_, i) => (
          <View key={i} style={[styles.dot, i === idx && styles.dotActivo]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.negro,
  },
  lineaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.md,
    width: '100%',
  },
  linea: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(197,164,126,0.3)',
  },
  logoE: {
    fontFamily: 'BodoniModa-Regular',
    fontSize: 28,
    color: COLORS.dorado,
    lineHeight: 28,
  },
  fraseWrap: {
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.lg,
    minHeight: 70,
    justifyContent: 'center',
  },
  frase: {
    fontFamily: 'BodoniModa-Italic',
    fontSize: 26,
    color: COLORS.blanco,
    textAlign: 'center',
    lineHeight: 32,
    fontStyle: 'italic',
  },
  sub: {
    fontSize: 12,
    color: 'rgba(197,164,126,0.6)',
    textAlign: 'center',
    letterSpacing: 1,
  },
  btnExplorar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(197,164,126,0.4)',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: SPACING.md,
  },
  btnExplorarTxt: {
    color: COLORS.dorado,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  btnExplorarArrow: {
    color: COLORS.dorado,
    fontSize: 14,
    fontWeight: '700',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(197,164,126,0.3)',
  },
  dotActivo: {
    width: 16,
    backgroundColor: COLORS.dorado,
  },
});
