import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { useAuthStore } from '@/store/useAuthStore';

export default function PerfilScreen() {
  const { usuario, estaAutenticado, cerrarSesion } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas salir?', [
      { text: 'Cancelar' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: () => { cerrarSesion(); router.replace('/login'); }
      }
    ]);
  };

  if (!estaAutenticado) {
    return (
      <View style={styles.noAuth}>
        <Text style={styles.noAuthIcon}>👤</Text>
        <Text style={styles.noAuthTitulo}>Inicia sesión</Text>
        <Text style={styles.noAuthSub}>para acceder a tu perfil</Text>
        <TouchableOpacity style={styles.btnLogin} onPress={() => router.push('/login')}>
          <Text style={styles.btnLoginTxt}>Iniciar Sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnRegistro} onPress={() => router.push('/registro')}>
          <Text style={styles.btnRegistroTxt}>Crear cuenta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const inicial = usuario?.nombre?.charAt(0).toUpperCase() || '?';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Avatar y nombre */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{inicial}</Text>
        </View>
        <Text style={styles.nombre}>{usuario?.nombre} {usuario?.apellido || ''}</Text>
        <Text style={styles.email}>{usuario?.email}</Text>
        <View style={styles.rolBadge}>
          <Text style={styles.rolTxt}>{usuario?.rol}</Text>
        </View>
      </View>

      {/* Menú opciones */}
      <View style={styles.menu}>
        <MenuItem icon="📦" label="Mis Pedidos" onPress={() => router.push('/(tabs)/pedidos')} />
        <MenuItem icon="❤️" label="Favoritos" onPress={() => {}} />
        <MenuItem icon="💳" label="Pagos" onPress={() => {}} />
        <MenuItem icon="🎁" label="Mis Bonos" onPress={() => {}} />
        <MenuItem icon="⚙️" label="Configuración" onPress={() => {}} />
        <MenuItem icon="❓" label="Ayuda" onPress={() => {}} />
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

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondoPagina },

  noAuth: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: COLORS.fondoPagina,
  },
  noAuthIcon: { fontSize: 64, marginBottom: 16 },
  noAuthTitulo: { fontSize: 18, fontWeight: '700', color: COLORS.textoNegro, marginBottom: 8 },
  noAuthSub: { fontSize: 14, color: COLORS.textoGrisMid, marginBottom: 24 },
  btnLogin: {
    backgroundColor: COLORS.negro,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnLoginTxt: { color: COLORS.dorado, fontWeight: '700', fontSize: 15 },
  btnRegistro: {
    borderWidth: 1.5,
    borderColor: COLORS.negro,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    width: '100%',
    alignItems: 'center',
  },
  btnRegistroTxt: { color: COLORS.negro, fontWeight: '600', fontSize: 15 },

  avatarSection: {
    backgroundColor: COLORS.negroHeader,
    alignItems: 'center',
    paddingVertical: 32,
    paddingTop: 48,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.doradoOscuro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarTxt: { fontSize: 28, fontWeight: '800', color: COLORS.blanco },
  nombre: { fontSize: 18, fontWeight: '700', color: COLORS.blanco, marginBottom: 4 },
  email: { fontSize: 13, color: '#9ca3af', marginBottom: 8 },
  rolBadge: {
    backgroundColor: 'rgba(197,164,126,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  rolTxt: { fontSize: 11, color: COLORS.dorado, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },

  menu: {
    backgroundColor: COLORS.fondoCard,
    margin: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.bordeClaro,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeClaro,
  },
  menuIcon: { fontSize: 20, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.textoNegro, fontWeight: '500' },
  menuArrow: { fontSize: 20, color: COLORS.textoGrisSub },

  infoEmpresa: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: 16,
  },
  infoEmpresaTxt: { fontSize: 12, color: COLORS.textoGrisSub, marginBottom: 2 },
  infoEmpresaSub: { fontSize: 11, color: COLORS.textoGrisSub },

  btnLogout: {
    marginHorizontal: SPACING.lg,
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
  },
  btnLogoutTxt: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});
