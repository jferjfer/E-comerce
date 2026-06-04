import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { COLORS } from '@/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { iniciarSesion, errorLogin } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Ingresa tu email y contraseña');
      return;
    }
    setLoading(true);
    const ok = await iniciarSesion(email, password);
    setLoading(false);
    if (ok) router.replace('/(tabs)/');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoE}>E</Text>
          <Text style={styles.logoEGOS}>EGOS</Text>
          <Text style={styles.logoSlogan}>WEAR YOUR TRUTH</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Text style={styles.titulo}>Iniciar Sesión</Text>

          {errorLogin && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTxt}>{errorLogin}</Text>
            </View>
          )}

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.btnLogin}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.negro} />
              : <Text style={styles.btnLoginTxt}>Ingresar</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/registro')}>
            <Text style={styles.linkRegister}>
              ¿No tienes cuenta? <Text style={styles.linkDorado}>Regístrate</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(tabs)/')}>
            <Text style={styles.linkInvitado}>Continuar como invitado →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.negro },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', paddingVertical: 40 },
  logoE: { fontSize: 48, fontWeight: '900', color: COLORS.dorado },
  logoEGOS: { fontSize: 28, fontWeight: '700', color: COLORS.blanco, letterSpacing: 12 },
  logoSlogan: { fontSize: 10, color: COLORS.dorado, letterSpacing: 4, marginTop: 4 },
  form: {
    backgroundColor: COLORS.blanco, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, flex: 1
  },
  titulo: { fontSize: 22, fontWeight: '800', color: COLORS.negro, marginBottom: 20 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorTxt: { color: '#ef4444', fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.grisTexto, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    padding: 14, fontSize: 15, color: COLORS.negro,
    backgroundColor: '#f9fafb', marginBottom: 16
  },
  btnLogin: {
    backgroundColor: COLORS.dorado, borderRadius: 10,
    padding: 16, alignItems: 'center', marginTop: 4
  },
  btnLoginTxt: { color: COLORS.negro, fontWeight: '700', fontSize: 16 },
  linkRegister: { textAlign: 'center', marginTop: 20, color: COLORS.gris, fontSize: 14 },
  linkDorado: { color: COLORS.dorado, fontWeight: '600' },
  linkInvitado: { textAlign: 'center', marginTop: 12, color: COLORS.gris, fontSize: 13 },
});
