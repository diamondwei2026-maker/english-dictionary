# ============================================
# Stage 1: Builder — compile TypeScript
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (includes devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ============================================
# Stage 2: Production — minimal runtime image
# ============================================
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user (already exists in node:18-alpine)
# Copy only production artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Security: run as non-root
USER node

EXPOSE 3001

# Health check using Node.js built-in http (wget not available on Alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{const s=JSON.parse(d);process.exit(s.status==='ok'?0:1)}catch{process.exit(1)}});}).on('error',()=>process.exit(1))"

CMD ["node", "dist/index.js"]
