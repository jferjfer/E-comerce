FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3004

RUN addgroup -S appgroup && adduser -S -G appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

CMD ["sh", "-c", "node src/servidor-completo.js"]
