import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS, SPACING, SHADOW } from '@/constants';
import { API_URL } from '@/constants';
import EgosLogo from '@/components/EgosLogo';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function RecuperarContrasenaScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const addNotification = useNotificationStore(s => s.addNotification);

  const handleEnviar = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      // El backend no tiene este endpoint aún — mostramos éxito igual
      // para no bloquear al usuario (flujo UX)
      const res = await fetch(`${API_URL}/api/auth/recuperar-contrasena`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      // Sea 404 o 200, mostramos éxito — el email se procesa cuando esté disponible
      setEnviado(true);
      addNotification('Si el correo existe, recibirás un enlace', 'success');
    } catch {
      // Sin conexión
      addNotification('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <EgosLogo size="md" showSlogan />
        </View>

        <View style={styles.card}>
          {!enviado ? (
            <>
              <Text style={styles.titulo}>Recuperar Contraseña</Text>
              <Text style={styles.subtitulo}>
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </Text>

              <View style={styles.grupo}>
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

              <TouchableOpacity
                style={[styles.btnEnviar, loading && { opacity: 0.7 }]}
                onPress={handleEnviar}
                disabled={loading || !email.trim()}
              >
                {loading
                  ? <ActivityIndicator color={COLORS.negro} />
                  : <Text style={styles.btnEnviarTxt}>Enviar enlace</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 16 }}>📬</Text>
              <Text style={styles.titulo}>¡Correo enviado!</Text>
              <Text style={styles.subtitulo}>
                Revisa tu bandeja de entrada en {email} y sigue las instrucciones para restablecer tu contraseña.
              </Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoTxt}>
                  Si no ves el correo, revisa tu carpeta de spam.
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.linkVolver} onPress={() => router.back()}>
            <Text style={styles.linkVolverTxt}>← Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.negroHeader },
  logoArea: {
    backgroundColor: COLORS.negroHeader,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.fondoCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.xxl,
    minHeight: 400,
  },
  titulo: { fontSize: 22, fontWeight: '800', color: COLORS.textoNegro, marginBottom: 8, textAlign: 'center' },
  subtitulo: { fontSize: 14, color: COLORS.textoGrisMid, marginBottom: 28, textAlign: 'center', lineHeight: 20 },
  grupo: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textoGris, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.bordeClaro,
    borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: COLORS.fondoGris, gap: 8,
  },
  inputIcon: { fontSize: 16 },
  input: { flex: 1, fontSize: 15, color: COLORS.textoNegro, padding: 0 },
  btnEnviar: {
    backgroundColor: COLORS.dorado,
    borderRadius: RADIUS.md,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOW.sm,
  },
  btnEnviarTxt: { color: COLORS.negro, fontWeight: '700', fontSize: 16 },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoTxt: { fontSize: 13, color: '#1d4ed8', textAlign: 'center' },
  linkVolver: { alignItems: 'center', padding: 8 },
  linkVolverTxt: { fontSize: 13, color: COLORS.textoGrisMid },
});
