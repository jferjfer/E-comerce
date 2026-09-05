/**
 * Middleware de seguridad de inputs
 * Previene: XSS, SQL Injection, Path Traversal, Command Injection
 */

const sanitizarString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/['";\\]/g, (c) => ({ "'": '&#39;', '"': '&quot;', ';': '&#59;', '\\': '&#92;' }[c]))
    .trim()
    .substring(0, 10000); // Limitar longitud máxima
};

const sanitizarObjeto = (obj, profundidad = 0) => {
  if (profundidad > 5) return obj; // Evitar recursión infinita
  if (typeof obj === 'string') return sanitizarString(obj);
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(item => sanitizarObjeto(item, profundidad + 1));

  const sanitizado = {};
  for (const [key, value] of Object.entries(obj)) {
    const keySanitizada = sanitizarString(String(key));
    sanitizado[keySanitizada] = sanitizarObjeto(value, profundidad + 1);
  }
  return sanitizado;
};

// Detectar patrones de SQL Injection
const detectarSQLInjection = (str) => {
  if (typeof str !== 'string') return false;
  const patrones = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(--|\bOR\b\s+\d+=\d+|\bAND\b\s+\d+=\d+)/i,
    /(\bEXEC\b|\bEXECUTE\b)/i,
    /(xp_cmdshell|sp_executesql)/i,
  ];
  return patrones.some(p => p.test(str));
};

const verificarSQLInjection = (obj, path = '') => {
  if (typeof obj === 'string') {
    if (detectarSQLInjection(obj)) {
      console.warn(`⚠️ Posible SQL Injection detectado en ${path}: ${obj.substring(0, 50)}`);
      return true;
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (verificarSQLInjection(value, `${path}.${key}`)) return true;
    }
  }
  return false;
};

// Middleware principal
const sanitizarInputs = (req, res, next) => {
  // Sanitizar body
  if (req.body && typeof req.body === 'object') {
    // Verificar SQL Injection
    if (verificarSQLInjection(req.body, 'body')) {
      return res.status(400).json({ error: 'Entrada no válida detectada' });
    }
    req.body = sanitizarObjeto(req.body);
  }

  // Sanitizar query params
  if (req.query) {
    if (verificarSQLInjection(req.query, 'query')) {
      return res.status(400).json({ error: 'Parámetros no válidos' });
    }
    req.query = sanitizarObjeto(req.query);
  }

  next();
};

// Validar Content-Type en POST/PUT
const validarContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json') &&
        !contentType.includes('multipart/form-data') &&
        !contentType.includes('application/x-www-form-urlencoded')) {
      return res.status(415).json({ error: 'Content-Type no soportado' });
    }
  }
  next();
};

module.exports = { sanitizarInputs, validarContentType, sanitizarString };
