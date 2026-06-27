import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW, rf } from '@/constants';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { api } from '@/services/api';

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={{ fontSize: 20, marginRight: 14 }}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

function CampoInfo({ label, valor }: { label: string; valor: string }) {
  if (!valor) return null;
  return (
    <View style={styles.campoWrap}>
      <Text style={styles.campoLabel}>{label}</Text>
      <Text style={styles.campoValor}>{valor}</Text>
    </View>
  );
}

export default function PerfilScreen() {
  const { usuario, token, estaAutenticado, cerrarSesion } = useAuthStore();
  const { favorites } = useUserStore();
  const addNotification = useNotificationStore(s => s.addNotification);

  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const [form, setForm] = useState({ nombre: '', telefono: '', direccion: '', ciudad: '' });

  useEffect(() => {
    if (!token) { setCargando(false); return; }
    api.getPerfil(token).then(d => {
      if (d.datos) {
        setPerfil(d.datos);
        setForm({
          nombre: d.datos.nombre || '',
          telefono: d.datos.telefono || '',
          direccion: d.datos.direccion || '',
          ciudad: d.datos.ciudad || '',
        });
      }
    }).catch(() => {
      // Fallback al store
      setPerfil(usuario);
      setForm({ nombre: usuario?.nombre || '', telefono: '', direccion: '', ciudad: '' });
    }).finally(() => setCargando(false));
  }, [token]);

  const handleGuardar = async () => {
    if (!token) return;
    setGuardando(true);
    const r = await api.actualizarPerfil(token, form);
    setGuardando(false);
    if (r.exito || r.datos) {
      setEditando(false);
      if (r.datos) setPerfil((prev: any) => ({ ...prev, ...r.datos }));
      addNotification('Perfil actualizado ✅', 'success');
    } else {
      addNotification(r.error || 'Error al actualizar', 'error');
    }
  };

  const handleLogout = () =>
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Cancelar' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: () => { cerrarSesion(); router.replace('/login'); } },
    ]);

  if (!estaAutenticado) {
    return (
      <View style={styles.noAuth}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>👤</Text>
        <Text style={styles.noAuthTitulo}>Inicia sesión</Text>
        <Text style={styles.noAuthSub}>para acceder a tu perfil</Text>
        <TouchableOpacity style={styles.btnPrimario} onPress={() => router.push('/login')}>
          <Text style={styles.btnPrimarioTxt}>Iniciar Sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecundario} onPress={() => router.push('/registro')}>
          <Text style={styles.btnSecundarioTxt}>Crear cuenta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Usar perfil completo del API o fallback al store
  const datos = perfil || usuario;
  const nombreCompleto = [datos?.nombre, datos?.apellido].filter(Boolean).join(' ') || 'Usuario';
  const inicial = nombreCompleto.charAt(0).toUpperCase();
  const esCliente = datos?.rol === 'cliente';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Avatar header */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{inicial}</Text>
        </View>
        <Text style={styles.nombre}>{nombreCompleto}</Text>
        <Text style={styles.email}>{datos?.email}</Text>
        <View style={styles.rolBadge}>
          <Text style={styles.rolTxt}>{datos?.rol?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Información personal */}
      <View style={styles.seccion}>
        <View style={styles.seccionHeader}>
          <Text style={styles.seccionTitulo}>Información Personal</Text>
          {esCliente && !editando && (
            <TouchableOpacity onPress={() => setEditando(true)}>
              <Text style={styles.editarBtn}>✏️ Editar</Text>
            </TouchableOpacity>
          )}
          {editando && (
            <TouchableOpacity onPress={() => setEditando(false)}>
              <Text style={styles.editarBtn}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        {cargando ? (
          <ActivityIndicator color={COLORS.dorado} style={{ marginVertical: 20 }} />
        ) : editando ? (
          // Modo edición
          <>
            {[
              { key: 'nombre', label: 'Nombre completo', keyboard: 'default' as const },
              { key: 'telefono', label: 'Teléfono', keyboard: 'phone-pad' as const },
              { key: 'direccion', label: 'Dirección', keyboard: 'default' as const },
              { key: 'ciudad', label: 'Ciudad', keyboard: 'default' as const },
            ].map(({ key, label, keyboard }) => (
              <View key={key} style={styles.campoWrap}>
                <Text style={styles.campoLabel}>{label}</Text>
                <TextInput
                  style={styles.campoInput}
                  value={form[key as keyof typeof form]}
                  onChangeText={v => setForm(p => ({ ...p, [key]: v }))}
                  keyboardType={keyboard}
                  placeholderTextColor={COLORS.textoGrisSub}
                  placeholder={`Tu ${label.toLowerCase()}`}
                />
              </View>
            ))}
            <View style={styles.campoWrap}>
              <Text style={styles.campoLabel}>Email</Text>
              <Text style={[styles.campoValor, { color: COLORS.textoGrisSub }]}>{datos?.email}</Text>
              <Text style={{ fontSize: 10, color: COLORS.textoGrisSub, marginTop: 2 }}>No se puede modificar</Text>
            </View>
            <TouchableOpacity
              style={[styles.btnGuardar, guardando && { opacity: 0.7 }]}
              onPress={handleGuardar}
              disabled={guardando}
            >
              {guardando
                ? <ActivityIndicator color={COLORS.negro} />
                : <Text style={styles.btnGuardarTxt}>💾 Guardar Cambios</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          // Modo visualización
          <>
            <CampoInfo label="Nombre completo" valor={nombreCompleto} />
            <CampoInfo label="Email" valor={datos?.email || ''} />
            <CampoInfo label="Teléfono" valor={datos?.telefono || ''} />
            <CampoInfo label="Documento" valor={datos?.documento_tipo && datos?.documento_numero ? `${datos.documento_tipo}: ${datos.documento_numero}` : ''} />
            <CampoInfo label="Dirección" valor={datos?.direccion || ''} />
            <CampoInfo label="Ciudad" valor={datos?.ciudad || ''} />
            {!datos?.telefono && !datos?.direccion && (
              <TouchableOpacity onPress={() => setEditando(true)} style={styles.completarPerfil}>
                <Text style={styles.completarPerfilTxt}>+ Completar información del perfil</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Menú cuenta */}
      <Text style={styles.seccionMenu}>MI CUENTA</Text>
      <View style={styles.menu}>
        <MenuItem icon="📦" label="Mis Pedidos" onPress={() => router.push('/(tabs)/pedidos')} />
        <MenuItem icon="❤️" label={`Favoritos${favorites.length > 0 ? ` (${favorites.length})` : ''}`} onPress={() => router.push('/favoritos')} />
        <MenuItem icon="💳" label="Métodos de Pago" onPress={() => router.push('/pagos')} />
        {esCliente && <MenuItem icon="💰" label="Crédito EGOS" onPress={() => router.push('/credito')} />}
        {esCliente && <MenuItem icon="✨" label="Descubre Tu Estilo" onPress={() => router.push('/estilo')} />}
      </View>

      {/* Legal */}
      <Text style={styles.seccionMenu}>LEGAL</Text>
      <View style={styles.menu}>
        <MenuItem icon="📄" label="Términos y Condiciones" onPress={() => router.push(`/webview?url=${encodeURIComponent('https://egoscolombia.com.co/terminos')}`)} />
        <MenuItem icon="🔒" label="Privacidad" onPress={() => router.push(`/webview?url=${encodeURIComponent('https://egoscolombia.com.co/privacidad')}`)} />
        <MenuItem icon="🍪" label="Cookies" onPress={() => router.push(`/webview?url=${encodeURIComponent('https://egoscolombia.com.co/cookies')}`)} />
        <MenuItem icon="↩️" label="Devoluciones" onPress={() => router.push(`/webview?url=${encodeURIComponent('https://egoscolombia.com.co/devoluciones')}`)} />
      </View>

      {/* Empresa */}
      <Text style={styles.seccionMenu}>EMPRESA</Text>
      <View style={styles.menu}>
        <MenuItem icon="🏢" label="Sobre Nosotros" onPress={() => router.push(`/webview?url=${encodeURIComponent('https://egoscolombia.com.co/sobre-nosotros')}`)} />
        <MenuItem icon="🌱" label="Sostenibilidad" onPress={() => router.push(`/webview?url=${encodeURIComponent('https://egoscolombia.com.co/sostenibilidad')}`)} />
        <MenuItem icon="💼" label="Trabaja con Nosotros" onPress={() => router.push(`/webview?url=${encodeURIComponent('https://egoscolombia.com.co/trabaja-con-nosotros')}`)} />
        <MenuItem icon="📰" label="Prensa" onPress={() => router.push(`/webview?url=${encodeURIComponent('https://egoscolombia.com.co/prensa')}`)} />
      </View>

      {/* Info empresa */}
      <View style={styles.infoEmpresa}>
        <Text style={styles.infoEmpresaTxt}>EGOS Colombia — Wear Your Truth</Text>
        <Text style={styles.infoEmpresaSub}>VERTEL & CATILLO S.A.S · NIT 902.051.708-6</Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Text style={styles.btnLogoutTxt}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  noAuth: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#faf8f5' },
  noAuthTitulo: { fontSize: rf(18), fontWeight: '700', color: COLORS.textoNegro, marginBottom: 8 },
  noAuthSub: { fontSize: rf(14), color: COLORS.textoGrisMid, marginBottom: 24 },
  btnPrimario: { backgroundColor: COLORS.negro, paddingHorizontal: 24, paddingVertical: 14, borderRadius: RADIUS.md, width: '100%', alignItems: 'center', marginBottom: 12 },
  btnPrimarioTxt: { color: COLORS.dorado, fontWeight: '700', fontSize: rf(15) },
  btnSecundario: { borderWidth: 1.5, borderColor: COLORS.negro, paddingHorizontal: 24, paddingVertical: 13, borderRadius: RADIUS.md, width: '100%', alignItems: 'center' },
  btnSecundarioTxt: { color: COLORS.negro, fontWeight: '600', fontSize: rf(15) },

  // Avatar
  avatarSection: { backgroundColor: COLORS.negroHeader, alignItems: 'center', paddingVertical: 32, paddingTop: 40 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.doradoOscuro, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'rgba(197,164,126,0.5)' },
  avatarTxt: { fontSize: rf(30), fontWeight: '800', color: COLORS.blanco },
  nombre: { fontSize: rf(20), fontWeight: '700', color: COLORS.blanco, marginBottom: 4 },
  email: { fontSize: rf(13), color: '#9ca3af', marginBottom: 8 },
  rolBadge: { backgroundColor: 'rgba(197,164,126,0.2)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(197,164,126,0.3)' },
  rolTxt: { fontSize: rf(11), color: COLORS.dorado, fontWeight: '600', letterSpacing: 1.5 },

  // Sección info personal
  seccion: { backgroundColor: COLORS.fondoCard, margin: SPACING.lg, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.bordeClaro, ...SHADOW.sm },
  seccionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seccionTitulo: { fontSize: rf(15), fontWeight: '700', color: COLORS.textoNegro },
  editarBtn: { fontSize: rf(13), color: COLORS.negro, fontWeight: '600' },

  campoWrap: { marginBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.bordeClaro, paddingBottom: 10 },
  campoLabel: { fontSize: rf(11), fontWeight: '700', color: COLORS.textoGrisSub, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  campoValor: { fontSize: rf(14), color: COLORS.textoNegro, fontWeight: '500' },
  campoInput: { borderWidth: 1, borderColor: COLORS.bordeClaro, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 9, fontSize: rf(14), color: COLORS.textoNegro, backgroundColor: COLORS.fondoCard },

  completarPerfil: { backgroundColor: COLORS.fondoGris, borderRadius: RADIUS.md, padding: 12, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: COLORS.bordeClaro, borderStyle: 'dashed' },
  completarPerfilTxt: { fontSize: rf(13), color: COLORS.textoGrisMid, fontWeight: '600' },

  btnGuardar: { backgroundColor: COLORS.negro, borderRadius: RADIUS.md, padding: 14, alignItems: 'center', marginTop: 12 },
  btnGuardarTxt: { color: COLORS.dorado, fontWeight: '700', fontSize: rf(14) },

  // Menús
  seccionMenu: { fontSize: rf(11), fontWeight: '700', color: COLORS.textoGrisSub, letterSpacing: 1.5, marginHorizontal: SPACING.lg, marginBottom: 8, marginTop: 4 },
  menu: { backgroundColor: COLORS.fondoCard, marginHorizontal: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.bordeClaro, overflow: 'hidden', ...SHADOW.sm, marginBottom: SPACING.lg },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.bordeClaro },
  menuLabel: { flex: 1, fontSize: rf(15), color: COLORS.textoNegro, fontWeight: '500' },
  menuArrow: { fontSize: 20, color: COLORS.textoGrisSub },

  infoEmpresa: { alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: 16 },
  infoEmpresaTxt: { fontSize: rf(12), color: COLORS.textoGrisSub, marginBottom: 2 },
  infoEmpresaSub: { fontSize: rf(11), color: COLORS.textoGrisSub },

  btnLogout: { marginHorizontal: SPACING.lg, padding: 16, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#fecaca', alignItems: 'center', backgroundColor: '#fef2f2', marginBottom: SPACING.lg },
  btnLogoutTxt: { color: '#ef4444', fontWeight: '600', fontSize: rf(15) },
});
