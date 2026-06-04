import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, StatusBar
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { COLORS, RADIUS, SPACING, SHADOW } from '@/constants';
import EgosLogo from '@/components/EgosLogo';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { iniciarSesion, errorLogin } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    const ok = await iniciarSesion(email.trim(), password);
    setLoading(false);
    if (ok) router.replace('/(tabs)/');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.negroHeader} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Fondo negro con logo */}
        <View style={styles.logoArea}>
          <EgosLogo size="lg" showSlogan />
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Text style={styles.titulo}>Iniciar Sesión</Text>
          <Text style={styles.subtitulo}>Bienvenido de vuelta</Text>

          {errorLogin && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTxt}>⚠️ {errorLogin}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor={COLORS.textoGrisSub}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textoGrisSub}
                secureTextEntry={!verPassword}
              />
              <TouchableOpacity onPress={() => setVerPassword(!verPassword)}>
                <Text style={styles.inputIcon}>{verPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Link recuperar */}
          <TouchableOpacity style={styles.olvidaste} onPress={() => {}}>
            <Text style={styles.olvidasteLink}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Botón login */}
          <TouchableOpacity
            style={[styles.btnLogin, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.negro} />
              : <Text style={styles.btnLoginTxt}>Iniciar Sesión</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Registro */}
          <TouchableOpacity
            style={styles.btnRegistro}
            onPress={() => router.push('/registro')}
          >
            <Text style={styles.btnRegistroTxt}>Crear una cuenta</Text>
          </TouchableOpacity>

          {/* Invitado */}
          <TouchableOpacity onPress={() => router.replace('/(tabs)/')}>
            <Text style={styles.linkInvitado}>Continuar como invitado →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.negroHeader },
  scroll: { flexGrow: 1 },

  logoArea: {
    backgroundColor: COLORS.negroHeader,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  form: {
    flex: 1,
    backgroundColor: COLORS.fondoCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.xxl,
    minHeight: 500,
  },

  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textoNegro,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: COLORS.textoGrisMid,
    marginBottom: 24,
  },

  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorTxt: {
    color: '#ef4444',
    fontSize: 13,
  },

  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textoGris,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bordeClaro,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.fondoGris,
    gap: 8,
  },
  inputIcon: { fontSize: 16 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textoNegro,
    padding: 0,
  },

  olvidaste: { alignItems: 'flex-end', marginBottom: 20, marginTop: -4 },
  olvidasteLink: {
    fontSize: 13,
    color: COLORS.textoGrisMid,
  },

  btnLogin: {
    backgroundColor: COLORS.dorado,
    borderRadius: RADIUS.md,
    padding: 16,
    alignItems: 'center',
    ...SHADOW.sm,
  },
  btnLoginTxt: {
    color: COLORS.negro,
    fontWeight: '700',
    fontSize: 16,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.bordeClaro,
  },
  dividerTxt: {
    fontSize: 13,
    color: COLORS.textoGrisSub,
  },

  btnRegistro: {
    borderWidth: 1.5,
    borderColor: COLORS.negro,
    borderRadius: RADIUS.md,
    padding: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnRegistroTxt: {
    color: COLORS.negro,
    fontWeight: '600',
    fontSize: 15,
  },

  linkInvitado: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textoGrisMid,
    padding: 8,
  },
});
