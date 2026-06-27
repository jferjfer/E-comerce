import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, RefreshControl, ScrollView, Modal
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { api } from '@/services/api';
import { Producto } from '@/types';
import ProductCard from '@/components/ProductCard';
import { useAppPrefs } from '@/store/useAppPrefs';
import { networkCache } from '@/hooks/useNetwork';

const POR_PAGINA = 20;
const CAT_RESTRINGIDA = 'Lencería';

export default function CatalogoScreen() {
  const { lenceriaConfirmada, confirmarLenceria } = useAppPrefs();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [orden, setOrden] = useState('relevance');
  const [pagina, setPagina] = useState(1);
  const [modalAdultos, setModalAdultos] = useState(false);

  const cargar = async () => {
    try {
      const [dp, dc] = await Promise.all([
        api.getProductos({ limite: 200 }),
        api.getCategorias(),
      ]);
      setProductos(dp.productos || []);
      setCategorias((dc.categorias || []).map((c: any) => c.nombre || c));
      networkCache.guardarProductos(dp.productos || []);
    } catch {
      const cached = await networkCache.obtenerProductos();
      if (cached.length > 0) setProductos(cached);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => {
    let f = [...productos];
    if (categoria !== CAT_RESTRINGIDA) {
      f = f.filter(p => p.categoria !== CAT_RESTRINGIDA);
    }
    if (categoria) f = f.filter(p => p.categoria === categoria);
    if (busqueda) f = f.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    if (orden === 'price-low') f.sort((a, b) => a.precio - b.precio);
    else if (orden === 'price-high') f.sort((a, b) => b.precio - a.precio);
    return f;
  }, [productos, categoria, busqueda, orden]);

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const paginaItems = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const paginasVisibles = Array.from({ length: totalPaginas }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1);

  const handleCatPress = (cat: string) => {
    if (cat === CAT_RESTRINGIDA && !lenceriaConfirmada) {
      setModalAdultos(true);
      return;
    }
    setCategoria(cat);
    setPagina(1);
  };

  const confirmar18 = () => {
    confirmarLenceria();
    setModalAdultos(false);
    setCategoria(CAT_RESTRINGIDA);
    setPagina(1);
  };

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtros}>
        <View style={styles.searchBox}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            placeholderTextColor={COLORS.textoGrisSub}
            value={busqueda}
            onChangeText={v => { setBusqueda(v); setPagina(1); }}
          />
          {busqueda ? (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Text style={{ color: COLORS.textoGrisSub }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 6 }}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: 8 }}
        >
          {['', ...categorias].map(cat => (
            <TouchableOpacity
              key={cat || '__todas'}
              style={[styles.catChip, categoria === cat && styles.catActivo]}
              onPress={() => handleCatPress(cat)}
            >
              <Text style={[styles.catTxt, categoria === cat && styles.catActivoTxt]}>
                {cat || 'Todas'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.ordenRow}>
          {[
            { k: 'relevance', l: 'Relevancia' },
            { k: 'price-low', l: 'Precio ↑' },
            { k: 'price-high', l: 'Precio ↓' },
          ].map(o => (
            <TouchableOpacity
              key={o.k}
              style={[styles.ordenBtn, orden === o.k && styles.ordenActivo]}
              onPress={() => setOrden(o.k)}
            >
              <Text style={[styles.ordenTxt, orden === o.k && styles.ordenActivoTxt]}>{o.l}</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.contador}>
            {cargando ? '...' : `${filtrados.length} productos`}
          </Text>
        </View>
      </View>

      {/* Grid */}
      {cargando ? (
        <ActivityIndicator color={COLORS.dorado} size="large" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={paginaItems}
          keyExtractor={(item, i) => item.id || String(i)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); cargar(); }}
              tintColor={COLORS.dorado}
            />
          }
          renderItem={({ item }) => (
            <ProductCard producto={item} onVerDetalles={p => router.push(`/producto/${p.id}`)} />
          )}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
              <Text style={{ color: COLORS.textoGrisMid, fontSize: 15, marginBottom: 8 }}>
                Sin resultados
              </Text>
              <TouchableOpacity onPress={() => { setBusqueda(''); setCategoria(''); }}>
                <Text style={{ color: COLORS.negro, fontWeight: '600' }}>Limpiar filtros</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            totalPaginas > 1 ? (
              <View style={styles.paginacion}>
                <TouchableOpacity
                  style={[styles.pgBtn, pagina === 1 && styles.pgBtnDis]}
                  onPress={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                >
                  <Text style={[styles.pgTxt, pagina === 1 && { opacity: 0.3 }]}>‹</Text>
                </TouchableOpacity>

                {paginasVisibles
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <Text key={`d${i}`} style={styles.pgDots}>…</Text>
                    ) : (
                      <TouchableOpacity
                        key={p}
                        style={[styles.pgBtn, pagina === p && styles.pgBtnActivo]}
                        onPress={() => setPagina(p as number)}
                      >
                        <Text style={[styles.pgTxt, pagina === p && styles.pgTxtActivo]}>{p}</Text>
                      </TouchableOpacity>
                    )
                  )}

                <TouchableOpacity
                  style={[styles.pgBtn, pagina === totalPaginas && styles.pgBtnDis]}
                  onPress={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                >
                  <Text style={[styles.pgTxt, pagina === totalPaginas && { opacity: 0.3 }]}>›</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {/* Modal +18 */}
      <Modal
        visible={modalAdultos}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAdultos(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>🔞</Text>
            <Text style={styles.modalTitulo}>Contenido para adultos</Text>
            <Text style={styles.modalDesc}>
              Esta categoría contiene lencería y ropa interior.{'\n'}
              ¿Confirmas que eres mayor de{' '}
              <Text style={{ fontWeight: '800' }}>18 años</Text>?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnCancelar}
                onPress={() => setModalAdultos(false)}
              >
                <Text style={styles.modalBtnCancelarTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirmar}
                onPress={confirmar18}
              >
                <Text style={styles.modalBtnConfirmarTxt}>Sí, tengo 18+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalNota}>
              Al confirmar aceptas ver contenido de lencería.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondoPagina },
  filtros: {
    backgroundColor: COLORS.fondoCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeClaro,
    paddingTop: SPACING.sm,
    ...SHADOW.sm,
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.fondoGris,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 9,
    marginBottom: SPACING.sm, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textoNegro, padding: 0 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1,
    borderColor: COLORS.bordeMedio, backgroundColor: COLORS.fondoCard,
  },
  catActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  catTxt: { fontSize: 12, color: COLORS.textoGris, fontWeight: '500' },
  catActivoTxt: { color: COLORS.dorado, fontWeight: '600' },
  ordenRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg,
    paddingBottom: 8, gap: 6, alignItems: 'center',
  },
  ordenBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.sm, backgroundColor: COLORS.fondoGris,
  },
  ordenActivo: { backgroundColor: COLORS.negro },
  ordenTxt: { fontSize: 11, color: COLORS.textoGrisMid },
  ordenActivoTxt: { color: COLORS.dorado, fontWeight: '600' },
  contador: { marginLeft: 'auto', fontSize: 11, color: COLORS.textoGrisSub },
  row: { paddingHorizontal: SPACING.lg, justifyContent: 'space-between' },
  grid: { paddingTop: SPACING.md, paddingBottom: 8 },
  vacio: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  paginacion: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 6,
    paddingVertical: 16, paddingHorizontal: SPACING.lg,
  },
  pgBtn: {
    width: 36, height: 36,
    borderRadius: RADIUS.sm, borderWidth: 1,
    borderColor: COLORS.bordeMedio,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.fondoCard,
  },
  pgBtnActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  pgBtnDis: { opacity: 0.4 },
  pgTxt: { fontSize: 14, color: COLORS.textoGrisMid, fontWeight: '500' },
  pgTxtActivo: { color: COLORS.dorado, fontWeight: '700' },
  pgDots: { fontSize: 14, color: COLORS.textoGrisSub, paddingHorizontal: 4 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  modalCard: {
    backgroundColor: COLORS.fondoCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    width: '100%',
    alignItems: 'center',
    ...SHADOW.lg,
  },
  modalEmoji: { fontSize: 48, marginBottom: 12 },
  modalTitulo: {
    fontSize: 18, fontWeight: '800',
    color: COLORS.textoNegro, marginBottom: 10, textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14, color: COLORS.textoGrisMid,
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnCancelar: {
    flex: 1, borderWidth: 1, borderColor: COLORS.bordeMedio,
    borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center',
  },
  modalBtnCancelarTxt: { fontSize: 14, color: COLORS.textoGrisMid, fontWeight: '600' },
  modalBtnConfirmar: {
    flex: 1, backgroundColor: COLORS.negro,
    borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center',
  },
  modalBtnConfirmarTxt: { fontSize: 14, color: COLORS.dorado, fontWeight: '700' },
  modalNota: { fontSize: 11, color: COLORS.textoGrisSub, marginTop: 14, textAlign: 'center' },
});
