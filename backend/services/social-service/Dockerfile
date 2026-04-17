FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3004

RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser
RUN chown -R appuser:appgroup /app
USER appuser

CMD ["sh", "-c", "node src/servidor-completo.js"]
