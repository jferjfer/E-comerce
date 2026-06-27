import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, rf, SCREEN } from '@/constants';

interface EgosLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSlogan?: boolean;
}

export default function EgosLogo({ size = 'md', showSlogan = true }: EgosLogoProps) {
  const cfg = {
    sm: { e: rf(18), egos: rf(11), sl: rf(7), ls: 4, lh: rf(20), mb: -2 },
    md: { e: rf(26), egos: rf(14), sl: rf(8), ls: 7, lh: rf(28), mb: -3 },
    lg: { e: Math.min(SCREEN.width * 0.22, rf(56)), egos: rf(28), sl: rf(10), ls: 14, lh: Math.min(SCREEN.width * 0.22, rf(56)), mb: -4 },
  }[size];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.e, { fontSize: cfg.e, lineHeight: cfg.lh, marginBottom: cfg.mb }]}>E</Text>
      <Text style={[styles.egos, { fontSize: cfg.egos, letterSpacing: cfg.ls }]}>EGOS</Text>
      {showSlogan && (
        <Text style={[styles.slogan, { fontSize: cfg.sl }]}>WEAR YOUR TRUTH</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  e: {
    fontFamily: 'BodoniModa-Regular',
    color: COLORS.dorado,
    fontWeight: '400',
    letterSpacing: -1,
  },
  egos: {
    fontFamily: 'Prata-Regular',
    color: COLORS.blanco,
    fontWeight: '400',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  slogan: {
    fontFamily: 'BodoniModa-Italic',
    color: COLORS.dorado,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.85,
    fontStyle: 'italic',
  },
});
