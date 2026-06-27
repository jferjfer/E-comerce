import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW, rf } from '@/constants';
import { api } from '@/services/api';
import { useScalePress } from '@/hooks/useAnimations';
import { haptic } from '@/hooks/useHaptics';

const PREGUNTAS = [
  {
    id: 1,
    titulo: '¿Para qué ocasiones compras ropa?',
    tipo: 'single',
    opciones: [
      { label: 'Trabajo', emoji: '💼' },
      { label: 'Casual', emoji: '👕' },
      { label: 'Fiesta', emoji: '🎉' },
      { label: 'Deporte', emoji: '⚡' },
      { label: 'Formal', emoji: '🎩' },
    ],
  },
  {
    id: 2,
    titulo: '¿Qué colores prefieres?',
    subtitulo: 'Elige todos los que quieras',
    tipo: 'multi',
    opciones: [
      { label: 'Negro', emoji: '🖤' },
      { label: 'Blanco', emoji: '🤍' },
      { label: 'Azul', emoji: '💙' },
      { label: 'Rojo', emoji: '❤️' },
      { label: 'Verde', emoji: '💚' },
      { label: 'Rosa', emoji: '🌸' },
      { label: 'Gris', emoji: '🩶' },
    ],
  },
  {
    id: 3,
    titulo: '¿Cómo describes tu estilo?',
    tipo: 'single',
    opciones: [
      { label: 'Clásico', emoji: '✨' },
      { label: 'Moderno', emoji: '🔮' },
      { label: 'Casual', emoji: '😎' },
      { label: 'Elegante', emoji: '👑' },
      { label: 'Deportivo', emoji: '🏃' },
      { label: 'Bohemio', emoji: '🌿' },
    ],
  },
];

function OpcionBtn({ label, emoji, activo, onPress }: any) {
  const { scale, onPressIn, onPressOut } = useScalePress();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.opcion, activo && styles.opcionActiva]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <Text style={styles.opcionEmoji}>{emoji}</Text>
        <Text style={[styles.opcionLabel, activo && styles.opcionLabelActiva]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function EstiloScreen() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [respuestas, setRespuestas] = useState<Record<number, any>>({});

  const pregunta = PREGUNTAS[step];
  const progreso = ((step + 1) / PREGUNTAS.length) * 100;

  const seleccionar = (label: string) => {
    haptic.tap();
    if (pregunta.tipo === 'single') {
      setRespuestas(p => ({ ...p, [pregunta.id]: label }));
    } else {
      const actual: string[] = respuestas[pregunta.id] || [];
      const nuevo = actual.includes(label)
        ? actual.filter(x => x !== label)
        : [...actual, label];
      setRespuestas(p => ({ ...p, [pregunta.id]: nuevo }));
    }
  };

  const estaActivo = (label: string) => {
    const val = respuestas[pregunta.id];
    if (pregunta.tipo === 'single') return val === label;
    return Array.isArray(val) && val.includes(label);
  };

  const puedeAvanzar = () => {
    const val = respuestas[pregunta.id];
    if (!val) return false;
    if (pregunta.tipo === 'multi') return (val as string[]).length > 0;
    return true;
  };

  const siguiente = async () => {
    haptic.tap();
    if (step < PREGUNTAS.length - 1) {
      setStep(s => s + 1);
    } else {
      await analizar();
    }
  };

  const analizar = async () => {
    setLoading(true);
    const ocasion = respuestas[1] || '';
    const colores = (respuestas[2] || []).join(', ');
    const estilo = respuestas[3] || '';
    const descripcion = `Ocasión: ${ocasion}, Colores: ${colores}, Estilo: ${estilo}`;
    const r = await api.analizarEstilo(descripcion).catch(() => ({ estilos: [] }));
    haptic.checkoutExito();
    setResultado({ ocasion, colores, estilo, data: r });
    setLoading(false);
  };

  const reiniciar = () => {
    setStep(0);
    setRespuestas({});
    setResultado(null);
  };

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={COLORS.dorado} size="large" />
        <Text style={styles.analizandoTxt}>Analizando tu estilo...</Text>
        <Text style={styles.analizandoSub}>La IA está personalizando tu experiencia</Text>
      </View>
    );
  }

  if (resultado) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header resultado */}
        <View style={styles.resultadoHeader}>
          <Text style={styles.resultadoEmoji}>✨</Text>
          <Text style={styles.resultadoTitulo}>Tu estilo es</Text>
          <Text style={styles.resultadoEstilo}>{resultado.estilo}</Text>
        </View>

        {/* Resumen */}
        <View style={styles.resumenCard}>
          <Text style={styles.resumenTitulo}>Tu perfil de estilo</Text>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Ocasión</Text>
            <Text style={styles.resumenValor}>{resultado.ocasion}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Colores favoritos</Text>
            <Text style={styles.resumenValor}>{resultado.colores}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Estilo</Text>
            <Text style={styles.resumenValor}>{resultado.estilo}</Text>
          </View>
        </View>

        {/* Descripción IA */}
        <View style={styles.iaCard}>
          <View style={styles.iaHeader}>
            <Text style={styles.iaIcon}>✦</Text>
            <Text style={styles.iaNombre}>Noa dice...</Text>
          </View>
          <Text style={styles.iaTexto}>
            Basado en tus preferencias, te recomendamos productos de estilo{' '}
            <Text style={{ color: COLORS.dorado, fontWeight: '700' }}>{resultado.estilo.toLowerCase()}</Text>
            {' '}en tonos{' '}
            <Text style={{ color: COLORS.dorado, fontWeight: '700' }}>{resultado.colores.toLowerCase()}</Text>.
            {' '}Perfectos para ocasiones de{' '}
            <Text style={{ color: COLORS.dorado, fontWeight: '700' }}>{resultado.ocasion.toLowerCase()}</Text>.
          </Text>
        </View>

        {/* Botones */}
        <TouchableOpacity
          style={styles.btnPrimario}
          onPress={() => router.push('/(tabs)/catalogo')}
        >
          <Text style={styles.btnPrimarioTxt}>Ver Productos Recomendados →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecundario} onPress={reiniciar}>
          <Text style={styles.btnSecundarioTxt}>Volver a analizar</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Descubre Tu Estilo</Text>
        <Text style={styles.headerSub}>Responde {PREGUNTAS.length} preguntas simples</Text>
      </View>

      {/* Barra de progreso */}
      <View style={styles.progresoWrap}>
        <View style={styles.progresoBarra}>
          <View style={[styles.progresoRelleno, { width: `${progreso}%` as any }]} />
        </View>
        <Text style={styles.progresoTxt}>{step + 1} de {PREGUNTAS.length}</Text>
      </View>

      {/* Pregunta */}
      <View style={styles.preguntaCard}>
        <Text style={styles.preguntaTitulo}>{pregunta.titulo}</Text>
        {pregunta.subtitulo && (
          <Text style={styles.preguntaSub}>{pregunta.subtitulo}</Text>
        )}

        <View style={styles.opcionesGrid}>
          {pregunta.opciones.map(op => (
            <OpcionBtn
              key={op.label}
              label={op.label}
              emoji={op.emoji}
              activo={estaActivo(op.label)}
              onPress={() => seleccionar(op.label)}
            />
          ))}
        </View>
      </View>

      {/* Botón siguiente */}
      <TouchableOpacity
        style={[styles.btnSiguiente, !puedeAvanzar() && { opacity: 0.4 }]}
        onPress={siguiente}
        disabled={!puedeAvanzar()}
      >
        <Text style={styles.btnSiguienteTxt}>
          {step < PREGUNTAS.length - 1 ? 'Siguiente →' : '✨ Ver Mi Estilo'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  content: { padding: SPACING.lg },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#faf8f5' },
  analizandoTxt: { fontSize: rf(18), fontWeight: '700', color: COLORS.textoNegro, marginTop: 20 },
  analizandoSub: { fontSize: rf(13), color: COLORS.textoGrisMid, marginTop: 8 },

  header: { alignItems: 'center', marginBottom: SPACING.xl, paddingTop: SPACING.lg },
  headerTitulo: { fontSize: rf(26), fontWeight: '800', color: COLORS.textoNegro, marginBottom: 6 },
  headerSub: { fontSize: rf(14), color: COLORS.textoGrisMid },

  progresoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.xl },
  progresoBarra: { flex: 1, height: 6, backgroundColor: COLORS.bordeClaro, borderRadius: 3, overflow: 'hidden' },
  progresoRelleno: { height: '100%', backgroundColor: COLORS.dorado, borderRadius: 3 },
  progresoTxt: { fontSize: rf(12), color: COLORS.textoGrisMid, fontWeight: '600' },

  preguntaCard: {
    backgroundColor: COLORS.fondoCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.bordeClaro,
    marginBottom: SPACING.xl,
    ...SHADOW.md,
  },
  preguntaTitulo: { fontSize: rf(18), fontWeight: '800', color: COLORS.textoNegro, marginBottom: 6 },
  preguntaSub: { fontSize: rf(13), color: COLORS.textoGrisMid, marginBottom: SPACING.lg },

  opcionesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: SPACING.md },
  opcion: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.bordeClaro,
    backgroundColor: COLORS.fondoCard,
  },
  opcionActiva: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  opcionEmoji: { fontSize: 16 },
  opcionLabel: { fontSize: rf(13), fontWeight: '600', color: COLORS.textoGris },
  opcionLabelActiva: { color: COLORS.dorado },

  btnSiguiente: {
    backgroundColor: COLORS.negro,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOW.sm,
  },
  btnSiguienteTxt: { color: COLORS.dorado, fontWeight: '700', fontSize: rf(15) },

  // Resultado
  resultadoHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.negroHeader,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    marginBottom: SPACING.lg,
  },
  resultadoEmoji: { fontSize: 48, marginBottom: 12 },
  resultadoTitulo: { fontSize: rf(14), color: COLORS.textoGrisMid, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  resultadoEstilo: { fontSize: rf(32), fontWeight: '800', color: COLORS.dorado },

  resumenCard: {
    backgroundColor: COLORS.fondoCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.bordeClaro,
    marginBottom: SPACING.lg,
    ...SHADOW.sm,
  },
  resumenTitulo: { fontSize: rf(13), fontWeight: '700', color: COLORS.textoGrisMid, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.bordeClaro },
  resumenLabel: { fontSize: rf(13), color: COLORS.textoGrisMid },
  resumenValor: { fontSize: rf(13), fontWeight: '700', color: COLORS.textoNegro },

  iaCard: {
    backgroundColor: COLORS.negroHeader,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(197,164,126,0.3)',
  },
  iaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  iaIcon: { color: COLORS.dorado, fontSize: 16 },
  iaNombre: { fontSize: rf(12), fontWeight: '700', color: COLORS.dorado, letterSpacing: 2, textTransform: 'uppercase' },
  iaTexto: { fontSize: rf(14), color: 'rgba(255,255,255,0.8)', lineHeight: 22 },

  btnPrimario: {
    backgroundColor: COLORS.dorado,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOW.sm,
  },
  btnPrimarioTxt: { color: COLORS.negro, fontWeight: '700', fontSize: rf(14) },
  btnSecundario: {
    borderWidth: 1, borderColor: COLORS.bordeMedio,
    borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center',
  },
  btnSecundarioTxt: { color: COLORS.textoGrisMid, fontWeight: '600', fontSize: rf(13) },
});
