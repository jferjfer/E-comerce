FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production=false && npm cache clean --force

# Copiar código fuente
COPY . .

# Crear usuario no-root y dar permisos
RUN addgroup -g 1001 -S nodejs && \
    adduser -S frontenduser -u 1001 && \
    chown -R frontenduser:nodejs /app

USER frontenduser

EXPOSE 3005

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3005"]
