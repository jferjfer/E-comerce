// URL central del gateway — nunca usar localhost directamente en los componentes
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }
  return import.meta.env.VITE_API_URL || 'http://34.123.67.97';
};

export const API_URL = getApiUrl();
