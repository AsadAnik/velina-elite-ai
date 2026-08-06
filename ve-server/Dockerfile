# Build Stage
FROM node:26-alpine AS builder
WORKDIR /app
ENV CI=true
RUN npm install -g pnpm@11.5.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# `postinstall` runs `prisma generate`, so the schema and Prisma config must
# exist before dependencies are installed.
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN pnpm config set fetch-retries 5 \
    && pnpm config set fetch-retry-mintimeout 20000 \
    && pnpm config set fetch-retry-maxtimeout 120000 \
    && pnpm config set fetch-timeout 300000 \
    && pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma generate
RUN pnpm build

# Production Stage
FROM node:26-alpine AS production
WORKDIR /app
ENV CI=true NODE_ENV=production
RUN npm install -g pnpm@11.5.0

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["sh", "-c", "sh node_modules/.bin/prisma migrate deploy && node dist/src/main"]
