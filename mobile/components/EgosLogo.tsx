import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants';

interface EgosLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSlogan?: boolean;
}

export default function EgosLogo({ size = 'md', showSlogan = true }: EgosLogoProps) {
  const sizes = {
    sm: { e: 20, egos: 11, slogan: 7, letterSpacing: 5 },
    md: { e: 28, egos: 14, slogan: 8, letterSpacing: 7 },
    lg: { e: 56, egos: 28, slogan: 11, letterSpacing: 14 },
  };
  const s = sizes[size];

  return (
    <View style={styles.container}>
      <Text style={[styles.e, { fontSize: s.e }]}>E</Text>
      <Text style={[styles.egos, { fontSize: s.egos, letterSpacing: s.letterSpacing }]}>EGOS</Text>
      {showSlogan && (
        <Text style={[styles.slogan, { fontSize: s.slogan }]}>WEAR YOUR TRUTH</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  e: {
    color: COLORS.dorado,
    fontWeight: '900',
    lineHeight: 36,
    marginBottom: -4,
  },
  egos: {
    color: COLORS.blanco,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  slogan: {
    color: COLORS.dorado,
    letterSpacing: 3,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
});
