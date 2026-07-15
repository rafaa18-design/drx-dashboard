# syntax=docker/dockerfile:1
# =============================================================================
# DRX CRM Dashboard (Next.js 15) — Cloud Run Dockerfile
# Multi-stage standalone build. NEXT_PUBLIC_* são baked em build time.
# =============================================================================

# ---- Builder ----------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Variáveis públicas precisam existir ANTES do build (Next as injeta no bundle)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runner -----------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Standalone output + static assets
# O build "standalone" do Next.js NAO inclui public/ automaticamente —
# sem essa linha, arquivos como a logo (public/logo-oficial.png) davam 404
# em produção mesmo estando no repositorio.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
ENV PORT=8080

CMD ["node", "server.js"]
