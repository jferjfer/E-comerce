// URL central del gateway — detecta automáticamente el protocolo correcto
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    // Producción — siempre usa el mismo protocolo que la página
    const protocol = window.location.protocol; // 'https:' o 'http:'
    return `${protocol}//api.egoscolombia.com.co`;
  }
  return import.meta.env.VITE_API_URL || 'https://api.egoscolombia.com.co';
};

export const API_URL = getApiUrl();
