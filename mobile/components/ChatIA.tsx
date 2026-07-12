import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, Keyboard, Animated, Image, PanResponder
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/services/api';
import EgosLogo from './EgosLogo';
import { Ionicons } from '@expo/vector-icons';
import { haptic } from '@/hooks/useHaptics';
import { useCartStore } from '@/store/useCartStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { SCREEN } from '@/constants';
import { safeLog, safeError } from '@/utils/security';

interface Mensaje {
  id: string;
  texto: string;
  esUsuario: boolean;
  hora: Date;
  productos?: any[]; // productos recomendados con datos completos
}

const QUICK_ACTIONS = [
  '👗 Busco outfit para una ocasión especial',
  '🎨 Ayúdame a combinar colores',
  '💰 Ver productos recomendados para mí',
  '📦 ¿Dónde está mi pedido?',
];

const CHAT_STORAGE_KEY = 'egos_chat_history';

function ProductoImagen({ uri }: { uri: string }) {
  const [ratio, setRatio] = React.useState(1);
  React.useEffect(() => {
    if (!uri) return;
    Image.getSize(uri, (w, h) => {
      if (w > 0 && h > 0) setRatio(h / w);
    }, () => setRatio(1));
  }, [uri]);
  return (
    <Image
      source={{ uri }}
      style={[styles.productoImg, { aspectRatio: 1 / ratio }]}
      resizeMode="cover"
    />
  );
}

const MSG_INICIAL: Mensaje = {
  id: '1',
  texto: '¡Hola! Soy Noa ✨ Tu asesora de moda personal en EGOS. Cuéntame, ¿qué estás buscando hoy?',
  esUsuario: false,
  hora: new Date(),
};

const FRASES_FANTASMA = [
  '¿Buscas algo especial hoy? ✨',
  'Tengo outfits perfectos para ti 🛍️',
  '¿Te ayudo a encontrar tu estilo?',
  'Descubre looks exclusivos con mi ayuda',
  '¿Qué prenda te está faltando? 👗',
];

export default function ChatIA() {
  const { usuario, token } = useAuthStore();
  const agregarItem = useCartStore(s => s.agregarItem);
  const addNotification = useNotificationStore(s => s.addNotification);
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([MSG_INICIAL]);
  const [input, setInput] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [fraseFantasma, setFraseFantasma] = useState<string | null>(null);
  const fantasmaOp = useRef(new Animated.Value(0)).current;
  const fantasmaY  = useRef(new Animated.Value(10)).current;
  const scrollRef = useRef<ScrollView>(null);
  const fabAnim = useRef(new Animated.Value(1)).current;
  // Posición draggable del FAB
  const fabPos = useRef(new Animated.ValueXY({ x: SCREEN.width - 76, y: SCREEN.height - 180 })).current;
  const lastPos = useRef({ x: SCREEN.width - 76, y: SCREEN.height - 180 });

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3,
    onPanResponderGrant: () => {
      fabPos.setOffset({ x: lastPos.current.x, y: lastPos.current.y });
      fabPos.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: Animated.event(
      [null, { dx: fabPos.x, dy: fabPos.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, gs) => {
      fabPos.flattenOffset();
      // Guardar posición actual
      lastPos.current = {
        x: Math.max(10, Math.min(SCREEN.width - 66, lastPos.current.x + gs.dx)),
        y: Math.max(50, Math.min(SCREEN.height - 160, lastPos.current.y + gs.dy)),
      };
      // Snap a los bordes
      const snapX = lastPos.current.x < SCREEN.width / 2 ? 10 : SCREEN.width - 66;
      Animated.spring(fabPos, {
        toValue: { x: snapX, y: lastPos.current.y },
        useNativeDriver: false,
        tension: 80, friction: 10,
      }).start();
      lastPos.current.x = snapX;
    },
  })).current;

  // Cargar historial al montar
  useEffect(() => {
    AsyncStorage.getItem(CHAT_STORAGE_KEY).then(raw => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.length > 0)
          setMensajes(parsed.map((m: any) => ({ ...m, hora: new Date(m.hora) })));
      } catch {}
    });
  }, []);

  // Persistir historial
  useEffect(() => {
    if (mensajes.length <= 1) return;
    AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(mensajes)).catch(() => {});
  }, [mensajes]);

  // Mensaje fantasma — una sola vez, 15s después de que el cliente
  // llega al Home (splashDone + welcome terminaron)
  useEffect(() => {
    // Esperar que splash + welcome terminen (~8s) + 15s de uso real = 23s total
    const t = setTimeout(() => {
      if (abierto) return;
      const frase = FRASES_FANTASMA[Math.floor(Math.random() * FRASES_FANTASMA.length)];
      setFraseFantasma(frase);
      Animated.parallel([
        Animated.spring(fantasmaOp, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.spring(fantasmaY,  { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      ]).start();
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fantasmaOp, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(fantasmaY,  { toValue: 10, duration: 400, useNativeDriver: true }),
        ]).start(() => setFraseFantasma(null));
      }, 4000);
    }, 23000); // 23s = splash(6s) + welcome(8s) + 9s uso real
    return () => clearTimeout(t);
  }, []);

  // Pulsar FAB cuando hay no leídos
  useEffect(() => {
    if (mensajesNoLeidos > 0 && !abierto) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fabAnim, { toValue: 1.15, duration: 300, useNativeDriver: true }),
          Animated.timing(fabAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        { iterations: 3 }
      ).start();
    }
  }, [mensajesNoLeidos]);

  // Typing dots animados igual al web
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!escribiendo) return;
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 150);
    const a3 = anim(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); dot1.setValue(0); dot2.setValue(0); dot3.setValue(0); };
  }, [escribiendo]);

  const scrollAbajo = useRef(() =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  ).current;

  useEffect(() => { scrollAbajo(); }, [mensajes, escribiendo]);

  const enviar = async (texto: string) => {
    if (!texto.trim()) return;
    haptic.tap();

    const msgUsuario: Mensaje = {
      id: Date.now().toString(),
      texto: texto.trim(),
      esUsuario: true,
      hora: new Date(),
    };
    setMensajes(prev => [...prev, msgUsuario]);
    setInput('');
    setEscribiendo(true);
    Keyboard.dismiss();

    try {
      const historial = mensajes.map(m => ({
        role: m.esUsuario ? 'user' : 'assistant',
        content: m.texto,
      }));

      const resultado = await api.chatIA(
        texto.trim(),
        historial,
        usuario?.id,
        token || undefined
      );

      safeLog('🤖 ChatIA resultado:', JSON.stringify(resultado).slice(0, 200));

      // El backend devuelve {respuesta, productos_recomendados} directamente (sin campo exito)
      const respuestaTexto = resultado.respuesta || resultado.text || resultado.message;

      const msgIA: Mensaje = {
        id: (Date.now() + 1).toString(),
        texto: respuestaTexto
          ? respuestaTexto
          : 'Lo siento, tengo problemas técnicos. ¿Puedo ayudarte con algo sobre moda?',
        esUsuario: false,
        hora: new Date(),
      };
      setMensajes(prev => [...prev, msgIA]);
      haptic.tap();
      if (!abierto) setMensajesNoLeidos(n => n + 1);

      // Buscar cada producto por ID individual para datos completos (imagen, nombre, precio)
      if (resultado.productos_recomendados?.length > 0) {
        try {
          const recomendados = await Promise.all(
            resultado.productos_recomendados.slice(0, 4).map(async (pid: string) => {
              try {
                const r = await api.getProducto(String(pid));
                const p = r.producto || r;
                if (p && p.nombre && p.imagen) return p;
                return null;
              } catch { return null; }
            })
          );
          const validos = recomendados.filter(Boolean);
          if (validos.length > 0) {
            setMensajes(prev => [...prev, {
              id: (Date.now() + 2).toString(),
              texto: '✨ Aquí están los productos que te recomiendo:',
              esUsuario: false,
              hora: new Date(),
              productos: validos,
            }]);
          }
        } catch {}
      }
    } catch (e: any) {
      safeError('🔴 ChatIA error:', e?.message || e);
      setMensajes(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        texto: 'Lo siento, no puedo conectarme ahora. ¿Puedo ayudarte con algo sobre moda?',
        esUsuario: false,
        hora: new Date(),
      }]);
    } finally {
      setEscribiendo(false);
    }
  };

  const limpiarHistorial = () => {
    setMensajes([MSG_INICIAL]);
    AsyncStorage.removeItem(CHAT_STORAGE_KEY).catch(() => {});
  };

  const hora = (d: Date) =>
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  // Solo visible para clientes autenticados
  if (!usuario || usuario.rol !== 'cliente') return null;

  return (
    <>
      {/* Mensaje fantasma — aparece una sola vez */}
      {fraseFantasma && (
        <View
          style={[
            styles.fantasma,
            {
              position: 'absolute',
              right: SCREEN.width - lastPos.current.x - 56,
              top: lastPos.current.y - 58,
            }
          ]}
        >
          <Animated.Text style={[styles.fantasmaTxt, { opacity: fantasmaOp }]}>{fraseFantasma}</Animated.Text>
          <View style={styles.fantasmaArrow} />
        </View>
      )}

      {/* Botón flotante draggable */}
      <Animated.View
        style={[styles.fab, fabPos.getLayout()]}
        {...panResponder.panHandlers}
      >
        <Animated.View style={{ transform: [{ scale: fabAnim }] }}>
          <TouchableOpacity
            style={styles.fabBtn}
            onPress={() => { setAbierto(true); setMensajesNoLeidos(0); setFraseFantasma(null); }}
          >
            <Ionicons name="sparkles" size={22} color={COLORS.dorado} />
          </TouchableOpacity>
        </Animated.View>
        <View style={styles.onlineDot} />
        {mensajesNoLeidos > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadTxt}>{mensajesNoLeidos}</Text>
          </View>
        )}
      </Animated.View>

      {/* Modal chat */}
      <Modal visible={abierto} animationType="slide" transparent onRequestClose={() => setAbierto(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.chatContainer}>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.avatarWrap}>
                  <EgosLogo size="sm" showSlogan={false} />
                </View>
                <View>
                  <Text style={styles.headerNombre}>Noa</Text>
                  <View style={styles.headerStatus}>
                    <View style={styles.statusDot} />
                    <Text style={styles.headerStatusTxt}>Asesora de moda EGOS</Text>
                  </View>
                </View>
              </View>
              <View style={styles.headerBtns}>
                <TouchableOpacity style={styles.headerBtn} onPress={limpiarHistorial}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>🗑</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerBtn} onPress={() => setAbierto(false)}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mensajes */}
            <ScrollView
              ref={scrollRef}
              style={styles.mensajes}
              contentContainerStyle={{ padding: SPACING.md, gap: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {mensajes.map(m => (
                <View key={m.id} style={{ alignItems: m.esUsuario ? 'flex-end' : 'flex-start' }}>
                  <View style={[styles.burbuja, m.esUsuario ? styles.burbujaUsuario : styles.burbujaIA]}>
                    {!m.esUsuario && (
                      <View style={styles.iaLabel}>
                        <View style={styles.iaDot}>
                          <Text style={{ fontSize: 8, color: COLORS.dorado }}>E</Text>
                        </View>
                        <Text style={styles.iaNombre}>Noa</Text>
                      </View>
                    )}
                    <Text style={[styles.burbujaTexto, m.esUsuario && { color: COLORS.blanco }]}>
                      {m.texto}
                    </Text>
                    <Text style={[styles.burbujaHora, m.esUsuario && { color: 'rgba(255,255,255,0.5)' }]}>
                      {hora(m.hora)}
                    </Text>
                  </View>
                  {/* Productos recomendados */}
                  {m.productos && m.productos.length > 0 && (
                    <View style={styles.productosWrap}>
                      {m.productos.map((p, idx) => {
                        const puntuacion = 0.85 + (idx * 0.03);
                        return (
                          <TouchableOpacity
                            key={p.id}
                            style={styles.productoCard}
                            onPress={() => { setAbierto(false); router.push(`/producto/${p.id}`); }}
                            activeOpacity={0.85}
                          >
                            {/* Imagen arriba */}
                            <ProductoImagen uri={p.imagen} />
                            {/* Info abajo */}
                            <View style={styles.productoInfo}>
                              <Text style={styles.productoCategoria} numberOfLines={1}>{p.categoria}</Text>
                              <Text style={styles.productoNombre} numberOfLines={2}>{p.nombre}</Text>
                              <Text style={styles.productoPrecio}>${p.precio?.toLocaleString('es-CO')}</Text>
                              {/* Match */}
                              <View style={styles.productoMatchWrap}>
                                <Text style={styles.productoMatchLabel}>Match:</Text>
                                <View style={styles.productoMatchBar}>
                                  <View style={[styles.productoMatchFill, { width: `${Math.round(puntuacion * 100)}%` as any }]} />
                                </View>
                                <Text style={styles.productoMatchPct}>{Math.round(puntuacion * 100)}%</Text>
                              </View>
                              {/* Botones */}
                              <View style={styles.productoBtns}>
                                <TouchableOpacity
                                  style={styles.productoBtnVer}
                                  onPress={() => { setAbierto(false); router.push(`/producto/${p.id}`); }}
                                >
                                  <Text style={styles.productoBtnVerTxt}>Ver detalles</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.productoBtnAgregar}
                                  onPress={() => {
                                    haptic.agregarCarrito();
                                    agregarItem(p);
                                    addNotification(`${p.nombre} agregado ✓`, 'success');
                                  }}
                                >
                                  <Text style={styles.productoBtnAgregarTxt}>🛒 Agregar</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}

              {escribiendo && (
                <View style={{ alignItems: 'flex-start' }}>
                  <View style={[styles.burbuja, styles.burbujaIA]}>
                    <View style={styles.iaLabel}>
                      <View style={styles.iaDot}>
                        <Text style={{ fontSize: 8, color: COLORS.dorado, fontFamily: 'BodoniModa-Regular' }}>E</Text>
                      </View>
                      <Text style={styles.iaNombre}>Noa</Text>
                    </View>
                    {/* Typing dots animados igual al web */}
                    <View style={{ flexDirection: 'row', gap: 4, paddingVertical: 4, alignItems: 'center' }}>
                      {[dot1, dot2, dot3].map((dot, i) => (
                        <Animated.View
                          key={i}
                          style={[styles.typingDot, { transform: [{ translateY: dot }] }]}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Quick actions solo en mensaje inicial */}
            {mensajes.length === 1 && (
              <View style={styles.quickActions}>
                {QUICK_ACTIONS.map((a, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.quickBtn}
                    onPress={() => enviar(a.replace(/[👗🎨💰📦]/g, '').trim())}
                  >
                    <Text style={styles.quickTxt}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Escribe tu mensaje..."
                placeholderTextColor={COLORS.textoGrisSub}
                onSubmitEditing={() => enviar(input)}
                returnKeyType="send"
                editable={!escribiendo}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || escribiendo) && { opacity: 0.4 }]}
                onPress={() => enviar(input)}
                disabled={!input.trim() || escribiendo}
              >
                {escribiendo
                  ? <ActivityIndicator color={COLORS.dorado} size="small" />
                  : <Text style={styles.sendIcon}>➤</Text>
                }
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', zIndex: 9997 },
  fabBtn: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: COLORS.negroHeader,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(197,164,126,0.4)',
    ...SHADOW.lg,
  },
  fantasma: {
    position: 'absolute',
    zIndex: 9996,
    backgroundColor: COLORS.negroHeader,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(197,164,126,0.3)',
    maxWidth: 200,
    ...SHADOW.md,
  },
  fantasmaTxt: {
    fontFamily: 'Prata-Regular',
    fontSize: 12,
    color: COLORS.blanco,
    lineHeight: 18,
  },
  fantasmaArrow: {
    position: 'absolute',
    bottom: -7,
    right: 20,
    width: 14, height: 14,
    backgroundColor: COLORS.negroHeader,
    borderRightWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(197,164,126,0.3)',
    transform: [{ rotate: '45deg' }],
  },
  onlineDot: {
    position: 'absolute', top: -3, right: -3,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#10b981', borderWidth: 2, borderColor: COLORS.blanco,
  },
  unreadBadge: {
    position: 'absolute', top: -6, left: -6,
    backgroundColor: '#ef4444', borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 4,
    borderWidth: 2, borderColor: COLORS.blanco,
  },
  unreadTxt: { color: COLORS.blanco, fontSize: 10, fontWeight: '800' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  chatContainer: {
    backgroundColor: COLORS.blanco,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    height: '85%', overflow: 'hidden',
  },
  header: {
    backgroundColor: COLORS.negroHeader,
    padding: SPACING.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: 'rgba(197,164,126,0.3)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.negro,
    borderWidth: 1, borderColor: 'rgba(197,164,126,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerNombre: { fontSize: 16, fontWeight: '700', color: COLORS.blanco },
  headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  headerStatusTxt: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  headerBtns: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  mensajes: { flex: 1, backgroundColor: '#f9fafb' },
  // Burbujas con colas igual al web
  burbuja: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  burbujaUsuario: {
    backgroundColor: COLORS.negroHeader,
    borderBottomRightRadius: 4, // cola derecha
  },
  burbujaIA: {
    backgroundColor: COLORS.blanco,
    borderBottomLeftRadius: 4, // cola izquierda
    borderWidth: 1, borderColor: '#e5d5c0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  iaLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  iaDot: {
    width: 20, height: 20, borderRadius: 4,
    backgroundColor: COLORS.negro,
    borderWidth: 1, borderColor: 'rgba(197,164,126,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  iaNombre: { fontSize: 11, fontWeight: '700', color: COLORS.doradoOscuro },
  burbujaTexto: { fontSize: 14, color: '#374151', lineHeight: 22 },
  burbujaHora: { fontSize: 10, color: COLORS.textoGrisSub, marginTop: 6, textAlign: 'right' },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.dorado },
  quickActions: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 8,
  },
  quickBtn: {
    padding: 12, backgroundColor: COLORS.blanco,
    borderRadius: RADIUS.xl, borderWidth: 1, borderColor: '#e5d5c0',
  },
  quickTxt: { fontSize: 13, color: '#374151' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: SPACING.md, backgroundColor: COLORS.blanco,
    borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 12,
  },
  input: {
    flex: 1, backgroundColor: '#f9fafb',
    borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, color: COLORS.textoNegro, maxHeight: 100,
    borderWidth: 1.5, borderColor: COLORS.bordeClaro,
  },
  sendBtn: {
    width: 48, height: 48, backgroundColor: COLORS.negroHeader,
    borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    ...SHADOW.md,
  },
  sendIcon: { color: COLORS.dorado, fontSize: 18 },
  // Productos recomendados — igual que web ProductRecommendation
  // Productos recomendados — vertical layout (imagen arriba, info abajo)
  productosWrap: { marginTop: 10, gap: 10, width: '90%' },
  productoCard: {
    backgroundColor: COLORS.blanco,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  productoImg: {
    width: '100%',
    backgroundColor: COLORS.fondoGris,
  },
  productoInfo: {
    padding: 12,
    gap: 6,
  },
  productoCategoria: {
    fontSize: 10,
    color: COLORS.textoGrisSub,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  productoNombre: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 19,
  },
  productoPrecio: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  productoMatchWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  productoMatchLabel: { fontSize: 11, color: COLORS.textoGrisSub },
  productoMatchBar: { flex: 1, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden', maxWidth: 80 },
  productoMatchFill: { height: '100%', backgroundColor: '#374151', borderRadius: 2 },
  productoMatchPct: { fontSize: 11, fontWeight: '700', color: '#374151' },
  productoBtns: { flexDirection: 'row', gap: 8, marginTop: 4 },
  productoBtnVer: {
    flex: 1, paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  productoBtnVerTxt: { fontSize: 12, color: COLORS.textoGrisMid, fontWeight: '600' },
  productoBtnAgregar: {
    flex: 2, paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.negroHeader,
    alignItems: 'center',
  },
  productoBtnAgregarTxt: { fontSize: 12, color: COLORS.dorado, fontWeight: '700' },
});
