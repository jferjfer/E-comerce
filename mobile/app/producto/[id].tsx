import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions, Modal,
  TextInput, Share, Platform, StatusBar as RNStatusBar
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { api } from '@/services/api';
import { useCartStore } from '@/store/useCartStore';
import { useUserStore } from '@/store/useUserStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Producto } from '@/types';
import ProductCard from '@/components/ProductCard';
import { haptic } from '@/hooks/useHaptics';

const { width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 44;
const REL_WIDTH = 140;

// Imagen relacionada con ratio real
function ImagenAdaptable({ uri, ancho }: { uri: string; ancho: number }) {
  const [alto, setAlto] = useState(ancho * 1.25);
  useEffect(() => {
    if (!uri) return;
    Image.getSize(
      uri,
      (w, h) => { if (w > 0 && h > 0) setAlto(Math.round(ancho * h / w)); },
      () => {}
    );
  }, [uri]);
  return (
    <Image
      source={{ uri }}
      style={{ width: ancho, height: alto, backgroundColor: '#f5f0eb' }}
      resizeMode="contain"
    />
  );
}

// Galería con swipe horizontal — alto calculado de la imagen más alta
function GaleriaSwipe({ imagenes, imgActiva, onCambiar }: {
  imagenes: string[];
  imgActiva: number;
  onCambiar: (i: number) => void;
}) {
  const [altoMax, setAltoMax] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!imagenes.length) return;
    const altos = new Array(imagenes.length).fill(0);
    let pendientes = imagenes.length;
    imagenes.forEach((uri, idx) => {
      Image.getSize(
        uri,
        (w, h) => {
          altos[idx] = w > 0 && h > 0 ? Math.round(width * h / w) : Math.round(width * 1.2);
          pendientes--;
          if (pendientes === 0) setAltoMax(Math.max(...altos));
        },
        () => {
          altos[idx] = Math.round(width * 1.2);
          pendientes--;
          if (pendientes === 0) setAltoMax(Math.max(...altos));
        }
      );
    });
  }, [imagenes.join(',')]);

  // Mientras calcula, mostrar la imagen con alto provisional sin brinco
  const alto = altoMax ?? Math.round(width * 1.2);

  return (
    <View style={{ width, height: alto, backgroundColor: '#f5f0eb', overflow: 'hidden' }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          if (idx !== imgActiva) { haptic.swipeImagen(); onCambiar(idx); }
        }}
      >
        {imagenes.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            style={{ width, height: alto, backgroundColor: '#f5f0eb' }}
            resizeMode="contain"
          />
        ))}
      </ScrollView>
    </View>
  );
}
const fmt = (n: number) => '$' + n.toLocaleString('es-CO');

export default function ProductoDetallePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [resenas, setResenas] = useState<any[]>([]);
  const [relacionados, setRelacionados] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [imgActiva, setImgActiva] = useState(0);
  const [tallaSeleccionada, setTallaSeleccionada] = useState('');
  const [colorSeleccionado, setColorSeleccionado] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [preguntas, setPreguntas] = useState<any[]>([]);
  const [modalResena, setModalResena] = useState(false);
  const [modalPregunta, setModalPregunta] = useState(false);
  const [nuevaResena, setNuevaResena] = useState({ calificacion: 5, comentario: '' });
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [enviando, setEnviando] = useState(false);

  const agregarItem = useCartStore(s => s.agregarItem);
  const { isFavorite, addToFavorites, removeFromFavorites } = useUserStore();
  const { token } = useAuthStore();
  const addNotification = useNotificationStore(s => s.addNotification);

  useEffect(() => {
    if (!id) return;
    cargar();
  }, [id]);

  const cargar = async () => {
    setCargando(true);
    try {
      const [dp, dr] = await Promise.all([
        api.getProducto(String(id)),
        api.getResenas(String(id)).catch(() => ({ resenas: [] })),
      ]);
      const p = dp.producto || dp;
      const prod: Producto = {
        id: p.id?.toString() || '',
        nombre: p.nombre || '',
        precio: p.precio || 0,
        imagen: p.imagen || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
        descripcion: p.descripcion || '',
        categoria: p.categoria || '',
        tallas: p.tallas || [],
        colores: p.colores || [],
        calificacion: p.calificacion || 0,
        en_stock: p.en_stock !== false,
        es_eco: p.es_eco || false,
        imagenes_adicionales: p.imagenes_adicionales || [],
      };
      setProducto(prod);
      if (prod.tallas?.length) setTallaSeleccionada(prod.tallas[0]);
      if (prod.colores?.length) setColorSeleccionado(prod.colores[0]);
      setResenas(dr.resenas || []);

      // Preguntas
      try {
        const dq = await api.getPreguntas(String(id));
        setPreguntas(dq.preguntas || []);
      } catch {}

      // Relacionados
      const dp2 = await api.getProductos({ limite: 50 });
      setRelacionados((dp2.productos || []).filter((x: Producto) => x.categoria === prod.categoria && x.id !== prod.id).slice(0, 4));
    } catch {
      addNotification('No se pudo cargar el producto', 'error');
      router.back();
    } finally {
      setCargando(false);
    }
  };

  const handleAgregar = () => {
    if (!producto) return;
    setAgregando(true);
    agregarItem(producto, tallaSeleccionada || undefined, colorSeleccionado || undefined);
    addNotification(`${producto.nombre} agregado al carrito`, 'success');
    haptic.agregarCarrito();
    setTimeout(() => setAgregando(false), 700);
  };

  const handleFav = () => {
    if (!producto) return;
    if (isFavorite(producto.id)) {
      haptic.favoritoRemove();
      removeFromFavorites(producto.id);
      addNotification('Eliminado de favoritos', 'info');
    } else {
      haptic.favoritoAdd();
      addToFavorites(producto.id);
      addNotification('Agregado a favoritos ❤️', 'success');
    }
  };

  const handleCompartir = async () => {
    if (!producto) return;
    haptic.compartir();
    try {
      await Share.share({
        title: producto.nombre,
        message: `¡Mira este producto en EGOS Colombia! 👗\n\n*${producto.nombre}*\n${producto.descripcion.slice(0, 80)}...\n\nPrecio: $${producto.precio.toLocaleString('es-CO')}\n\n🛒 Cómpralo en: https://egoscolombia.com.co/producto/${producto.id}`,
      });
    } catch {}
  };

  const handleEnviarResena = async () => {
    if (!token || !producto || !nuevaResena.comentario.trim()) return;
    setEnviando(true);
    const r = await api.crearResena(token, producto.id, nuevaResena.calificacion, nuevaResena.comentario.trim());
    setEnviando(false);
    if (r.exito || r.resena) {
      addNotification('Reseña enviada ✅', 'success');
      setModalResena(false);
      setNuevaResena({ calificacion: 5, comentario: '' });
      const dr = await api.getResenas(producto.id).catch(() => ({ resenas: [] }));
      setResenas(dr.resenas || []);
    } else {
      addNotification(r.error || 'Error al enviar reseña', 'error');
    }
  };

  const handleEnviarPregunta = async () => {
    if (!token || !producto || !nuevaPregunta.trim()) return;
    setEnviando(true);
    const r = await api.crearPregunta(token, producto.id, nuevaPregunta.trim());
    setEnviando(false);
    if (r.exito || r.pregunta) {
      addNotification('Pregunta enviada ✅', 'success');
      setModalPregunta(false);
      setNuevaPregunta('');
      const dq = await api.getPreguntas(producto.id).catch(() => ({ preguntas: [] }));
      setPreguntas(dq.preguntas || []);
    } else {
      addNotification(r.error || 'Error al enviar pregunta', 'error');
    }
  };

  const renderStars = (rating: number, size = 12) =>
    Array.from({ length: 5 }, (_, i) => (
      <Text key={i} style={{ fontSize: size, color: i < Math.round(rating) ? '#f59e0b' : COLORS.bordeClaro }}>★</Text>
    ));

  if (cargando) return <ActivityIndicator color={COLORS.dorado} size="large" style={{ flex: 1 }} />;
  if (!producto) return null;

  const imagenes = [producto.imagen, ...(producto.imagenes_adicionales || [])];
  const promedio = resenas.length
    ? resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length
    : producto.calificacion;
  const esFav = isFavorite(producto.id);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never">

      {/* Botón volver manual */}
      <TouchableOpacity style={styles.btnVolver} onPress={() => router.back()}>
        <Text style={styles.btnVolverTxt}>←</Text>
      </TouchableOpacity>

      {/* Galería con swipe horizontal */}
      <GaleriaSwipe
        imagenes={imagenes}
        imgActiva={imgActiva}
        onCambiar={setImgActiva}
      />

      {/* Overlays flotantes */}
      {producto.es_eco && (
        <View style={styles.ecoBadge}><Text style={styles.ecoBadgeTxt}>🌿 Eco</Text></View>
      )}
      {!producto.en_stock && (
        <View style={styles.agotadoOverlay}>
          <Text style={styles.agotadoTxt}>Agotado</Text>
        </View>
      )}
      <TouchableOpacity style={styles.shareBtn} onPress={handleCompartir}>
        <Text style={{ fontSize: 16 }}>🔗</Text>
      </TouchableOpacity>

      {/* Dots debajo de la imagen */}
      {imagenes.length > 1 && (
        <View style={styles.dotsRow}>
          {imagenes.map((_, i) => (
            <View key={i} style={[styles.dot, imgActiva === i && styles.dotActivo]} />
          ))}
        </View>
      )}

      {/* Info principal */}
      <View style={styles.info}>
        <Text style={styles.categoria}>{producto.categoria}</Text>
        <Text style={styles.nombre}>{producto.nombre}</Text>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <View style={{ flexDirection: 'row' }}>{renderStars(promedio)}</View>
          <Text style={styles.ratingTxt}>{promedio.toFixed(1)} ({resenas.length} reseña{resenas.length !== 1 ? 's' : ''})</Text>
        </View>

        {/* Precio */}
        <Text style={styles.precio}>{fmt(producto.precio)}</Text>

        {/* ADDI y Sistecredito — banner informativo */}
        {producto.en_stock && producto.precio >= 50000 && (
          <View style={styles.addiBanner}>
            <Text style={styles.addiTexto}>Págalo en cuotas con</Text>
            <Image
              source={require('../../assets/addi-logo.png')}
              style={styles.addiLogo}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 12, color: COLORS.bordeMedio }}>|</Text>
            <Image
              source={require('../../assets/sistecredito-logo.png')}
              style={{ width: 70, height: 16 }}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Stock */}
        <View style={[styles.stockBadge, { backgroundColor: producto.en_stock ? '#ecfdf5' : '#fef2f2' }]}>
          <Text style={{ color: producto.en_stock ? '#10b981' : '#ef4444', fontSize: 13, fontWeight: '600' }}>
            {producto.en_stock ? '✓ Disponible' : '✕ Agotado'}
          </Text>
        </View>

        {/* Descripción */}
        <Text style={styles.descripcion}>{producto.descripcion}</Text>

        {/* Tallas */}
        {producto.tallas && producto.tallas.length > 0 && (
          <View style={styles.selectorWrap}>
            <Text style={styles.selectorLabel}>Talla: <Text style={{ color: COLORS.negro, fontWeight: '700' }}>{tallaSeleccionada}</Text></Text>
            <View style={styles.opcionesRow}>
              {producto.tallas.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.opcion, tallaSeleccionada === t && styles.opcionActivo]}
                  onPress={() => setTallaSeleccionada(t)}
                >
                  <Text style={[styles.opcionTxt, tallaSeleccionada === t && styles.opcionTxtActivo]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Colores */}
        {producto.colores && producto.colores.length > 0 && (
          <View style={styles.selectorWrap}>
            <Text style={styles.selectorLabel}>Color: <Text style={{ color: COLORS.negro, fontWeight: '700' }}>{colorSeleccionado}</Text></Text>
            <View style={styles.opcionesRow}>
              {producto.colores.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.opcion, colorSeleccionado === c && styles.opcionActivo]}
                  onPress={() => setColorSeleccionado(c)}
                >
                  <Text style={[styles.opcionTxt, colorSeleccionado === c && styles.opcionTxtActivo]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.accionesRow}>
          <TouchableOpacity
            style={[styles.btnAgregar, !producto.en_stock && styles.btnAgotado, agregando && styles.btnAgregado]}
            onPress={handleAgregar}
            disabled={agregando || !producto.en_stock}
          >
            <Text style={styles.btnAgregarTxt}>
              {!producto.en_stock ? 'Agotado' : agregando ? '✓ Agregado' : '🛒 Agregar al carrito'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnFav, esFav && styles.btnFavActivo]}
            onPress={handleFav}
          >
            <Text style={{ fontSize: 18 }}>{esFav ? '♥' : '♡'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnShare} onPress={handleCompartir}>
            <Text style={{ fontSize: 18 }}>🔗</Text>
          </TouchableOpacity>
        </View>

        {/* Beneficios */}
        <View style={styles.beneficios}>
          {[
            { icon: '🚚', txt: 'Envío gratis' },
            { icon: '↩️', txt: '30 días devolución' },
            { icon: '🔒', txt: 'Compra segura' },
          ].map(b => (
            <View key={b.icon} style={styles.beneficio}>
              <Text style={{ fontSize: 18 }}>{b.icon}</Text>
              <Text style={styles.beneficioTxt}>{b.txt}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reseñas */}
      <View style={styles.seccion}>
        <View style={styles.seccionHeaderRow}>
          <Text style={styles.seccionTitulo}>Reseñas ({resenas.length})</Text>
          {token && (
            <TouchableOpacity style={styles.btnSeccion} onPress={() => setModalResena(true)}>
              <Text style={styles.btnSeccionTxt}>+ Escribir reseña</Text>
            </TouchableOpacity>
          )}
        </View>
        {resenas.length === 0 ? (
          <Text style={{ color: COLORS.textoGrisSub, fontSize: 13 }}>Aún no hay reseñas para este producto.</Text>
        ) : (
          resenas.map(r => (
            <View key={r.id} style={styles.resena}>
              <View style={styles.resenaHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.resenaAutor}>{r.usuario_nombre}</Text>
                  {r.verificado && (
                    <View style={styles.verificadoBadge}><Text style={styles.verificadoTxt}>✓ Verificado</Text></View>
                  )}
                </View>
                <Text style={styles.resenaFecha}>
                  {new Date(r.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 1, marginBottom: 4 }}>{renderStars(r.calificacion, 11)}</View>
              <Text style={styles.resenaComentario}>{r.comentario}</Text>
            </View>
          ))
        )}
      </View>

      {/* Preguntas */}
      <View style={styles.seccion}>
        <View style={styles.seccionHeaderRow}>
          <Text style={styles.seccionTitulo}>Preguntas ({preguntas.length})</Text>
          {token && (
            <TouchableOpacity style={styles.btnSeccion} onPress={() => setModalPregunta(true)}>
              <Text style={styles.btnSeccionTxt}>+ Hacer pregunta</Text>
            </TouchableOpacity>
          )}
        </View>
        {preguntas.length === 0 ? (
          <Text style={{ color: COLORS.textoGrisSub, fontSize: 13 }}>Sé el primero en preguntar.</Text>
        ) : (
          preguntas.map((p: any) => (
            <View key={p.id} style={styles.resena}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textoNegro, marginBottom: 4 }}>❓ {p.pregunta}</Text>
              {p.respuesta && (
                <View style={styles.respuestaWrap}>
                  <Text style={styles.respuestaTxt}>💬 {p.respuesta}</Text>
                </View>
              )}
              <Text style={styles.resenaFecha}>
                {p.usuario_nombre} · {new Date(p.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Relacionados */}
      {relacionados.length > 0 && (
        <View style={[styles.seccion, { backgroundColor: COLORS.fondoPagina }]}>
          <Text style={styles.seccionTitulo}>También te puede gustar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {relacionados.map(rel => (
              <TouchableOpacity key={rel.id} style={styles.relCard} onPress={() => router.push(`/producto/${rel.id}`)}>
                <ImagenAdaptable uri={rel.imagen} ancho={REL_WIDTH} />
                <View style={{ padding: 8 }}>
                  <Text style={{ fontSize: 9, color: COLORS.textoGrisSub, textTransform: 'uppercase' }}>{rel.categoria}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textoNegro }} numberOfLines={2}>{rel.nombre}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.negro }}>{fmt(rel.precio)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ height: 32 }} />

      {/* Modal reseña */}
      <Modal visible={modalResena} transparent animationType="slide" onRequestClose={() => setModalResena(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Escribir Reseña</Text>
            <Text style={styles.modalLabel}>Calificación</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {[1,2,3,4,5].map(n => (
                <TouchableOpacity key={n} onPress={() => setNuevaResena(p => ({ ...p, calificacion: n }))}>
                  <Text style={{ fontSize: 28, color: n <= nuevaResena.calificacion ? '#f59e0b' : COLORS.bordeClaro }}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalLabel}>Comentario</Text>
            <TextInput
              style={styles.modalTextArea}
              value={nuevaResena.comentario}
              onChangeText={v => setNuevaResena(p => ({ ...p, comentario: v }))}
              placeholder="Cuéntanos tu experiencia con este producto..."
              placeholderTextColor={COLORS.textoGrisSub}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { borderWidth: 1, borderColor: COLORS.bordeMedio }]} onPress={() => setModalResena(false)}>
                <Text style={{ color: COLORS.textoGrisMid }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: COLORS.dorado }, (enviando || !nuevaResena.comentario.trim()) && { opacity: 0.5 }]}
                onPress={handleEnviarResena}
                disabled={enviando || !nuevaResena.comentario.trim()}
              >
                {enviando ? <ActivityIndicator color={COLORS.negro} size="small" /> : <Text style={{ color: COLORS.negro, fontWeight: '700' }}>Enviar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal pregunta */}
      <Modal visible={modalPregunta} transparent animationType="slide" onRequestClose={() => setModalPregunta(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Hacer una Pregunta</Text>
            <Text style={styles.modalLabel}>Tu pregunta</Text>
            <TextInput
              style={styles.modalTextArea}
              value={nuevaPregunta}
              onChangeText={setNuevaPregunta}
              placeholder="¿Qué quieres saber sobre este producto?"
              placeholderTextColor={COLORS.textoGrisSub}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { borderWidth: 1, borderColor: COLORS.bordeMedio }]} onPress={() => setModalPregunta(false)}>
                <Text style={{ color: COLORS.textoGrisMid }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: COLORS.dorado }, (enviando || !nuevaPregunta.trim()) && { opacity: 0.5 }]}
                onPress={handleEnviarPregunta}
                disabled={enviando || !nuevaPregunta.trim()}
              >
                {enviando ? <ActivityIndicator color={COLORS.negro} size="small" /> : <Text style={{ color: COLORS.negro, fontWeight: '700' }}>Enviar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondoCard, paddingTop: STATUS_BAR_HEIGHT },
  galeria: { width, backgroundColor: '#f5f0eb', position: 'relative' },
  imgPrincipal: { width, backgroundColor: '#f5f0eb' },
  imgCounter: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  imgCounterTxt: { color: COLORS.blanco, fontSize: 11, fontWeight: '600' },
  btnVolver: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 8,
    left: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
  },
  btnVolverTxt: { color: COLORS.blanco, fontSize: 18, fontWeight: '700' },
  shareBtn: {
    position: 'absolute', top: STATUS_BAR_HEIGHT + 8, right: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  imgCounter: {
    position: 'absolute', top: STATUS_BAR_HEIGHT + 8, right: 56,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: RADIUS.full,
    zIndex: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#f5f0eb',
  },
  dot: { width: 6, height: 3, borderRadius: 2, backgroundColor: '#c4b9ab' },
  dotActivo: { width: 24, height: 3, borderRadius: 2, backgroundColor: '#111827' },
  ecoBadge: { position: 'absolute', top: STATUS_BAR_HEIGHT + 52, left: 12, backgroundColor: '#10b981', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, zIndex: 10 },
  agotadoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  info: { padding: SPACING.lg, backgroundColor: COLORS.fondoCard },
  categoria: { fontSize: 11, color: COLORS.textoGrisSub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  nombre: { fontSize: 22, fontWeight: '800', color: COLORS.textoNegro, marginBottom: 8, lineHeight: 28 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  ratingTxt: { fontSize: 12, color: COLORS.textoGrisMid },
  precio: { fontSize: 28, fontWeight: '800', color: COLORS.negro, marginBottom: 10 },
  addiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  addiTexto: { fontSize: 13, color: COLORS.textoGrisMid },
  addiCuota: { fontSize: 13, fontWeight: '700', color: COLORS.textoNegro },
  addiMarca: { fontSize: 13, fontWeight: '800', color: '#4cbd99' },
  addiLogo: { width: 42, height: 16 },
  stockBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, marginBottom: 12 },
  descripcion: { fontSize: 14, color: COLORS.textoGrisMid, lineHeight: 22, marginBottom: 16 },
  selectorWrap: { marginBottom: 16 },
  selectorLabel: { fontSize: 13, color: COLORS.textoGris, fontWeight: '600', marginBottom: 8 },
  opcionesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: COLORS.bordeClaro },
  opcionActivo: { borderColor: COLORS.negro, backgroundColor: COLORS.negro },
  opcionTxt: { fontSize: 13, color: COLORS.textoGris, fontWeight: '500' },
  opcionTxtActivo: { color: COLORS.dorado, fontWeight: '700' },
  accionesRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 16 },
  btnAgregar: { flex: 1, backgroundColor: COLORS.negro, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center' },
  btnAgotado: { backgroundColor: COLORS.fondoGris },
  btnAgregado: { backgroundColor: '#10b981' },
  btnAgregarTxt: { color: COLORS.blanco, fontWeight: '700', fontSize: 14 },
  btnFav: { width: 50, height: 50, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.bordeClaro, alignItems: 'center', justifyContent: 'center' },
  btnFavActivo: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  btnShare: { width: 50, height: 50, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.bordeClaro, alignItems: 'center', justifyContent: 'center' },
  beneficios: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.bordeClaro },
  beneficio: { alignItems: 'center', gap: 4 },
  beneficioTxt: { fontSize: 10, color: COLORS.textoGrisSub, textAlign: 'center' },
  seccion: { padding: SPACING.lg, backgroundColor: COLORS.fondoCard, borderTopWidth: 8, borderTopColor: COLORS.fondoGris },
  seccionTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.textoNegro, marginBottom: 14 },
  resena: { borderBottomWidth: 1, borderBottomColor: COLORS.bordeClaro, paddingBottom: 12, marginBottom: 12 },
  resenaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  resenaAutor: { fontSize: 13, fontWeight: '600', color: COLORS.textoNegro },
  verificadoBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full },
  verificadoTxt: { fontSize: 10, color: '#059669', fontWeight: '600' },
  resenaFecha: { fontSize: 11, color: COLORS.textoGrisSub },
  resenaComentario: { fontSize: 13, color: COLORS.textoGrisMid, lineHeight: 18 },
  relCard: { width: 140, backgroundColor: COLORS.fondoCard, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.bordeClaro, ...SHADOW.sm },
  relImg: { width: '100%', height: 180, backgroundColor: '#f5f0eb' },
  seccionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  btnSeccion: { backgroundColor: COLORS.fondoGris, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.bordeClaro },
  btnSeccionTxt: { fontSize: 12, color: COLORS.negro, fontWeight: '600' },
  respuestaWrap: { backgroundColor: '#f0fdf4', borderRadius: RADIUS.sm, padding: 8, marginVertical: 4, borderLeftWidth: 3, borderLeftColor: '#10b981' },
  respuestaTxt: { fontSize: 12, color: '#166534' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.fondoCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xxl },
  modalTitulo: { fontSize: 18, fontWeight: '800', color: COLORS.textoNegro, marginBottom: 16 },
  modalLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textoGrisMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  modalTextArea: { borderWidth: 1, borderColor: COLORS.bordeClaro, borderRadius: RADIUS.md, padding: 12, fontSize: 14, color: COLORS.textoNegro, backgroundColor: COLORS.fondoGris, minHeight: 100, textAlignVertical: 'top', marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center' },
});
