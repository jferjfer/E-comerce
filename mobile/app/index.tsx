import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

export default function Index() {
  const { estaAutenticado, usuario } = useAuthStore();

  // Si no está autenticado, va a home (como invitado)
  if (!estaAutenticado || !usuario) return <Redirect href="/(tabs)/" />;

  // Roles administrativos van directo a inicio también (la app móvil es para clientes)
  return <Redirect href="/(tabs)/" />;
}
