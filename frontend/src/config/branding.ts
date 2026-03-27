export const BRANDING = {
  COMPANY_NAME: 'EGOS',
  COMPANY_LEGAL_NAME: 'EGOS S.A.S.',
  COMPANY_SLOGAN: 'Wear Your Truth',

  CONTACT: {
    email: 'hola@egos.com.co',
    phone: '+57 1 234-5678',
    whatsapp: '+57 300 123 4567',
    address: 'Bogotá, Colombia',
    nit: '900.123.456-7'
  },

  SOCIAL_MEDIA: {
    instagram: 'https://instagram.com/egos.co',
    facebook: 'https://facebook.com/egos.co',
    tiktok: 'https://tiktok.com/@egos.co',
    whatsapp: 'https://whatsapp.com/channel/egos',
    youtube: 'https://youtube.com/@egos.co'
  },

  ASSETS: {
    logo: '/logo.png',
    favicon: '/logo.png',
    logoAlt: 'EGOS — Wear Your Truth'
  },

  SEO: {
    title: 'EGOS — Wear Your Truth',
    description: 'EGOS — Moda de lujo personalizada. Wear Your Truth.',
    keywords: 'EGOS, moda, lujo, ropa, e-commerce, wear your truth, Colombia'
  },

  AI_ASSISTANT: {
    name: 'María',
    title: 'Asesora de Imagen Personal',
    welcome_message: '¡Hola! Soy María, tu asesora de imagen personal de EGOS. Estoy aquí para ayudarte a encontrar tu estilo único. ¿En qué puedo ayudarte?'
  },

  // Colores de marca
  COLORS: {
    gold: '#c5a47e',
    goldLight: '#e2c9af',
    goldDark: '#a67c52',
    black: '#000000',
    white: '#ffffff'
  }
} as const

export type BrandingConfig = typeof BRANDING
