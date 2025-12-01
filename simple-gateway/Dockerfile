FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV DOCKER_ENV=true

EXPOSE 3000

CMD ["node", "server-axios.js"]
