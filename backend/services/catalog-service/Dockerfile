FROM python:3.11-alpine

WORKDIR /app

# Optimizado para producción

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Crear usuario no-root
RUN addgroup -g 1001 -S python && \
    adduser -S cataloguser -u 1001

# Cambiar ownership
RUN chown -R cataloguser:python /app
USER cataloguser

EXPOSE 3002

# Health check removido - usar monitoreo externo

CMD ["python", "src/main.py"]