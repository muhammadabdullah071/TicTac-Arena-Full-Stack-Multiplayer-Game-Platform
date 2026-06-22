FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY apps/socket/package.json ./apps/socket/
RUN npm ci --workspaces --include-workspace-root

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run -w packages/shared build
RUN npm run -w packages/database build
RUN npm run -w apps/socket build

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 socket
COPY --from=builder /app/apps/socket/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
USER socket
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
