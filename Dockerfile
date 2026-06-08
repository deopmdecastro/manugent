FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src ./src
COPY public ./public
RUN npm run build:api && npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start"]
