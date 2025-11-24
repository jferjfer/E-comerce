// Configuración de branding para Estilo y Moda
export const BRANDING = {
  // Información de la empresa
  COMPANY_NAME: 'Estilo y Moda',
  COMPANY_LEGAL_NAME: 'Estilo y Moda S.A.S.',
  COMPANY_SLOGAN: 'Moda Inteligente Personalizada',
  
  // Contacto
  CONTACT: {
    email: 'hola@estiloymodaco.com',
    phone: '+57 1 234-5678',
    whatsapp: '+57 300 123 4567',
    address: 'Bogotá, Colombia',
    nit: '900.123.456-7'
  },
  
  // Redes sociales
  SOCIAL_MEDIA: {
    instagram: 'https://instagram.com/estiloymodaco',
    facebook: 'https://facebook.com/estiloymodaco',
    tiktok: 'https://tiktok.com/@estiloymodaco',
    whatsapp: 'https://whatsapp.com/channel/estiloymodaco',
    youtube: 'https://youtube.com/@estiloymodaco'
  },
  
  // Assets
  ASSETS: {
    logo: '/logo.png',
    favicon: '/logo.png',
    logoAlt: 'Estilo y Moda - Logo'
  },
  
  // SEO
  SEO: {
    title: 'Estilo y Moda - Moda Inteligente',
    description: 'Estilo y Moda - Moda inteligente personalizada con IA. Descubre tu estilo único.',
    keywords: 'moda, ropa, IA, personalización, e-commerce, estilo, tendencias'
  },
  
  // IA Assistant
  AI_ASSISTANT: {
    name: 'María',
    title: 'Asesora de Imagen Personal',
    welcome_message: '¡Hola! Soy María, tu asesora de imagen personal de Estilo y Moda. Estoy aquí para ayudarte a encontrar tu estilo perfecto. ¿En qué puedo ayudarte?'
  }
} as const

export type BrandingConfig = typeof BRANDING