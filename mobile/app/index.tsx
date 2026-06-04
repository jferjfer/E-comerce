import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

export default function Index() {
  const { estaAutenticado } = useAuthStore();
  return <Redirect href={estaAutenticado ? '/(tabs)/' : '/login'} />;
}
