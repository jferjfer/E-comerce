import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Platform, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants';

const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

export default function BtnVolver({ titulo }: { titulo?: string }) {
  return (
    <View style={[styles.wrap, { paddingTop: STATUS_H + 8 }]}>
      <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.flecha}>←</Text>
      </TouchableOpacity>
      {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.negroHeader,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197,164,126,0.15)',
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  flecha: {
    color: COLORS.dorado,
    fontSize: 24,
    fontWeight: '300',
  },
  titulo: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.dorado,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginRight: 40,
  },
});
