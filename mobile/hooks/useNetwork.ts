import { useState, useEffect, useRef } from 'react';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'egos_network_cache';

export function useNetwork() {
  const [isConnected, setIsConnected] = useState(true);
  const prevRef = useRef(true);

  useEffect(() => {
    const check = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        const connected = state.isConnected === true && state.isInternetReachable !== false;
        if (connected !== prevRef.current) {
          prevRef.current = connected;
          setIsConnected(connected);
        }
      } catch {}
    };

    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  return isConnected;
}

// Cache de productos para modo offline
export const networkCache = {
  async guardarProductos(productos: any[]) {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        productos: productos.slice(0, 50), // máximo 50
        timestamp: Date.now(),
      }));
    } catch {}
  },

  async obtenerProductos(): Promise<any[]> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      // Cache válido por 24 horas
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) return [];
      return data.productos || [];
    } catch {
      return [];
    }
  },
};
