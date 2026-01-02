# 🔒 CORRECCIONES DE SEGURIDAD CRÍTICAS

## ⚠️ ACCIÓN INMEDIATA REQUERIDA

### 1. ROTAR TODAS LAS CREDENCIALES EXPUESTAS

**Credenciales comprometidas encontradas:**

```bash
# PostgreSQL Auth Service
postgresql://neondb_owner:npg_8xkCIyHBo3Mn@ep-misty-cell-af9o0x82...

# PostgreSQL Transaction Service  
postgresql://neondb_owner:npg_2gVs9CfQRuHn@ep-broad-dew-aeujycvn...

# MongoDB Catalog
mongodb+srv://Vercel-Admin-catalogo:oTXaV4jaA4E5Qi4C@catalogo...

# MongoDB Social/AI
mongodb+srv://jfvertel:jfvertel123@cluster0.vvagb...
```

**ACCIÓN:** Cambiar TODAS estas contraseñas INMEDIATAMENTE en los proveedores.

### 2. IMPLEMENTAR GESTIÓN DE SECRETS

**Opción A: Variables de entorno del sistema**
```bash
# NO hacer esto:
POSTGRES_URL=postgresql://user:pass@host/db

# Hacer esto:
export POSTGRES_URL=$(cat /run/secrets/postgres_url)
```

**Opción B: Docker Secrets**
```yaml
services:
  auth-service:
    secrets:
      - postgres_auth_url
      - jwt_secret
    environment:
      POSTGRES_URL_FILE: /run/secrets/postgres_auth_url
      JWT_SECRET_FILE: /run/secrets/jwt_secret

secrets:
  postgres_auth_url:
    external: true
  jwt_secret:
    external: true
```

**Opción C: AWS Secrets Manager (Producción)**
```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
  const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
  return JSON.parse(data.SecretString);
}
```

### 3. IMPLEMENTAR RATE LIMITING

```javascript
// En gateway y servicios
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Demasiadas solicitudes, intenta más tarde'
});

app.use('/api/', limiter);

// Rate limit estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 intentos de login
  skipSuccessfulRequests: true
});

app.use('/api/auth/login', authLimiter);
```

### 4. VALIDACIÓN DE ENTRADA

```javascript
// Implementar en TODOS los endpoints
const { body, validationResult } = require('express-validator');

app.post('/api/carrito',
  body('id_producto').isString().trim().escape(),
  body('cantidad').isInt({ min: 1, max: 100 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... resto del código
  }
);
```

### 5. HEADERS DE SEGURIDAD

```javascript
// Ya implementado helmet(), pero agregar:
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 6. LOGGING Y MONITOREO

```javascript
// NO loggear información sensible
// MAL:
console.log('Usuario:', req.body); // Puede contener password

// BIEN:
const { password, ...safeData } = req.body;
console.log('Usuario:', safeData);
```

### 7. SQL INJECTION PREVENTION

```javascript
// Ya implementado con prepared statements, pero verificar:
// NUNCA hacer esto:
const query = `SELECT * FROM usuario WHERE email = '${email}'`; // ❌

// SIEMPRE hacer esto:
const query = 'SELECT * FROM usuario WHERE email = $1'; // ✅
await pool.query(query, [email]);
```

### 8. JWT BEST PRACTICES

```javascript
// Implementar refresh tokens
// Expiración corta para access tokens
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

// Almacenar refresh tokens en BD
// Implementar token rotation
// Implementar token revocation
```

### 9. HTTPS OBLIGATORIO EN PRODUCCIÓN

```javascript
// Forzar HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

### 10. DEPENDENCIAS ACTUALIZADAS

```bash
# Ejecutar regularmente
npm audit fix
npm outdated

# Implementar Dependabot o Snyk
```

## 📋 CHECKLIST DE SEGURIDAD

- [ ] Rotar todas las credenciales expuestas
- [ ] Implementar secrets management
- [ ] Agregar rate limiting
- [ ] Validar todas las entradas
- [ ] Implementar HTTPS en producción
- [ ] Configurar CORS correctamente
- [ ] Implementar logging seguro
- [ ] Actualizar dependencias
- [ ] Implementar refresh tokens
- [ ] Configurar WAF (Web Application Firewall)
- [ ] Implementar 2FA para admin
- [ ] Backup automático de BD
- [ ] Plan de respuesta a incidentes

## 🚨 VULNERABILIDADES CRÍTICAS ENCONTRADAS

1. **Credenciales hardcodeadas** - CRÍTICO
2. **JWT secret débil y expuesto** - CRÍTICO  
3. **Sin rate limiting** - ALTO
4. **Sin validación de entrada robusta** - ALTO
5. **Logs con información sensible** - MEDIO
6. **Sin refresh tokens** - MEDIO
7. **CORS permisivo** - BAJO

## 📞 CONTACTO DE SEGURIDAD

Para reportar vulnerabilidades: security@estilomoda.com
