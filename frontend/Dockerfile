FROM node:20-alpine

WORKDIR /app

# Limpiar caché npm y configurar
RUN npm cache clean --force
RUN npm config set registry https://registry.npmjs.org/

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias con limpieza
RUN rm -rf node_modules package-lock.json
RUN npm install --no-cache --verbose

# Copiar código fuente
COPY . .

# Verificar instalación
RUN npm list vite || echo "Vite no encontrado, reinstalando..."
RUN npm install vite@^5.0.0 --save-dev --force

EXPOSE 3005

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3005"]
