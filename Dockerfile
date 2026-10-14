# Multi-stage Ultra-Lean Dockerfile (Frontend + Backend in One 40MB Container)
FROM node:22-alpine AS builder

WORKDIR /app

# 1. Build Frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. Build Backend
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

# 3. Production Runner Stage (Minimal footprint)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built backend & frontend static assets
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/dist ./frontend/dist

# Create persistent data volume for hourly retention
RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
