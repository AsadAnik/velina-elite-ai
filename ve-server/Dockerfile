# Build Stage
FROM node:26-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@11.5.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma generate
RUN pnpm build

# Production Stage
FROM node:26-alpine AS production
WORKDIR /app
RUN npm install -g pnpm@11.5.0
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/src/main"]