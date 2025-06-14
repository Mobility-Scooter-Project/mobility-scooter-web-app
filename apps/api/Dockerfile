FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.3.0 --activate

FROM base AS builder

RUN apk add --no-cache gcompat
WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY src ./src

RUN pnpm install --frozen-lockfile && \
    pnpm run build && \
    pnpm prune --prod

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/dist /app/dist
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json

USER hono
EXPOSE 3000

CMD ["node", "/app/dist/index.js"]