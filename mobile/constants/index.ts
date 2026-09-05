// Constantes de diseño EGOS — idénticos al frontend web
export const API_URL = 'https://api.egoscolombia.com.co';

export const FONTS = {
  bold: 'System',
  regular: 'System',
};

// Responsive helpers
import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');
export const SCREEN = { width, height };
export const isSmall = width < 375;  // iPhone SE, pequeños
export const isMedium = width >= 375 && width < 414; // iPhone estándar
export const isLarge = width >= 414;  // iPhone Plus, grandes
// Escalar fuente según pantalla
export const rf = (size: number) => {
  const scale = width / 390; // base iPhone 14
  return Math.round(size * Math.min(Math.max(scale, 0.85), 1.15));
};

export const COLORS = {
  // Colores principales
  negro:        '#111827',
  negroHeader:  '#000000',
  dorado:       '#c5a47e',
  doradoClaro:  '#e2c9af',
  doradoOscuro: '#a67c52',
  // Fondos
  fondoPagina:  '#f9fafb',
  fondoCard:    '#ffffff',
  fondoGris:    '#f3f4f6',
  // Bordes
  bordeClaro:   '#e5e7eb',
  bordeMedio:   '#d1d5db',
  // Textos
  textoNegro:   '#111827',
  textoGris:    '#374151',
  textoGrisMid: '#6b7280',
  textoGrisSub: '#9ca3af',
  // Acciones
  verde:        '#10b981',
  rojo:         '#f43f5e',
  azul:         '#3b82f6',
  // Overlay
  overlay:      'rgba(0,0,0,0.5)',
  blanco:       '#ffffff',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
