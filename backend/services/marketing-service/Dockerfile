FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3006

RUN groupadd -g 1001 appgroup && useradd -u 1001 -g appgroup -s /bin/sh -m appuser
RUN chown -R appuser:appgroup /app
USER appuser

CMD ["node", "src/servidor.js"]
