const crypto = require('crypto');

// Generar JWT secret seguro
const generarJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Sanitización robusta anti-XSS
const sanitizarCompleto = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitizado = {};
    for (const [key, value] of Object.entries(input)) {
      sanitizado[key] = sanitizarCompleto(value);
    }
    return sanitizado;
  }
  
  return input;
};

// Validación robusta de contraseñas
const validarContrasenaSegura = (password) => {
  const errores = [];
  
  if (password.length < 8) errores.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errores.push('Al menos 1 mayúscula');
  if (!/[a-z]/.test(password)) errores.push('Al menos 1 minúscula');
  if (!/[0-9]/.test(password)) errores.push('Al menos 1 número');
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) errores.push('Al menos 1 carácter especial');
  
  return {
    valida: errores.length === 0,
    errores
  };
};

// Logging seguro
const logSeguro = (nivel, mensaje, datos = {}) => {
  const datosLimpios = { ...datos };
  
  const camposSensibles = ['password', 'contrasena', 'token', 'authorization'];
  
  const limpiarObjeto = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const limpio = {};
    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();
      if (camposSensibles.some(campo => keyLower.includes(campo))) {
        limpio[key] = '[REDACTED]';
      } else {
        limpio[key] = value;
      }
    }
    return limpio;
  };
  
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${nivel.toUpperCase()}: ${mensaje}`, limpiarObjeto(datosLimpios));
};

module.exports = {
  generarJWTSecret,
  sanitizarCompleto,
  validarContrasenaSegura,
  logSeguro
};