FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3006

RUN addgroup -S appgroup && adduser -S -G appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

CMD ["node", "src/servidor.js"]
