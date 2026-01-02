FROM node:18-alpine

WORKDIR /app

# Optimizado para producción

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S authuser -u 1001

# Cambiar ownership
RUN chown -R authuser:nodejs /app
USER authuser

EXPOSE 3011

# Health check removido - usar monitoreo externo

CMD ["node", "src/servidor.js"]
