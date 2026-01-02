FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3004

CMD ["sh", "-c", "node src/servidor-completo.js"]
