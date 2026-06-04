import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, FlatList,
  TouchableOpacity, StyleSheet, TextInput,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '@/constants';
import { api } from '@/services/api';
import { Producto } from '@/types';
import ProductCard from '@/components/ProductCard';

export default function CatalogoScreen() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [orden, setOrden] = useState('relevancia');

  const cargar = async () => {
    try {
      const [dataProd, dataCat] = await Promise.all([
        api.getProductos({ limite: 100 }),
        api.getCategorias(),
      ]);
      setProductos(dataProd.productos || []);
      setCategorias((dataCat.categorias || []).map((c: any) => c.nombre || c));
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const productosFiltrados = productos
    .filter(p => {
      const matchB = busqueda === '' || p.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const matchC = categoria === '' || p.categoria === categoria;
      return matchB && matchC;
    })
    .sort((a, b) => {
      if (orden === 'precio_asc') return a.precio - b.precio;
      if (orden === 'precio_desc') return b.precio - a.precio;
      if (orden === 'nombre') return a.nombre.localeCompare(b.nombre);
      return 0;
    });

  return (
    <View style={styles.container}>
      {/* Barra filtros sticky */}
      <View style={styles.filtros}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            placeholderTextColor={COLORS.textoGrisSub}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda !== '' && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Text style={{ color: COLORS.textoGrisSub, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cats}>
          <TouchableOpacity
            style={[styles.catChip, categoria === '' && styles.catActivo]}
            onPress={() => setCategoria('')}
          >
            <Text style={[styles.catTxt, categoria === '' && styles.catActivoTxt]}>Todas</Text>
          </TouchableOpacity>
          {categorias.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.catChip, categoria === c && styles.catActivo]}
              onPress={() => setCategoria(c === categoria ? '' : c)}
            >
              <Text style={[styles.catTxt, categoria === c && styles.catActivoTxt]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.ordenRow}>
          {['relevancia', 'precio_asc', 'precio_desc', 'nombre'].map(o => (
            <TouchableOpacity
              key={o}
              style={[styles.ordenBtn, orden === o && styles.ordenActivo]}
              onPress={() => setOrden(o)}
            >
              <Text style={[styles.ordenTxt, orden === o && styles.ordenActivoTxt]}>
                {o === 'relevancia' ? 'Relevancia'
                  : o === 'precio_asc' ? 'Precio ↑'
                  : o === 'precio_desc' ? 'Precio ↓'
                  : 'A-Z'}
              </Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.contador}>{productosFiltrados.length}</Text>
        </View>
      </View>

      {/* Grid */}
      {cargando ? (
        <ActivityIndicator color={COLORS.dorado} size="large" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={productosFiltrados}
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
            <ProductCard
              producto={item}
              onVerDetalles={(p) => router.push(`/producto/${p.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
              <Text style={{ color: COLORS.textoGrisMid, fontSize: 15 }}>Sin resultados</Text>
              <TouchableOpacity onPress={() => { setBusqueda(''); setCategoria(''); }}>
                <Text style={{ color: COLORS.negro, fontWeight: '600', marginTop: 8 }}>Limpiar filtros</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.fondoGris,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textoNegro, padding: 0 },
  cats: { marginBottom: 6 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1,
    borderColor: COLORS.bordeMedio, marginLeft: SPACING.lg,
    backgroundColor: COLORS.fondoCard,
  },
  catActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  catTxt: { fontSize: 12, color: COLORS.textoGris, fontWeight: '500' },
  catActivoTxt: { color: COLORS.dorado, fontWeight: '600' },
  ordenRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: 8,
    gap: 6,
    alignItems: 'center',
  },
  ordenBtn: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.fondoGris,
  },
  ordenActivo: { backgroundColor: COLORS.negro },
  ordenTxt: { fontSize: 11, color: COLORS.textoGrisMid },
  ordenActivoTxt: { color: COLORS.dorado, fontWeight: '600' },
  contador: { marginLeft: 'auto', fontSize: 11, color: COLORS.textoGrisSub },
  row: { paddingHorizontal: SPACING.lg, justifyContent: 'space-between' },
  grid: { paddingTop: SPACING.md, paddingBottom: 24 },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
});
