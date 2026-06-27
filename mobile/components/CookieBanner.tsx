import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';

const COOKIE_KEY = 'egos_cookie_consent_mobile';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    AsyncStorage.getItem(COOKIE_KEY).then(val => {
      if (!val) {
        setVisible(true);
        Animated.spring(slideAnim, {
          toValue: 0, useNativeDriver: true, tension: 80, friction: 12,
        }).start();
      }
    });
  }, []);

  const aceptar = async (tipo: 'todas' | 'esenciales') => {
    const prefs = {
      esenciales: true,
      rendimiento: tipo === 'todas',
      funcionalidad: tipo === 'todas',
    };
    await AsyncStorage.setItem(COOKIE_KEY, JSON.stringify(prefs));
    Animated.timing(slideAnim, { toValue: 100, duration: 300, useNativeDriver: true })
      .start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.inner}>
        <View style={styles.textWrap}>
          <Text style={styles.emoji}>🍪</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>Usamos cookies</Text>
            <Text style={styles.desc}>
              Para mejorar tu experiencia. Las esenciales son necesarias para el funcionamiento.
            </Text>
          </View>
        </View>
        <View style={styles.btns}>
          <TouchableOpacity style={styles.btnEsencial} onPress={() => aceptar('esenciales')}>
            <Text style={styles.btnEsencialTxt}>Solo esenciales</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAceptar} onPress={() => aceptar('todas')}>
            <Text style={styles.btnAceptarTxt}>Aceptar todas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    zIndex: 9988,
    padding: SPACING.md,
  },
  inner: {
    backgroundColor: COLORS.negroHeader,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(197,164,126,0.2)',
    ...SHADOW.lg,
  },
  textWrap: { flexDirection: 'row', gap: 10, marginBottom: SPACING.md },
  emoji: { fontSize: 24 },
  titulo: { fontSize: 13, fontWeight: '700', color: COLORS.blanco, marginBottom: 3 },
  desc: { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 17 },
  btns: { flexDirection: 'row', gap: 8 },
  btnEsencial: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  btnEsencialTxt: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  btnAceptar: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md,
    backgroundColor: COLORS.dorado, alignItems: 'center',
  },
  btnAceptarTxt: { fontSize: 12, color: COLORS.negro, fontWeight: '700' },
});
