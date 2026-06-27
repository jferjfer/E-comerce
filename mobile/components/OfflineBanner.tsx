import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useNetwork } from '@/hooks/useNetwork';
import { haptic } from '@/hooks/useHaptics';

export default function OfflineBanner() {
  const isConnected = useNetwork();
  const slideAnim = useRef(new Animated.Value(-70)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const wasOfflineRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isConnected) {
      // Sin conexión — mostrar banner rojo
      wasOfflineRef.current = true;
      setShowRestored(false);
      setVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 12 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (wasOfflineRef.current) {
      // Volvió la conexión
      setShowRestored(true);
      haptic.conexionRestaurada();
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 12 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      // Ocultar después de 2.5s
      timeoutRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.spring(slideAnim, { toValue: -70, useNativeDriver: true, tension: 100, friction: 12 }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => {
          setVisible(false);
          wasOfflineRef.current = false;
        });
      }, 2500);
    }

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isConnected]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        showRestored ? styles.online : styles.offline,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconWrap, showRestored ? styles.iconOnline : styles.iconOffline]}>
          <Text style={{ fontSize: 14 }}>{showRestored ? '✅' : '📡'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>
            {showRestored ? 'Conexión restaurada' : 'Sin conexión a internet'}
          </Text>
          {!showRestored && (
            <Text style={styles.subtitulo}>Mostrando contenido guardado</Text>
          )}
        </View>
        {!showRestored && (
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => haptic.tap()}
          >
            <Text style={styles.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Barra de progreso animada cuando está offline */}
      {!showRestored && <PulseBar />}
    </Animated.View>
  );
}

function PulseBar() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.pulseTrack}>
      <Animated.View
        style={[styles.pulseBar, {
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }),
          transform: [{ scaleX: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
        }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    paddingTop: 44, // safe area
    paddingBottom: 8,
  },
  offline: { backgroundColor: '#111827' },
  online: { backgroundColor: '#059669' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    gap: 10,
  },
  iconWrap: {
    width: 32, height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOffline: { backgroundColor: 'rgba(255,255,255,0.1)' },
  iconOnline: { backgroundColor: 'rgba(255,255,255,0.2)' },
  titulo: { color: COLORS.blanco, fontSize: 13, fontWeight: '700' },
  subtitulo: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  retryTxt: { color: COLORS.blanco, fontSize: 11, fontWeight: '700' },
  pulseTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 8,
    overflow: 'hidden',
  },
  pulseBar: {
    height: '100%',
    backgroundColor: COLORS.dorado,
    transformOrigin: 'left',
  },
});
