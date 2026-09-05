import React, { useEffect, useState, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, Animated, Image, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { useAuthStore } from '@/store/useAuthStore';
import { API_URL } from '@/constants';

const { width } = Dimensions.get('window');
const CARD_W = width * 0.9;

let yaSeMostro = false;

export default function CampanaPopup() {
  const { estaAutenticado } = useAuthStore();
  const [visible, setVisible] = useState(false);
  const [campana, setCampana] = useState<any>(null);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (yaSeMostro || estaAutenticado) return;
    const cargar = async () => {
      try {
        const res = await fetch(`${API_URL}/api/campanas`);
        const d = await res.json();
        const activas = (d.campanas || []).filter((c: any) => c.estado === 'Activa');
        if (activas.length > 0) {
          setCampana(activas[0]);
          setVisible(true);
          yaSeMostro = true;
          Animated.parallel([
            Animated.timing(overlayAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, tension: 65, friction: 9, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          ]).start();
        }
      } catch {}
    };
    const timer = setTimeout(cargar, 6000);
    return () => clearTimeout(timer);
  }, []);

  const cerrar = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 250, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  if (!campana) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={cerrar}>
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <Animated.View style={[styles.card, {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }]}>

          {/* ── IMAGEN CON OVERLAY GRADIENTE ── */}
          <View style={styles.imagenWrap}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&h=600&fit=crop&q=85' }}
              style={styles.imagen}
              resizeMode="cover"
            />
            {/* Gradiente oscuro de abajo hacia arriba */}
            <View style={styles.gradienteBottom} />
            {/* Overlay sutil general */}
            <View style={styles.imagenOverlay} />

            {/* Logo EGOS sobre imagen */}
            <View style={styles.logoWrap}>
              <Text style={styles.logoE}>E</Text>
              <Text style={styles.logoEgos}>EGOS</Text>
            </View>

            {/* Descuento flotante */}
            {campana.descuento > 0 && (
              <View style={styles.descuentoWrap}>
                <Text style={styles.descuentoHasta}>HASTA</Text>
                <Text style={styles.descuentoNum}>{campana.descuento}%</Text>
                <Text style={styles.descuentoOff}>OFF</Text>
              </View>
            )}
          </View>

          {/* ── CUERPO ── */}
          <View style={styles.cuerpo}>

            {/* Divisor dorado con texto */}
            <View style={styles.divisorRow}>
              <View style={styles.divisorLinea} />
              <Text style={styles.divisorTxt}>OFERTA EXCLUSIVA</Text>
              <View style={styles.divisorLinea} />
            </View>

            {/* Título con fuente serif */}
            <Text style={styles.titulo}>{campana.nombre}</Text>

            {/* Descripción */}
            <Text style={styles.descripcion}>{campana.descripcion}</Text>

            {/* Pill informativo */}
            <View style={styles.pill}>
              <Text style={styles.pillTxt}>El código llega directo a tu correo</Text>
            </View>

            {/* CTA principal */}
            <TouchableOpacity
              style={styles.btnPrincipal}
              onPress={() => { cerrar(); setTimeout(() => router.push('/registro'), 300); }}
              activeOpacity={0.88}
            >
              <Text style={styles.btnPrincipalTxt}>Registrarme ahora</Text>
            </TouchableOpacity>

            {/* Slogan */}
            <Text style={styles.slogan}>Wear Your Truth</Text>

            {/* Link cerrar */}
            <TouchableOpacity onPress={cerrar} style={styles.btnLink}>
              <Text style={styles.btnLinkTxt}>Continuar sin registrarme</Text>
            </TouchableOpacity>

          </View>

          {/* Botón X */}
          <TouchableOpacity style={styles.btnX} onPress={cerrar}>
            <Text style={styles.btnXTxt}>✕</Text>
          </TouchableOpacity>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: (width - CARD_W) / 2,
  },
  card: {
    width: CARD_W,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(197,164,126,0.2)',
    shadowColor: COLORS.dorado,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 24,
  },

  // Imagen
  imagenWrap: {
    width: '100%',
    height: CARD_W * 0.68,
    position: 'relative',
  },
  imagen: { width: '100%', height: '100%' },
  imagenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  gradienteBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '60%',
    backgroundColor: 'transparent',
    // Simula gradiente con opacidad
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  // Logo sobre imagen
  logoWrap: {
    position: 'absolute',
    top: 16,
    left: 18,
    alignItems: 'center',
  },
  logoE: {
    fontFamily: 'BodoniModa-Regular',
    fontSize: 32,
    color: COLORS.dorado,
    lineHeight: 32,
    marginBottom: -2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  logoEgos: {
    fontFamily: 'Prata-Regular',
    fontSize: 10,
    color: COLORS.blanco,
    letterSpacing: 7,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Descuento
  descuentoWrap: {
    position: 'absolute',
    bottom: 16,
    right: 18,
    alignItems: 'flex-end',
  },
  descuentoHasta: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.dorado,
    letterSpacing: 3,
    marginBottom: -4,
  },
  descuentoNum: {
    fontFamily: 'BodoniModa-Regular',
    fontSize: 72,
    color: COLORS.blanco,
    lineHeight: 72,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  descuentoOff: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.dorado,
    letterSpacing: 5,
    marginTop: -6,
  },

  // Cuerpo
  cuerpo: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: 10,
    alignItems: 'center',
  },
  divisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  divisorLinea: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(197,164,126,0.3)',
  },
  divisorTxt: {
    color: COLORS.dorado,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 3,
  },
  titulo: {
    fontFamily: 'Prata-Regular',
    fontSize: 19,
    color: COLORS.blanco,
    textAlign: 'center',
    lineHeight: 26,
    textTransform: 'none',
  },
  descripcion: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
    textTransform: 'none',
  },
  pill: {
    backgroundColor: 'rgba(197,164,126,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(197,164,126,0.25)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillTxt: {
    color: COLORS.dorado,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  btnPrincipal: {
    backgroundColor: COLORS.dorado,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginTop: 2,
  },
  btnPrincipalTxt: {
    color: COLORS.negro,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
    fontFamily: 'Prata-Regular',
    textTransform: 'none',
  },
  slogan: {
    fontFamily: 'BodoniModa-Italic',
    fontSize: 11,
    color: 'rgba(197,164,126,0.4)',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  btnLink: {
    paddingVertical: 2,
  },
  btnLinkTxt: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 11,
    letterSpacing: 0.3,
  },

  // X
  btnX: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnXTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' },
});
