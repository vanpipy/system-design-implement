FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
COPY prisma ./prisma
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /usr/src/app/dist ./dist
CMD ["node", "dist/main.js"]

