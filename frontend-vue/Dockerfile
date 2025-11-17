# Dockerfile para Frontend Vue
FROM node:18-alpine as build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Verificar que el build existe
RUN ls -la /app/dist

# Servir la aplicación
FROM nginx:alpine

# Remover archivos por defecto de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar build de Vue
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Verificar que los archivos se copiaron
RUN ls -la /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]