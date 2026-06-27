import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { COLORS, RADIUS, SPACING, SHADOW } from '@/constants';
import EgosLogo from '@/components/EgosLogo';

const DEPARTAMENTOS = [
  'Bogotá D.C.','Antioquia','Valle del Cauca','Atlántico','Santander',
  'Bolívar','Cundinamarca','Córdoba','Nariño','Tolima','Cauca',
  'Norte de Santander','Huila','Meta','Risaralda','Caldas',
  'Sucre','Magdalena','Cesar','La Guajira','Boyacá','Quindío',
  'Chocó','Arauca','Casanare','Putumayo','Amazonas','Guaviare',
  'Vichada','Guainía','Vaupés','San Andrés y Providencia','Caquetá',
];

export default function RegistroScreen() {
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '', confirmar_password: '',
    documento_tipo: 'CC', documento_numero: '', telefono: '',
    fecha_nacimiento: '', genero: '', direccion: '', ciudad: '', departamento: '',
    acepta_terminos: false, acepta_datos: false,
  });
  const [verPass, setVerPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const { registrar, errorLogin } = useAuthStore();
  const addNotification = useNotificationStore(s => s.addNotification);

  const upd = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const validar = () => {
    const e: Record<string, string> = {};
    if (!form.nombre || form.nombre.length < 2) e.nombre = 'Mínimo 2 caracteres';
    if (!form.apellido) e.apellido = 'Requerido';
    if (!form.email.includes('@')) e.email = 'Email inválido';
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (!/(?=.*[A-Z])/.test(form.password)) e.password = 'Debe tener mayúscula';
    if (!/(?=.*[0-9])/.test(form.password)) e.password = 'Debe tener número';
    if (form.password !== form.confirmar_password) e.confirmar_password = 'No coinciden';
    if (!form.acepta_terminos) e.terminos = 'Debes aceptar los términos';
    if (!form.acepta_datos) e.datos = 'Debes autorizar el tratamiento';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleRegistro = async () => {
    if (!validar()) return;
    setLoading(true);
    const ok = await registrar({ ...form, password: form.password });
    setLoading(false);
    if (ok) {
      addNotification('¡Cuenta creada! Bienvenido a EGOS', 'success');
      router.replace('/(tabs)/');
    } else {
      addNotification(errorLogin || 'Error al registrarse', 'error');
    }
  };

  const Campo = ({ label, placeholder, value, onChg, keyType = 'default', secure = false, error = '' }: any) => (
    <View style={styles.grupo}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChg}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textoGrisSub}
        keyboardType={keyType}
        secureTextEntry={secure}
        autoCapitalize="none"
      />
      {error ? <Text style={styles.errorTxt}>{error}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.negroHeader }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.logoArea}>
          <EgosLogo size="md" showSlogan />
        </View>

        <View style={styles.card}>
          <Text style={styles.titulo}>Crear Cuenta</Text>
          <Text style={styles.subtitulo}>Únete a la familia EGOS</Text>

          {/* Nombre y Apellido */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Campo label="Nombre *" placeholder="Tu nombre" value={form.nombre} onChg={(v: string) => upd('nombre', v)} error={errores.nombre} />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Campo label="Apellido *" placeholder="Tu apellido" value={form.apellido} onChg={(v: string) => upd('apellido', v)} error={errores.apellido} />
            </View>
          </View>

          {/* Documento */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Tipo Doc. *</Text>
              <View style={styles.pickerBox}>
                {['CC','CE','TI','PP'].map(t => (
                  <TouchableOpacity key={t} onPress={() => upd('documento_tipo', t)}
                    style={[styles.pickerOpt, form.documento_tipo === t && styles.pickerOptActivo]}>
                    <Text style={[styles.pickerOptTxt, form.documento_tipo === t && styles.pickerOptTxtActivo]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Campo label="N° Documento" placeholder="5-12 dígitos" value={form.documento_numero} onChg={(v: string) => upd('documento_numero', v)} keyType="numeric" error={errores.documento_numero} />
            </View>
          </View>

          <Campo label="Teléfono" placeholder="+57 300..." value={form.telefono} onChg={(v: string) => upd('telefono', v)} keyType="phone-pad" />
          <Campo label="Correo electrónico *" placeholder="tu@email.com" value={form.email} onChg={(v: string) => upd('email', v)} keyType="email-address" error={errores.email} />

          {/* Contraseña */}
          <View style={styles.grupo}>
            <Text style={styles.label}>Contraseña * <Text style={{ color: COLORS.textoGrisSub, fontSize: 11 }}>(mín. 8, mayúscula y número)</Text></Text>
            <View style={[styles.inputBox, errores.password ? styles.inputError : null]}>
              <TextInput
                style={[styles.inputFlex]}
                value={form.password}
                onChangeText={v => upd('password', v)}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textoGrisSub}
                secureTextEntry={!verPass}
              />
              <TouchableOpacity onPress={() => setVerPass(!verPass)}>
                <Text style={{ fontSize: 16 }}>{verPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {errores.password ? <Text style={styles.errorTxt}>{errores.password}</Text> : null}
          </View>

          <View style={styles.grupo}>
            <Text style={styles.label}>Confirmar contraseña *</Text>
            <TextInput
              style={[styles.input, errores.confirmar_password ? styles.inputError : null]}
              value={form.confirmar_password}
              onChangeText={v => upd('confirmar_password', v)}
              placeholder="Repite tu contraseña"
              placeholderTextColor={COLORS.textoGrisSub}
              secureTextEntry
            />
            {errores.confirmar_password ? <Text style={styles.errorTxt}>{errores.confirmar_password}</Text> : null}
          </View>

          <Campo label="Dirección" placeholder="Calle 123 #45-67" value={form.direccion} onChg={(v: string) => upd('direccion', v)} />
          <Campo label="Ciudad" placeholder="Bogotá" value={form.ciudad} onChg={(v: string) => upd('ciudad', v)} />

          {/* Términos */}
          <TouchableOpacity style={styles.checkRow} onPress={() => upd('acepta_terminos', !form.acepta_terminos)}>
            <View style={[styles.checkbox, form.acepta_terminos && styles.checkboxActivo]}>
              {form.acepta_terminos && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>Acepto los términos y condiciones *</Text>
          </TouchableOpacity>
          {errores.terminos ? <Text style={[styles.errorTxt, { marginTop: -8 }]}>{errores.terminos}</Text> : null}

          <TouchableOpacity style={styles.checkRow} onPress={() => upd('acepta_datos', !form.acepta_datos)}>
            <View style={[styles.checkbox, form.acepta_datos && styles.checkboxActivo]}>
              {form.acepta_datos && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>Autorizo el tratamiento de mis datos *</Text>
          </TouchableOpacity>
          {errores.datos ? <Text style={[styles.errorTxt, { marginTop: -8 }]}>{errores.datos}</Text> : null}

          <TouchableOpacity
            style={[styles.btnRegistro, loading && { opacity: 0.7 }]}
            onPress={handleRegistro}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.negro} />
              : <Text style={styles.btnRegistroTxt}>Crear Cuenta</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkLogin}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  logoArea: {
    backgroundColor: COLORS.negroHeader,
    paddingTop: 52,
    paddingBottom: 32,
    alignItems: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.fondoCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.xxl,
  },
  titulo: { fontSize: 22, fontWeight: '800', color: COLORS.textoNegro, marginBottom: 4 },
  subtitulo: { fontSize: 14, color: COLORS.textoGrisMid, marginBottom: 20 },
  row: { flexDirection: 'row' },
  grupo: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textoGris, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.bordeClaro,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.textoNegro,
    backgroundColor: COLORS.fondoGris,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bordeClaro,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: COLORS.fondoGris,
  },
  inputFlex: { flex: 1, fontSize: 14, color: COLORS.textoNegro, padding: 0 },
  inputError: { borderColor: '#ef4444' },
  errorTxt: { color: '#ef4444', fontSize: 11, marginTop: 3 },
  pickerBox: { flexDirection: 'row', gap: 6, marginTop: 2 },
  pickerOpt: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeMedio,
    alignItems: 'center',
    backgroundColor: COLORS.fondoGris,
  },
  pickerOptActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  pickerOptTxt: { fontSize: 12, color: COLORS.textoGrisMid, fontWeight: '600' },
  pickerOptTxtActivo: { color: COLORS.dorado },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  checkbox: {
    width: 20, height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.bordeMedio,
    backgroundColor: COLORS.fondoCard,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  checkmark: { color: COLORS.dorado, fontSize: 12, fontWeight: '700' },
  checkLabel: { flex: 1, fontSize: 13, color: COLORS.textoGris },
  btnRegistro: {
    backgroundColor: COLORS.dorado,
    borderRadius: RADIUS.md,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    ...SHADOW.sm,
  },
  btnRegistroTxt: { color: COLORS.negro, fontWeight: '700', fontSize: 16 },
  linkLogin: { textAlign: 'center', fontSize: 13, color: COLORS.textoGrisMid, padding: 6 },
});
