import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, FlatList,
  TouchableOpacity, Image, StyleSheet,
  TextInput, ActivityIndicator, RefreshControl,
  Dimensions, StatusBar
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Producto } from '@/types';
import ProductCard from '@/components/ProductCard';
import EgosLogo from '@/components/EgosLogo';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { usuario, estaAutenticado } = useAuthStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  const cargar = async () => {
    try {
      const [dataProd, dataCat] = await Promise.all([
        api.getProductos({ limite: 50 }),
        api.getCategorias(),
      ]);
      setProductos(dataProd.productos || []);
      const cats = (dataCat.categorias || []).map((c: any) => c.nombre || c);
      setCategorias(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const productosFiltrados = productos.filter(p => {
    const matchBusqueda = busqueda === '' ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = categoriaFiltro === '' || p.categoria === categoriaFiltro;
    return matchBusqueda && matchCategoria;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.negroHeader} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); cargar(); }}
            tintColor={COLORS.dorado}
          />
        }
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <EgosLogo size="md" showSlogan />
          {estaAutenticado && (
            <Text style={styles.saludo}>
              Hola, <Text style={styles.saludoNombre}>{usuario?.nombre}</Text> 👋
            </Text>
          )}
        </View>

        {/* ── HERO BANNER ── */}
        <TouchableOpacity
          style={styles.hero}
          onPress={() => router.push('/(tabs)/catalogo')}
          activeOpacity={0.95}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop' }}
            style={styles.heroImg}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitulo}>Nueva Colección</Text>
            <Text style={styles.heroSub}>Descubre las últimas tendencias</Text>
            <View style={styles.heroBtn}>
              <Text style={styles.heroBtnTxt}>Ver catálogo →</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── BARRA FILTROS ── */}
        <View style={styles.filtros}>
          {/* Búsqueda */}
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
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Categorías scroll horizontal */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriasScroll}
            contentContainerStyle={styles.categoriasContent}
          >
            <TouchableOpacity
              style={[styles.catChip, categoriaFiltro === '' && styles.catChipActivo]}
              onPress={() => setCategoriaFiltro('')}
            >
              <Text style={[styles.catChipTxt, categoriaFiltro === '' && styles.catChipTxtActivo]}>
                Todas
              </Text>
            </TouchableOpacity>
            {categorias.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, categoriaFiltro === cat && styles.catChipActivo]}
                onPress={() => setCategoriaFiltro(cat === categoriaFiltro ? '' : cat)}
              >
                <Text style={[styles.catChipTxt, categoriaFiltro === cat && styles.catChipTxtActivo]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.contador}>
            {cargando ? '...' : `${productosFiltrados.length} productos`}
          </Text>
        </View>

        {/* ── GRID PRODUCTOS ── */}
        {cargando ? (
          <ActivityIndicator color={COLORS.dorado} size="large" style={{ margin: 40 }} />
        ) : productosFiltrados.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioIcon}>🔍</Text>
            <Text style={styles.vacioTxt}>No se encontraron productos</Text>
            <TouchableOpacity onPress={() => { setBusqueda(''); setCategoriaFiltro(''); }}>
              <Text style={styles.vacioLink}>Limpiar filtros</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {productosFiltrados.map((p, i) => (
              <ProductCard
                key={p.id || i}
                producto={p}
                onVerDetalles={(prod) => router.push(`/producto/${prod.id}`)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondoPagina },

  // Header
  header: {
    backgroundColor: COLORS.negroHeader,
    paddingTop: 50,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197,164,126,0.2)',
  },
  saludo: {
    marginTop: 8,
    fontSize: 13,
    color: '#9ca3af',
  },
  saludoNombre: {
    color: COLORS.dorado,
    fontWeight: '600',
  },

  // Hero
  hero: {
    margin: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    height: 180,
    ...SHADOW.md,
  },
  heroImg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitulo: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.dorado,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  heroBtn: {
    backgroundColor: COLORS.dorado,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  heroBtnTxt: {
    color: COLORS.negro,
    fontWeight: '700',
    fontSize: 13,
  },

  // Filtros
  filtros: {
    backgroundColor: COLORS.fondoCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeClaro,
    paddingTop: SPACING.sm,
    ...SHADOW.sm,
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
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textoNegro,
    padding: 0,
  },
  clearBtn: { fontSize: 14, color: COLORS.textoGrisSub, paddingLeft: 4 },
  categoriasScroll: { marginBottom: 6 },
  categoriasContent: {
    paddingHorizontal: SPACING.lg,
    gap: 8,
    flexDirection: 'row',
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.bordeMedio,
    backgroundColor: COLORS.fondoCard,
  },
  catChipActivo: {
    backgroundColor: COLORS.negro,
    borderColor: COLORS.negro,
  },
  catChipTxt: {
    fontSize: 12,
    color: COLORS.textoGris,
    fontWeight: '500',
  },
  catChipTxtActivo: {
    color: COLORS.dorado,
    fontWeight: '600',
  },
  contador: {
    fontSize: 11,
    color: COLORS.textoGrisSub,
    textAlign: 'right',
    paddingHorizontal: SPACING.lg,
    paddingBottom: 8,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
  },

  // Vacío
  vacio: {
    alignItems: 'center',
    padding: 40,
  },
  vacioIcon: { fontSize: 40, marginBottom: 12 },
  vacioTxt: { fontSize: 15, color: COLORS.textoGrisMid, marginBottom: 8 },
  vacioLink: { fontSize: 14, color: COLORS.negro, fontWeight: '600' },
});
